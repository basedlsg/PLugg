/**
 * World Instruments Controls for Strudel
 *
 * Registers the sacred controls as proper Strudel pattern controls.
 */

import { registerControl } from '@strudel/core';

/**
 * Filter cutoff brightness for world instruments
 *
 * @name brilliance
 * @param {number | Pattern} value Brightness from 0 to 1
 * @example
 * note("c4 e4 g4").world().brilliance(0.8)
 * @example
 * note("c4 e4 g4").world().brilliance(sine.range(0.3, 0.9).slow(4))
 */
export const { brilliance } = registerControl('brilliance');

/**
 * Vibrato/modulation depth for world instruments
 *
 * @name motion
 * @param {number | Pattern} value Motion amount from 0 to 1
 * @example
 * note("c4 e4 g4").world().motion(0.3)
 * @example
 * note("c4 e4 g4").world().motion(tri.range(0, 0.5).slow(8))
 */
export const { motion } = registerControl('motion');

/**
 * Delay/reverb mix for world instruments
 *
 * @name space
 * @param {number | Pattern} value Space amount from 0 to 1
 * @example
 * note("c4 e4 g4").world().space(0.4)
 */
export const { space } = registerControl('space');

/**
 * Tone warmth/coloration for world instruments
 *
 * @name warmth
 * @param {number | Pattern} value Warmth from 0 to 1
 * @example
 * note("c4 e4 g4").world().warmth(0.7)
 */
export const { warmth } = registerControl('warmth');

/**
 * Harmonic content/purity for world instruments
 *
 * @name purity
 * @param {number | Pattern} value Purity from 0 to 1
 * @example
 * note("c4 e4 g4").world().purity(0.6)
 */
export const { purity } = registerControl('purity');

/**
 * World scale selection
 *
 * @name worldScale
 * @param {string | number | Pattern} scale Scale name or number (0-8)
 * @example
 * note("c4 e4 g4").world().worldScale("celtic")
 * @example
 * note("c4 e4 g4").world().worldScale(3) // Indonesian Slendro
 */
export const { worldScale } = registerControl('scale');

/**
 * Waveform selection for world instruments
 *
 * @name worldWaveform
 * @param {string | Pattern} waveform One of: sine, sawtooth, square, triangle
 * @example
 * note("c4 e4 g4").world().worldWaveform("sawtooth")
 */
export const { worldWaveform } = registerControl('waveform');

/**
 * Delay time for world instruments
 *
 * @name worldDelaytime
 * @param {number | Pattern} time Delay time in seconds
 * @example
 * note("c4 e4 g4").world().worldDelaytime(0.5)
 */
export const { worldDelaytime } = registerControl('delaytime');

/**
 * Delay feedback for world instruments
 *
 * @name worldDelayfeedback
 * @param {number | Pattern} feedback Feedback amount from 0 to 1
 * @example
 * note("c4 e4 g4").world().worldDelayfeedback(0.5)
 */
export const { worldDelayfeedback } = registerControl('delayfeedback');
