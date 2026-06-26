import { scorePrayerMatPalette } from '../prayerMatVerification';

describe('scorePrayerMatPalette', () => {
  it('accepts a multi-color patterned palette', () => {
    const result = scorePrayerMatPalette([
      '#8B1E2D',
      '#1E3A5F',
      '#C9A227',
      '#F5E6D3',
    ]);

    expect(result.verified).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(55);
  });

  it('rejects a flat gray photo', () => {
    const result = scorePrayerMatPalette(['#808080', '#7E7E7E', '#828282']);

    expect(result.verified).toBe(false);
    expect(result.message).toMatch(/patterned surface|prayer mat/i);
  });

  it('rejects a very dark photo', () => {
    const result = scorePrayerMatPalette(['#050505', '#0A0A0A', '#030303']);

    expect(result.verified).toBe(false);
    expect(result.message).toMatch(/too dark/i);
  });
});
