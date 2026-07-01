from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import CLIPProcessor, CLIPModel
import torch
from PIL import Image
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# Loaded once at startup
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
model.eval()

MAT_LABELS = ["prayer mat", "prayer rug", "rug", "carpet"]
NON_MAT_LABELS = ["wall", "ceiling", "bed", "furniture", "bare floor", "person", "phone screen"]
ALL_LABELS = MAT_LABELS + NON_MAT_LABELS

# Sum of mat label probabilities must exceed this
CONFIDENCE_THRESHOLD = 0.45


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/verify-prayer-mat")
async def verify_prayer_mat(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    contents = await image.read()
    try:
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode image.")

    inputs = processor(text=ALL_LABELS, images=pil_image, return_tensors="pt", padding=True)
    with torch.no_grad():
        outputs = model(**inputs)

    probs = outputs.logits_per_image[0].softmax(dim=0).tolist()
    scores = dict(zip(ALL_LABELS, probs))

    mat_score = sum(scores[l] for l in MAT_LABELS)
    top_non_mat = max(NON_MAT_LABELS, key=lambda l: scores[l])
    confidence_pct = round(mat_score * 100)

    if mat_score >= CONFIDENCE_THRESHOLD:
        return {
            "verified": True,
            "confidence": confidence_pct,
            "message": "Prayer mat detected — you're good to confirm.",
        }

    if scores[top_non_mat] > 0.5:
        return {
            "verified": False,
            "confidence": confidence_pct,
            "message": f"This looks like a {top_non_mat}. Point your camera at your prayer mat and retake.",
        }

    return {
        "verified": False,
        "confidence": confidence_pct,
        "message": "Not confident enough. Ensure good lighting and retake with the mat centered.",
    }
