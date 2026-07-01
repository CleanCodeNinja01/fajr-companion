// Prayer mat verification via self-hosted CLIP backend (FastAPI + transformers)
// Free to run — see /backend/main.py

export type PrayerMatVerification = {
  verified: boolean;
  confidence: number;
  message: string;
};

type BackendResponse = {
  verified: boolean;
  confidence: number;
  message: string;
};

export async function verifyPrayerMatPhoto(uri: string): Promise<PrayerMatVerification> {
  const apiUrl = process.env.EXPO_PUBLIC_VERIFICATION_API_URL ?? '';
  if (!apiUrl) {
    return {
      verified: false,
      confidence: 0,
      message: 'Verification unavailable. Add EXPO_PUBLIC_VERIFICATION_API_URL to your .env file.',
    };
  }

  const formData = new FormData();
  formData.append('image', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  let data: BackendResponse;
  try {
    const response = await fetch(`${apiUrl}/verify-prayer-mat`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      console.warn('Verification backend error:', response.status, err);
      return {
        verified: false,
        confidence: 0,
        message: 'Verification service error. Please try again.',
      };
    }

    data = await response.json();
  } catch (e) {
    console.warn('verifyPrayerMatPhoto failed:', e);
    return {
      verified: false,
      confidence: 0,
      message: 'Could not reach verification service. Check your connection and try again.',
    };
  }

  return {
    verified: data.verified,
    confidence: data.confidence,
    message: data.message,
  };
}
