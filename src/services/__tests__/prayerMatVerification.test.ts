import { verifyPrayerMatPhoto } from '../prayerMatVerification';

const FAKE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function mockVision(labels: Array<{ description: string; score: number }>, status = 200) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: status === 200,
    status,
    text: () => Promise.resolve('error'),
    json: () => Promise.resolve({
      responses: [{ labelAnnotations: labels }],
    }),
  } as unknown as Response);
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY = 'test-key';
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('verifyPrayerMatPhoto', () => {
  it('verifies when a high-confidence rug label is returned', async () => {
    mockVision([
      { description: 'Prayer rug', score: 0.94 },
      { description: 'Textile', score: 0.88 },
    ]);

    const result = await verifyPrayerMatPhoto(FAKE_BASE64);

    expect(result.verified).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(70);
  });

  it('verifies on a generic carpet label with high score', async () => {
    mockVision([
      { description: 'Carpet', score: 0.91 },
      { description: 'Floor', score: 0.75 },
    ]);

    const result = await verifyPrayerMatPhoto(FAKE_BASE64);

    expect(result.verified).toBe(true);
  });

  it('rejects when no mat-related labels are returned', async () => {
    mockVision([
      { description: 'Wall', score: 0.97 },
      { description: 'Green', score: 0.85 },
    ]);

    const result = await verifyPrayerMatPhoto(FAKE_BASE64);

    expect(result.verified).toBe(false);
    expect(result.message).toMatch(/no prayer mat/i);
  });

  it('rejects when mat label is present but confidence is too low', async () => {
    mockVision([
      { description: 'Rug', score: 0.45 },
    ]);

    const result = await verifyPrayerMatPhoto(FAKE_BASE64);

    expect(result.verified).toBe(false);
    expect(result.message).toMatch(/confidence too low/i);
  });

  it('returns error when API key is missing', async () => {
    process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY = '';

    const result = await verifyPrayerMatPhoto(FAKE_BASE64);

    expect(result.verified).toBe(false);
    expect(result.message).toMatch(/EXPO_PUBLIC_GOOGLE_VISION_API_KEY/i);
  });

  it('returns error when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

    const result = await verifyPrayerMatPhoto(FAKE_BASE64);

    expect(result.verified).toBe(false);
    expect(result.message).toMatch(/connection/i);
  });

  it('returns error on non-200 response', async () => {
    mockVision([], 403);

    const result = await verifyPrayerMatPhoto(FAKE_BASE64);

    expect(result.verified).toBe(false);
    expect(result.message).toMatch(/service error/i);
  });
});
