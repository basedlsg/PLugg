/**
 * Strudel Pattern Functions for World Instruments
 *
 * Adds pattern methods for working with pentatonic scales
 * and world instrument parameters.
 */

import { Pattern, register } from '@strudel/core';
import { ScaleType, parseScale, getScaleRatios, scaleNames } from './scales.mjs';

/**
 * Set the world scale for a pattern
 * @example
 * note("c4 e4 g4").worldScale("japanese")
 * note("c4 e4 g4").worldScale(0) // Japanese Yo
 */
const worldScale = register('worldScale', (scale, pat) => {
  const scaleType = parseScale(scale);
  return pat.set({ scale: scaleType });
});

/**
 * Set brilliance (filter cutoff) for world synths
 * @example
 * note("c4 e4").world().brilliance(0.8)
 */
const brilliance = register('brilliance', (value, pat) => {
  return pat.set({ brilliance: value });
});

/**
 * Set motion (vibrato) for world synths
 * @example
 * note("c4 e4").world().motion(0.5)
 */
const motion = register('motion', (value, pat) => {
  return pat.set({ motion: value });
});

/**
 * Set space (delay/reverb) for world synths
 * @example
 * note("c4 e4").world().space(0.3)
 */
const space = register('space', (value, pat) => {
  return pat.set({ space: value });
});

/**
 * Set warmth (tone coloration) for world synths
 * @example
 * note("c4 e4").world().warmth(0.7)
 */
const warmth = register('warmth', (value, pat) => {
  return pat.set({ warmth: value });
});

/**
 * Set purity (harmonic content) for world synths
 * @example
 * note("c4 e4").world().purity(0.6)
 */
const purity = register('purity', (value, pat) => {
  return pat.set({ purity: value });
});

/**
 * Convenience method to use world synth sound
 * @example
 * note("c4 e4 g4 a4").world()
 */
const world = register('world', (pat) => {
  return pat.s('world');
});

/**
 * Use Japanese Yo scale synth
 * @example
 * note("c4 d4 e4 g4 a4").yo()
 */
const yo = register('yo', (pat) => {
  return pat.s('yo');
});

/**
 * Use Chinese Gong scale synth
 * @example
 * note("c4 d4 e4 g4 a4").gong()
 */
const gong = register('gong', (pat) => {
  return pat.s('gong');
});

/**
 * Use Celtic scale synth
 * @example
 * note("c4 d4 f4 g4 bb4").celtic()
 */
const celtic = register('celtic', (pat) => {
  return pat.s('celtic');
});

/**
 * Use Indonesian Slendro scale synth
 * @example
 * note("c4 d4 e4 g4 a4").slendro()
 */
const slendro = register('slendro', (pat) => {
  return pat.s('slendro');
});

/**
 * Use Scottish Highland scale synth
 * @example
 * note("c4 d4 f4 g4 bb4").highland()
 */
const highland = register('highland', (pat) => {
  return pat.s('highland');
});

/**
 * Use Mongolian Throat scale synth
 * @example
 * note("c4 eb4 f4 g4 bb4").throat()
 */
const throat = register('throat', (pat) => {
  return pat.s('throat');
});

/**
 * Use Egyptian Sacred scale synth
 * @example
 * note("c4 d4 e4 g4 a4").sacred()
 */
const sacred = register('sacred', (pat) => {
  return pat.s('sacred');
});

/**
 * Use Native American scale synth
 * @example
 * note("c4 eb4 f4 g4 bb4").native()
 */
const native = register('native', (pat) => {
  return pat.s('native');
});

/**
 * Use Nordic Aurora scale synth
 * @example
 * note("c4 d4 f4 g4 bb4").aurora()
 */
const aurora = register('aurora', (pat) => {
  return pat.s('aurora');
});

/**
 * Apply all five sacred controls at once
 * @example
 * note("c4 e4 g4").world().sacred5(0.8, 0.2, 0.3, 0.6, 0.5)
 * // brilliance, motion, space, warmth, purity
 */
const sacred5 = register('sacred5', (b, m, sp, w, p, pat) => {
  return pat.set({
    brilliance: b,
    motion: m,
    space: sp,
    warmth: w,
    purity: p
  });
});

/**
 * Generate a pentatonic sequence in a specific scale
 * Returns degrees 0-4 mapped to the scale
 * @example
 * pentatonic("0 1 2 3 4").world().worldScale("japanese")
 */
const pentatonic = (pattern) => {
  return Pattern.reify(pattern).fmap((degree) => {
    // Map degree to pentatonic note (0-4 maps to C D E G A in major pentatonic)
    const pentatonicMidi = [60, 62, 64, 67, 69]; // C4 pentatonic
    const deg = Math.floor(degree) % 5;
    const octave = Math.floor(degree / 5);
    return pentatonicMidi[deg] + octave * 12;
  }).note();
};

// Export all pattern functions
export {
  worldScale,
  brilliance,
  motion,
  space,
  warmth,
  purity,
  world,
  yo,
  gong,
  celtic,
  slendro,
  highland,
  throat,
  sacred,
  native,
  aurora,
  sacred5,
  pentatonic
};

// Also export scale info for documentation
export { ScaleType, scaleNames };
