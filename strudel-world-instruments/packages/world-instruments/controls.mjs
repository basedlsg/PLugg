/**
 * World Instruments Controls for Strudel
 *
 * Registers the 5 sacred controls for the 3-layer additive synthesizer.
 * Each control provides expressive access to the synthesis parameters.
 */

import { registerControl } from '@strudel/core';

// =============================================================================
// CORE CONTROLS (The 5 Sacred Controls)
// =============================================================================

/**
 * Filter cutoff brightness for world instruments
 * Controls the air layer presence and body layer filter
 *
 * @name brilliance
 * @param {number | Pattern} value Brightness from 0 to 1
 * @example
 * // Static brilliance
 * note("c4 e4 g4").world().brilliance(0.8)
 * @example
 * // Animated brilliance for sweeping texture
 * note("c4 e4 g4").world().brilliance(sine.range(0.3, 0.9).slow(4))
 */
export const { brilliance } = registerControl('brilliance');

/**
 * LFO amount to pitch/filter/amp for world instruments
 * Creates organic movement through FM between partials
 *
 * @name motion
 * @param {number | Pattern} value Motion amount from 0 to 1
 * @example
 * // Subtle motion for gentle shimmer
 * note("c4 e4 g4").world().motion(0.3)
 * @example
 * // Animated motion for evolving texture
 * note("c4 e4 g4").world().motion(tri.range(0, 0.5).slow(8))
 */
export const { motion } = registerControl('motion');

/**
 * Reverb + delay mix for world instruments
 * Creates spatial depth and atmosphere
 *
 * @name space
 * @param {number | Pattern} value Space amount from 0 to 1
 * @example
 * // Medium reverb/delay
 * note("c4 e4 g4").world().space(0.4)
 * @example
 * // Building atmosphere
 * note("c4 e4 g4").world().space(sine.range(0.2, 0.7).slow(16))
 */
export const { space } = registerControl('space');

/**
 * Chorus/detune spread for world instruments
 * Controls the detuning of body partials (plus/minus 50 cents max)
 *
 * @name warmth
 * @param {number | Pattern} value Warmth from 0 to 1
 * @example
 * // Rich warm tone
 * note("c4 e4 g4").world().warmth(0.7)
 * @example
 * // Cold to warm transition
 * note("c4 e4 g4").world().warmth(sine.range(0, 0.8).slow(12))
 */
export const { warmth } = registerControl('warmth');

/**
 * Slow random modulation amount for world instruments
 * Creates spectral wandering over 30-60 second cycles
 *
 * @name drift
 * @param {number | Pattern} value Drift amount from 0 to 1
 * @example
 * // Gentle spectral drift
 * note("c4 e4 g4").world().drift(0.4)
 * @example
 * // Long evolving drone
 * note("c3").world().drift(0.8).space(0.5).sustain(30)
 */
export const { drift } = registerControl('drift');

// =============================================================================
// SCALE AND SYNTHESIS CONTROLS
// =============================================================================

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

// =============================================================================
// ENVELOPE CONTROLS (Standard ADSR)
// =============================================================================

// Note: attack, decay, sustain, release are provided by @strudel/core
// They work automatically with world instruments

// =============================================================================
// UTILITY PATTERNS
// =============================================================================

/**
 * Apply all 5 sacred controls at once
 * Convenience method for setting the complete timbral character
 *
 * Usage: .sacred5(brilliance, motion, space, warmth, drift)
 *
 * @example
 * // Bright, moving, spacious, warm, drifting
 * note("c4 e4 g4").world().sacred5(0.8, 0.3, 0.5, 0.7, 0.4)
 */

// =============================================================================
// CONTROL DOCUMENTATION
// =============================================================================

/**
 * World Instruments - 5 Sacred Controls
 *
 * These controls shape the sound of the 3-layer additive synthesizer:
 *
 * BRILLIANCE (0-1)
 * - Controls air layer filtered noise center frequency
 * - Controls body layer lowpass filter cutoff
 * - Higher values = brighter, more present sound
 *
 * MOTION (0-1)
 * - Amount of FM modulation between body partials
 * - Amplitude modulation on air layer partials
 * - Uses prime-related rates (7Hz, 11Hz, 13Hz)
 * - Higher values = more organic, shimmering movement
 *
 * SPACE (0-1)
 * - Delay time and wet/dry mix
 * - Feedback amount with filtering
 * - Higher values = more reverberant, atmospheric
 *
 * WARMTH (0-1)
 * - Detune spread of body partials (plus/minus 50 cents)
 * - Higher values = chorused, rich, analog-like tone
 *
 * DRIFT (0-1)
 * - Slow random modulation (30-60 second cycles)
 * - Individual drift rate per partial
 * - Higher values = more spectral wandering
 *
 * TEMPORAL QUALITIES:
 * - Breathing: 12 second amplitude cycles on body layer
 * - Spectral drift: 30-60 second partial detune cycles
 * - Polyrhythmic LFOs at prime rates
 *
 * 3-LAYER ARCHITECTURE:
 * - SUB: Pure sine one octave below (foundation/weight)
 * - BODY: 8 partials at just intonation ratios (character)
 * - AIR: High partials + filtered noise (breath/presence)
 */
