import { verifyPrayerMatPhoto } from '../prayerMatVerification';

const FAKE_URI = 'file:///data/user/0/com.fajrcompanion/cache/photo.jpg';

function mockBackend(body: object, status = 200) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
  } as unknown as Response);
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_VERIFICATION_API_URL = 'http://192.168.1.1:8000';
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('verifyPrayerMatPhoto', () => {
  it('returns verified when backend confirms prayer mat', async () => {
    mockBackend({ verified: true, confidence: 82, message: "Prayer mat detected — you're good to confirm." });

    const result = await verifyPrayerMatPhoto(FAKE_URI);

    expect(result.verified).toBe(true);
    expect(result.confidence).toBe(82);
  });

  it('rejects when backend says not a prayer mat', async () => {
    mockBackend({ verified: false, confidence: 8, message: 'This looks like a wall. Point your camera at your prayer mat and retake.' });

    const result = await verifyPrayerMatPhoto(FAKE_URI);

    expect(result.verified).toBe(false);
    expect(result.message).toMatch(/wall/i);
  });

  it('returns error when API URL is missing', async () => {
    process.env.EXPO_PUBLIC_VERIFICATION_API_URL = '';

    const result = await verifyPrayerMatPhoto(FAKE_URI);

    expect(result.verified).toBe(false);
    expect(result.message).toMatch(/EXPO_PUBLIC_VERIFICATION_API_URL/i);
  });

  it('returns error when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

    const result = await verifyPrayerMatPhoto(FAKE_URI);

    expect(result.verified).toBe(false);
    expect(result.message).toMatch(/connection/i);
  });

  it('returns error on non-200 response', async () => {
    mockBackend({ detail: 'Internal server error' }, 500);

    const result = await verifyPrayerMatPhoto(FAKE_URI);

    expect(result.verified).toBe(false);
    expect(result.message).toMatch(/service error/i);
  });
});
