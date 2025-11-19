import { describe, it, expect } from 'vitest';
import {
  ScaleType,
  scaleRatios,
  midiToJustFrequency,
  parseScale,
  getScaleRatios,
  chromaticToPentatonic
} from '../scales.mjs';

describe('ScaleType', () => {
  it('should have 9 scale types', () => {
    expect(Object.keys(ScaleType)).toHaveLength(9);
  });

  it('should have correct values', () => {
    expect(ScaleType.JAPANESE_YO).toBe(0);
    expect(ScaleType.NORDIC_AURORA).toBe(8);
  });
});

describe('scaleRatios', () => {
  it('should have ratios for all scales', () => {
    for (let i = 0; i < 9; i++) {
      expect(scaleRatios[i]).toBeDefined();
      expect(scaleRatios[i]).toHaveLength(5);
    }
  });

  it('should have root ratio of 1.0 for all scales', () => {
    for (let i = 0; i < 9; i++) {
      expect(scaleRatios[i][0]).toBe(1.0);
    }
  });

  it('should have correct Japanese Yo ratios', () => {
    const yo = scaleRatios[ScaleType.JAPANESE_YO];
    expect(yo[0]).toBe(1);        // Root
    expect(yo[1]).toBe(9/8);      // Major 2nd
    expect(yo[2]).toBe(81/64);    // Pythagorean major 3rd
    expect(yo[3]).toBe(3/2);      // Perfect 5th
    expect(yo[4]).toBe(27/16);    // Pythagorean major 6th
  });

  it('should have correct Egyptian Sacred ratios (5-limit)', () => {
    const sacred = scaleRatios[ScaleType.EGYPTIAN_SACRED];
    expect(sacred[2]).toBe(5/4);   // Just major 3rd
    expect(sacred[4]).toBe(5/3);   // Just major 6th
  });
});

describe('midiToJustFrequency', () => {
  it('should return 440 Hz for A4 (MIDI 69) at root', () => {
    // MIDI 69 is A4
    const freq = midiToJustFrequency(69, ScaleType.JAPANESE_YO, 440);
    // Should map to nearest pentatonic degree
    expect(freq).toBeCloseTo(440, 1);
  });

  it('should apply octave correctly', () => {
    const freq1 = midiToJustFrequency(60, ScaleType.JAPANESE_YO, 440);
    const freq2 = midiToJustFrequency(72, ScaleType.JAPANESE_YO, 440);
    // Octave apart should be 2:1 ratio
    expect(freq2 / freq1).toBeCloseTo(2, 2);
  });

  it('should use just intonation ratios', () => {
    // Test that different scales produce different frequencies
    const freqYo = midiToJustFrequency(64, ScaleType.JAPANESE_YO, 440);
    const freqSacred = midiToJustFrequency(64, ScaleType.EGYPTIAN_SACRED, 440);
    // These should be different due to different 3rd ratios
    expect(freqYo).not.toBeCloseTo(freqSacred, 1);
  });
});

describe('parseScale', () => {
  it('should parse scale numbers', () => {
    expect(parseScale(0)).toBe(0);
    expect(parseScale(5)).toBe(5);
    expect(parseScale(8)).toBe(8);
  });

  it('should clamp out of range numbers', () => {
    expect(parseScale(-1)).toBe(0);
    expect(parseScale(100)).toBe(8);
  });

  it('should parse scale names', () => {
    expect(parseScale('japanese')).toBe(ScaleType.JAPANESE_YO);
    expect(parseScale('yo')).toBe(ScaleType.JAPANESE_YO);
    expect(parseScale('celtic')).toBe(ScaleType.CELTIC);
    expect(parseScale('mongolian')).toBe(ScaleType.MONGOLIAN_THROAT);
  });

  it('should be case insensitive', () => {
    expect(parseScale('JAPANESE')).toBe(ScaleType.JAPANESE_YO);
    expect(parseScale('Celtic')).toBe(ScaleType.CELTIC);
  });

  it('should default to Japanese Yo for unknown names', () => {
    expect(parseScale('unknown')).toBe(ScaleType.JAPANESE_YO);
  });
});

describe('getScaleRatios', () => {
  it('should return correct ratios for each scale', () => {
    const yo = getScaleRatios(ScaleType.JAPANESE_YO);
    expect(yo).toEqual(scaleRatios[ScaleType.JAPANESE_YO]);
  });

  it('should default to Japanese Yo for invalid scale', () => {
    const defaultRatios = getScaleRatios(999);
    expect(defaultRatios).toEqual(scaleRatios[ScaleType.JAPANESE_YO]);
  });
});

describe('chromaticToPentatonic', () => {
  it('should have 12 mappings', () => {
    expect(chromaticToPentatonic).toHaveLength(12);
  });

  it('should map to degrees 0-4', () => {
    chromaticToPentatonic.forEach(degree => {
      expect(degree).toBeGreaterThanOrEqual(0);
      expect(degree).toBeLessThanOrEqual(4);
    });
  });
});
