// Heuristic prayer-mat check from photo colors (pattern + texture cues, offline)
import { Image } from 'react-native';

/** Minimal shape from react-native-image-colors — defined locally so we never import that package at load time. */
type ImageColorsResult = {
  platform: 'ios' | 'android' | 'web';
  background?: string;
  primary?: string;
  secondary?: string;
  detail?: string;
  dominant?: string;
  average?: string;
  vibrant?: string;
  darkVibrant?: string;
  lightVibrant?: string;
  muted?: string;
  darkMuted?: string;
  lightMuted?: string;
};

export type PrayerMatVerification = {
  verified: boolean;
  confidence: number;
  message: string;
};

type Rgb = { r: number; g: number; b: number };

const VERIFY_THRESHOLD = 0.55;

function hexToRgb(hex: string): Rgb | null {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6 && normalized.length !== 8) return null;
  const slice = normalized.length === 8 ? normalized.slice(0, 6) : normalized;
  const value = Number.parseInt(slice, 16);
  if (Number.isNaN(value)) return null;
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function luminance({ r, g, b }: Rgb): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function saturation({ r, g, b }: Rgb): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === 0) return 0;
  return (max - min) / max;
}

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function paletteFromResult(result: ImageColorsResult): string[] {
  if (result.platform === 'ios') {
    return [result.background, result.primary, result.secondary, result.detail];
  }
  return [
    result.dominant,
    result.average,
    result.vibrant,
    result.darkVibrant,
    result.lightVibrant,
    result.muted,
    result.darkMuted,
    result.lightMuted,
  ];
}

type ImageColorsModule = {
  getColors: (uri: string, config: object) => Promise<ImageColorsResult>;
};

/** Load only when the native module exists (dev build). require() throws in Expo Go. */
function loadImageColorsModule(): ImageColorsModule | null {
  try {
    return require('react-native-image-colors').default as ImageColorsModule;
  } catch {
    return null;
  }
}

async function extractPalette(uri: string): Promise<string[] | null> {
  const ImageColors = loadImageColorsModule();
  if (!ImageColors) return null;
  try {
    const result = await ImageColors.getColors(uri, {
      fallback: '#3D2030',
      cache: false,
      key: uri.slice(-120),
    });
    return paletteFromResult(result);
  } catch {
    return null;
  }
}

/** Basic fallback when native color extraction is unavailable (old dev build). */
async function fallbackVerify(uri: string): Promise<PrayerMatVerification> {
  return new Promise(resolve => {
    Image.getSize(
      uri,
      (width, height) => {
        if (width < 240 || height < 240) {
          resolve({
            verified: false,
            confidence: 0,
            message: 'Photo resolution is too low. Move closer to your prayer mat.',
          });
          return;
        }
        resolve({
          verified: true,
          confidence: 55,
          message: 'Photo accepted.',
        });
      },
      () => {
        resolve({
          verified: false,
          confidence: 0,
          message: 'Could not read the photo. Please try again.',
        });
      },
    );
  });
}

/** Score how likely a palette looks like a patterned rug / prayer mat. Exported for tests. */
export function scorePrayerMatPalette(hexColors: string[]): PrayerMatVerification {
  const rgbs = hexColors
    .map(hexToRgb)
    .filter((c): c is Rgb => c !== null);

  if (rgbs.length < 2) {
    return {
      verified: false,
      confidence: 0,
      message: 'Could not read the photo. Please try again.',
    };
  }

  const saturated = rgbs.filter(c => saturation(c) >= 0.12);
  const distinctPairs = rgbs.filter((c, i) =>
    rgbs.some((other, j) => i !== j && colorDistance(c, other) >= 28),
  );

  const avgLuminance = rgbs.reduce((sum, c) => sum + luminance(c), 0) / rgbs.length;

  let score = 0;
  if (saturated.length >= 2) score += 0.35;
  else if (saturated.length === 1) score += 0.15;

  if (distinctPairs.length >= 2) score += 0.35;
  if (rgbs.length >= 3) score += 0.1;
  if (avgLuminance >= 0.08 && avgLuminance <= 0.9) score += 0.2;

  const verified = score >= VERIFY_THRESHOLD;
  const confidence = Math.round(Math.min(1, score) * 100);

  if (verified) {
    return {
      verified: true,
      confidence,
      message: 'Prayer mat detected — you’re good to confirm.',
    };
  }

  if (avgLuminance < 0.08) {
    return {
      verified: false,
      confidence,
      message: 'Photo is too dark. Turn on a light and point at your prayer mat.',
    };
  }

  if (avgLuminance > 0.9 && saturated.length < 2) {
    return {
      verified: false,
      confidence,
      message: 'This looks like a blank wall or ceiling. Frame your prayer mat instead.',
    };
  }

  if (saturated.length < 2) {
    return {
      verified: false,
      confidence,
      message: 'No patterned surface found. Make sure your prayer mat fills the frame.',
    };
  }

  return {
    verified: false,
    confidence,
    message: 'Could not detect a prayer mat. Retake the photo with the mat centered.',
  };
}

export async function verifyPrayerMatPhoto(uri: string): Promise<PrayerMatVerification> {
  const palette = await extractPalette(uri);
  if (palette) return scorePrayerMatPalette(palette);
  return fallbackVerify(uri);
}
