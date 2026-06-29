// Server-side prayer mat verification via Google Cloud Vision label detection
// Free tier: 1,000 requests/month — https://cloud.google.com/vision/pricing

const CONFIDENCE_THRESHOLD = 0.7;

// Labels from Cloud Vision that indicate a prayer mat / rug / textile surface
const MAT_LABELS = [
  'prayer rug', 'prayer mat', 'rug', 'carpet', 'mat', 'textile',
  'kilim', 'tapestry', 'woven fabric', 'floor mat', 'area rug',
];

export type PrayerMatVerification = {
  verified: boolean;
  confidence: number;
  message: string;
};

type VisionLabel = {
  description: string;
  score: number;
};

type VisionResponse = {
  responses: Array<{
    labelAnnotations?: VisionLabel[];
    error?: { message: string };
  }>;
};

export async function verifyPrayerMatPhoto(
  base64: string,
): Promise<PrayerMatVerification> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY ?? '';
  if (!apiKey) {
    return {
      verified: false,
      confidence: 0,
      message: 'Verification unavailable. Add EXPO_PUBLIC_GOOGLE_VISION_API_KEY to your .env file.',
    };
  }

  let labels: VisionLabel[];
  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: 'LABEL_DETECTION', maxResults: 20 }],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      console.warn('Cloud Vision error:', response.status, err);
      return {
        verified: false,
        confidence: 0,
        message: 'Verification service error. Please try again.',
      };
    }

    const json: VisionResponse = await response.json();
    const result = json.responses?.[0];

    if (result?.error) {
      console.warn('Cloud Vision API error:', result.error.message);
      return {
        verified: false,
        confidence: 0,
        message: 'Verification service error. Please try again.',
      };
    }

    labels = result?.labelAnnotations ?? [];
  } catch (e) {
    console.warn('verifyPrayerMatPhoto failed:', e);
    return {
      verified: false,
      confidence: 0,
      message: 'Could not reach verification service. Check your connection and try again.',
    };
  }

  // Find the highest-scoring label that matches a mat/rug/textile term
  let bestScore = 0;
  let bestLabel = '';
  for (const label of labels) {
    const name = label.description.toLowerCase();
    if (MAT_LABELS.some(term => name.includes(term))) {
      if (label.score > bestScore) {
        bestScore = label.score;
        bestLabel = label.description;
      }
    }
  }

  const confidencePct = Math.round(bestScore * 100);

  if (bestScore >= CONFIDENCE_THRESHOLD) {
    return {
      verified: true,
      confidence: confidencePct,
      message: `Prayer mat detected — you're good to confirm.`,
    };
  }

  if (bestScore > 0) {
    return {
      verified: false,
      confidence: confidencePct,
      message: `Detected "${bestLabel}" but confidence too low. Ensure good lighting and retake with the mat centered.`,
    };
  }

  return {
    verified: false,
    confidence: 0,
    message: 'No prayer mat found. Make sure your mat fills the frame and retake.',
  };
}
