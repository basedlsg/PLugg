/**
 * @strudel/world-instruments
 *
 * World instruments with 9 pentatonic scales using just intonation.
 * Based on CelestialSynth from PLugg.
 *
 * @example
 * // Basic usage with Japanese Yo scale
 * note("c4 d4 e4 g4 a4").yo().brilliance(0.7).motion(0.2)
 *
 * @example
 * // Using the generic world synth with scale selection
 * note("c4 e4 g4").world().worldScale("celtic").space(0.3)
 *
 * @example
 * // All five sacred controls
 * note("c4 d4 e4 g4").world().sacred5(0.8, 0.2, 0.3, 0.6, 0.5)
 */

import { registerWorldSynths } from './synth.mjs';
import './patterns.mjs';
import './controls.mjs';

// Re-export everything
export * from './scales.mjs';
export * from './synth.mjs';
export * from './patterns.mjs';
export * from './controls.mjs';
export * as examples from './examples.mjs';

// Initialize synths when module loads
registerWorldSynths();

export const packageName = '@strudel/world-instruments';

/**
 * World Instruments - Available Scales
 *
 * 1. Japanese Yo - Major pentatonic with Pythagorean 6th
 * 2. Chinese Gong - Pure Pythagorean major pentatonic
 * 3. Celtic - Sus4 pentatonic
 * 4. Indonesian Slendro - Approximated slendro tuning
 * 5. Scottish Highland - Sus4 pentatonic (bagpipe-like)
 * 6. Mongolian Throat - Minor pentatonic
 * 7. Egyptian Sacred - 5-limit just intonation major
 * 8. Native American - Minor pentatonic
 * 9. Nordic Aurora - Sus4 pentatonic
 *
 * 5 Sacred Controls:
 * - brilliance: Filter cutoff (0-1)
 * - motion: LFO amount to pitch/filter/amp (0-1)
 * - space: Reverb + delay mix (0-1)
 * - warmth: Chorus/detune spread (0-1)
 * - drift: Slow random modulation (0-1)
 *
 * 3-Layer Architecture:
 * - SUB: Pure sine one octave below fundamental
 * - BODY: 8 partials at just intonation ratios
 * - AIR: High partials + filtered noise
 */
