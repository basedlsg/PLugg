/**
 * World Instruments 3-Layer Additive Synthesizer for Strudel
 *
 * A sophisticated synthesizer featuring:
 * - 3-layer architecture (Sub, Body, Air)
 * - Just intonation pentatonic scales
 * - Organic temporal modulation
 * - 5 expressive controls
 */

import { registerSound } from '@strudel/webaudio';
import { getAudioContext } from '@strudel/webaudio';
import {
  gainNode,
  getADSRValues,
  getParamADSR,
} from '@strudel/webaudio';
import {
  midiToJustFrequency,
  parseScale,
  ScaleType,
  scaleNames
} from './scales.mjs';

// =============================================================================
// CONSTANTS
// =============================================================================

// Just intonation ratios for body partials (harmonically rich)
const BODY_PARTIALS = [
  1.0,      // Fundamental (1/1)
  3/2,      // Perfect 5th
  2.0,      // Octave
  5/4,      // Just major 3rd
  4/3,      // Perfect 4th
  5/3,      // Just major 6th
  9/8,      // Major 2nd
  7/4       // Harmonic 7th
];

// Air layer high partials (8th harmonic and above)
const AIR_PARTIALS = [
  8.0,      // 8th harmonic
  9.0,      // 9th harmonic
  10.0,     // 10th harmonic
  11.0,     // 11th harmonic (prime)
  13.0      // 13th harmonic (prime)
];

// Prime-related LFO rates for polyrhythmic modulation
const PRIME_RATES = {
  slow: [0.07, 0.11, 0.13],      // Very slow drift (7-13 seconds)
  medium: [0.7, 1.1, 1.3],       // Breathing rates
  fast: [7, 11, 13]              // Audio-rate modulation
};

// Breathing cycle period (seconds)
const BREATHING_PERIOD = 12;

// Spectral drift period range (seconds)
const DRIFT_PERIOD_MIN = 30;
const DRIFT_PERIOD_MAX = 60;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Parse note name to MIDI number
 */
function noteNameToMidi(noteName) {
  const noteMap = {
    'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11
  };

  const match = noteName.toLowerCase().match(/^([a-g])([#b]?)(-?\d+)?$/);
  if (!match) return 60;

  let [, note, accidental, octave] = match;
  let midi = noteMap[note];

  if (accidental === '#') midi += 1;
  if (accidental === 'b') midi -= 1;

  const oct = octave != null ? parseInt(octave) : 4;
  return midi + (oct + 1) * 12;
}

/**
 * Map Strudel value to frequency using just intonation
 */
function getWorldFrequency(value, scaleType) {
  const { note, freq } = value;

  if (freq != null) {
    return freq;
  }

  let midiNote = 60;
  if (note != null) {
    if (typeof note === 'number') {
      midiNote = note;
    } else if (typeof note === 'string') {
      midiNote = noteNameToMidi(note);
    }
  }

  return midiToJustFrequency(midiNote, scaleType, 440);
}

/**
 * Generate pseudo-random value from seed (for deterministic drift)
 * Uses simple PRNG to avoid GC
 */
function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// =============================================================================
// LAYER 1: SUB (Foundation)
// =============================================================================

/**
 * Create the sub-bass foundation layer
 * Pure sine wave one octave below fundamental
 */
function createSubLayer(ctx, frequency, startTime, endTime, release) {
  // Sub oscillator - one octave down
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = frequency / 2;

  // Gain for sub layer
  const gain = gainNode(0);

  // Simple envelope - always present, provides weight
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
  gain.gain.setValueAtTime(0.3, endTime);
  gain.gain.linearRampToValueAtTime(0, endTime + release);

  osc.connect(gain);
  osc.start(startTime);
  osc.stop(endTime + release + 0.1);

  return { osc, gain };
}

// =============================================================================
// LAYER 2: BODY (Character)
// =============================================================================

/**
 * Create the body layer with additive partials
 * Each partial has individual detuning, drift, and FM modulation
 */
function createBodyLayer(ctx, frequency, startTime, endTime, release, params) {
  const { warmth, drift, motion, brilliance } = params;

  const oscillators = [];
  const gains = [];
  const lfos = [];
  const fmOscs = [];

  // Calculate detune spread from warmth (±50 cents max)
  const maxDetuneCents = warmth * 50;

  // Body output mixer
  const bodyMix = gainNode(0);

  BODY_PARTIALS.forEach((ratio, index) => {
    const partialFreq = frequency * ratio;

    // Create oscillator for this partial
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = partialFreq;

    // Individual detuning based on warmth
    // Spread evenly across ± range, seeded by partial index
    const detuneOffset = (seededRandom(index * 7.3) - 0.5) * 2 * maxDetuneCents;
    osc.detune.value = detuneOffset;

    // Individual drift modulation (30-60 second cycles)
    if (drift > 0.01) {
      const driftLfo = ctx.createOscillator();
      driftLfo.type = 'sine';

      // Each partial gets unique drift period
      const driftPeriod = DRIFT_PERIOD_MIN +
        seededRandom(index * 11.7) * (DRIFT_PERIOD_MAX - DRIFT_PERIOD_MIN);
      driftLfo.frequency.value = 1 / driftPeriod;

      // Drift modulates detune (±30 cents at max drift)
      const driftGain = gainNode(drift * 30);
      driftLfo.connect(driftGain);
      driftGain.connect(osc.detune);

      driftLfo.start(startTime);
      lfos.push(driftLfo);
    }

    // FM modulation between adjacent partials (creates motion)
    if (motion > 0.01 && index < BODY_PARTIALS.length - 1) {
      const fmOsc = ctx.createOscillator();
      fmOsc.type = 'sine';

      // FM carrier at prime-related rate
      const fmRate = PRIME_RATES.fast[index % 3];
      fmOsc.frequency.value = fmRate;

      // FM depth based on motion parameter
      const fmGain = gainNode(motion * 20);
      fmOsc.connect(fmGain);
      fmGain.connect(osc.frequency);

      fmOsc.start(startTime);
      fmOscs.push(fmOsc);
    }

    // Amplitude envelope for this partial
    // Higher partials decay faster (natural acoustic behavior)
    const partialGain = gainNode(0);
    const amplitude = 1 / (1 + index * 0.3); // Natural rolloff

    // Envelope timing - higher partials have shorter decay
    const partialDecay = Math.max(0.05, 0.3 - index * 0.03);
    const partialSustain = Math.max(0.3, 0.7 - index * 0.05);

    partialGain.gain.setValueAtTime(0, startTime);
    partialGain.gain.linearRampToValueAtTime(amplitude, startTime + 0.01);
    partialGain.gain.linearRampToValueAtTime(amplitude * partialSustain, startTime + partialDecay);
    partialGain.gain.setValueAtTime(amplitude * partialSustain, endTime);
    partialGain.gain.linearRampToValueAtTime(0, endTime + release);

    // Connect partial to body mix
    osc.connect(partialGain);
    partialGain.connect(bodyMix);

    osc.start(startTime);
    osc.stop(endTime + release + 0.1);

    oscillators.push(osc);
    gains.push(partialGain);
  });

  // Breathing modulation on body output
  const breathLfo = ctx.createOscillator();
  breathLfo.type = 'sine';
  breathLfo.frequency.value = 1 / BREATHING_PERIOD;

  const breathGain = gainNode(0.1); // 10% amplitude variation
  breathLfo.connect(breathGain);
  breathGain.connect(bodyMix.gain);
  breathLfo.start(startTime);
  lfos.push(breathLfo);

  // Body filter for brilliance control
  const bodyFilter = ctx.createBiquadFilter();
  bodyFilter.type = 'lowpass';
  bodyFilter.frequency.value = 400 + brilliance * 8000;
  bodyFilter.Q.value = 0.7;

  bodyMix.connect(bodyFilter);

  // Master body envelope
  const bodyOut = gainNode(0);
  bodyFilter.connect(bodyOut);

  bodyOut.gain.setValueAtTime(0, startTime);
  bodyOut.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
  bodyOut.gain.setValueAtTime(0.4, endTime);
  bodyOut.gain.linearRampToValueAtTime(0, endTime + release);

  return {
    oscillators,
    gains,
    lfos,
    fmOscs,
    bodyMix,
    bodyFilter,
    bodyOut
  };
}

// =============================================================================
// LAYER 3: AIR (Breath)
// =============================================================================

/**
 * Create the air layer for presence and breath
 * Uses filtered noise and very high partials
 */
function createAirLayer(ctx, frequency, startTime, endTime, release, params) {
  const { brilliance, motion, drift } = params;

  // Air output mixer
  const airMix = gainNode(0);

  // High partial oscillators for shimmer
  const oscillators = [];
  const lfos = [];

  AIR_PARTIALS.forEach((ratio, index) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency * ratio;

    // Subtle amplitude modulation at prime rates
    const ampLfo = ctx.createOscillator();
    ampLfo.type = 'sine';
    ampLfo.frequency.value = PRIME_RATES.medium[index % 3];

    const ampGain = gainNode(0.02 * motion);
    ampLfo.connect(ampGain);

    // Air partial gain - very quiet
    const partialGain = gainNode(0);
    const amplitude = brilliance * 0.02 / (1 + index * 0.5);

    ampGain.connect(partialGain.gain);

    partialGain.gain.setValueAtTime(0, startTime);
    partialGain.gain.linearRampToValueAtTime(amplitude, startTime + 0.05);
    partialGain.gain.setValueAtTime(amplitude, endTime);
    partialGain.gain.linearRampToValueAtTime(0, endTime + release);

    osc.connect(partialGain);
    partialGain.connect(airMix);

    osc.start(startTime);
    osc.stop(endTime + release + 0.1);
    ampLfo.start(startTime);

    oscillators.push(osc);
    lfos.push(ampLfo);
  });

  // Noise component for breath texture
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);

  // Fill with white noise (pre-computed, no GC in audio thread)
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  // Bandpass filter for noise - centered around high frequencies
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 2000 + brilliance * 6000;
  noiseFilter.Q.value = 1.5;

  // Noise gain - responds strongly to brilliance
  const noiseGain = gainNode(0);
  const noiseLevel = brilliance * brilliance * 0.05;

  noiseGain.gain.setValueAtTime(0, startTime);
  noiseGain.gain.linearRampToValueAtTime(noiseLevel, startTime + 0.08);
  noiseGain.gain.setValueAtTime(noiseLevel, endTime);
  noiseGain.gain.linearRampToValueAtTime(0, endTime + release * 1.5);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(airMix);

  noiseSource.start(startTime);
  noiseSource.stop(endTime + release * 2);

  // Drift modulation on air brightness
  if (drift > 0.01) {
    const driftLfo = ctx.createOscillator();
    driftLfo.type = 'sine';
    driftLfo.frequency.value = 1 / 45; // 45 second cycle

    const driftGain = gainNode(drift * 2000);
    driftLfo.connect(driftGain);
    driftGain.connect(noiseFilter.frequency);

    driftLfo.start(startTime);
    lfos.push(driftLfo);
  }

  // Air output envelope
  const airOut = gainNode(0);
  airMix.connect(airOut);

  airOut.gain.setValueAtTime(0, startTime);
  airOut.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
  airOut.gain.setValueAtTime(0.3, endTime);
  airOut.gain.linearRampToValueAtTime(0, endTime + release);

  return {
    oscillators,
    lfos,
    noiseSource,
    noiseFilter,
    noiseGain,
    airMix,
    airOut
  };
}

// =============================================================================
// EFFECTS: SPACE (Reverb + Delay)
// =============================================================================

/**
 * Create space effects (delay + pseudo-reverb)
 */
function createSpaceEffects(ctx, spaceAmount) {
  if (spaceAmount < 0.01) {
    return null;
  }

  // Delay line
  const delay = ctx.createDelay(2.0);
  delay.delayTime.value = 0.3 + spaceAmount * 0.2;

  // Feedback with filtering (pseudo-reverb)
  const feedbackGain = gainNode(spaceAmount * 0.5);
  const feedbackFilter = ctx.createBiquadFilter();
  feedbackFilter.type = 'lowpass';
  feedbackFilter.frequency.value = 2000 + (1 - spaceAmount) * 4000;

  delay.connect(feedbackGain);
  feedbackGain.connect(feedbackFilter);
  feedbackFilter.connect(delay);

  // Wet/dry mix
  const wetGain = gainNode(spaceAmount * 0.6);
  const dryGain = gainNode(1 - spaceAmount * 0.3);

  delay.connect(wetGain);

  // Output mixer
  const mixOut = gainNode(1);
  wetGain.connect(mixOut);
  dryGain.connect(mixOut);

  return {
    delay,
    feedbackGain,
    feedbackFilter,
    wetGain,
    dryGain,
    mixOut
  };
}

// =============================================================================
// MAIN SYNTH FACTORY
// =============================================================================

/**
 * Create the world synth function for a specific scale
 */
function createWorldSynth(defaultScale) {
  return (t, value, onended) => {
    const ctx = getAudioContext();

    // Extract parameters with defaults
    const {
      duration,
      // 5 Sacred Controls
      brilliance = 0.5,   // Filter cutoff (0-1)
      motion = 0.0,       // LFO amount to pitch/filter/amp (0-1)
      space = 0.0,        // Reverb + delay mix (0-1)
      warmth = 0.5,       // Chorus/detune spread ±50 cents (0-1)
      drift = 0.0,        // Slow random modulation amount (0-1)
      // Scale selection
      scale = defaultScale,
    } = value;

    // Parse scale type
    const scaleType = typeof scale === 'string' ? parseScale(scale) : scale;

    // Get ADSR values
    const [attack, decay, sustain, release] = getADSRValues(
      [value.attack, value.decay, value.sustain, value.release],
      'linear',
      [0.01, 0.15, 0.6, 0.3]
    );

    // Calculate base frequency using just intonation
    const frequency = getWorldFrequency(value, scaleType);

    // Timing
    const startTime = t;
    const endTime = t + duration;

    // Control parameters object
    const params = { brilliance, motion, space, warmth, drift };

    // =========================================================================
    // CREATE 3-LAYER ARCHITECTURE
    // =========================================================================

    // Layer 1: Sub (Foundation)
    const subLayer = createSubLayer(ctx, frequency, startTime, endTime, release);

    // Layer 2: Body (Character)
    const bodyLayer = createBodyLayer(ctx, frequency, startTime, endTime, release, params);

    // Layer 3: Air (Breath)
    const airLayer = createAirLayer(ctx, frequency, startTime, endTime, release, params);

    // =========================================================================
    // MIXING AND EFFECTS
    // =========================================================================

    // Pre-effects mix
    const preMix = gainNode(1);
    subLayer.gain.connect(preMix);
    bodyLayer.bodyOut.connect(preMix);
    airLayer.airOut.connect(preMix);

    // Apply space effects
    const spaceEffects = createSpaceEffects(ctx, space);

    let outputNode;
    if (spaceEffects) {
      preMix.connect(spaceEffects.delay);
      preMix.connect(spaceEffects.dryGain);
      outputNode = spaceEffects.mixOut;
    } else {
      outputNode = preMix;
    }

    // =========================================================================
    // CLEANUP
    // =========================================================================

    const stopTime = endTime + release + 0.5;

    // Cleanup handler
    const cleanup = () => {
      // Sub layer
      subLayer.osc.disconnect();
      subLayer.gain.disconnect();

      // Body layer
      bodyLayer.oscillators.forEach(osc => {
        osc.disconnect();
      });
      bodyLayer.gains.forEach(g => g.disconnect());
      bodyLayer.lfos.forEach(lfo => {
        lfo.stop();
        lfo.disconnect();
      });
      bodyLayer.fmOscs.forEach(fmo => {
        fmo.stop();
        fmo.disconnect();
      });
      bodyLayer.bodyMix.disconnect();
      bodyLayer.bodyFilter.disconnect();
      bodyLayer.bodyOut.disconnect();

      // Air layer
      airLayer.oscillators.forEach(osc => {
        osc.disconnect();
      });
      airLayer.lfos.forEach(lfo => {
        lfo.stop();
        lfo.disconnect();
      });
      airLayer.noiseSource.disconnect();
      airLayer.noiseFilter.disconnect();
      airLayer.noiseGain.disconnect();
      airLayer.airMix.disconnect();
      airLayer.airOut.disconnect();

      // Mix
      preMix.disconnect();

      // Space effects
      if (spaceEffects) {
        spaceEffects.delay.disconnect();
        spaceEffects.feedbackGain.disconnect();
        spaceEffects.feedbackFilter.disconnect();
        spaceEffects.wetGain.disconnect();
        spaceEffects.dryGain.disconnect();
        spaceEffects.mixOut.disconnect();
      }

      onended();
    };

    // Use sub oscillator as timing reference for cleanup
    subLayer.osc.onended = cleanup;

    return {
      node: outputNode,
      stop: (time) => {
        // Stop all sound sources
        subLayer.osc.stop(time);
        bodyLayer.oscillators.forEach(osc => osc.stop(time));
        airLayer.oscillators.forEach(osc => osc.stop(time));
        airLayer.noiseSource.stop(time);

        // Stop all LFOs
        bodyLayer.lfos.forEach(lfo => lfo.stop(time));
        bodyLayer.fmOscs.forEach(fmo => fmo.stop(time));
        airLayer.lfos.forEach(lfo => lfo.stop(time));
      }
    };
  };
}

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Register world instrument synth sounds
 */
export function registerWorldSynths() {
  // Register the main world synth with Japanese Yo as default
  registerSound(
    'world',
    createWorldSynth(ScaleType.JAPANESE_YO),
    { type: 'synth', prebake: true }
  );

  // Register scale-specific synths for convenience
  const scaleShortcuts = [
    ['yo', ScaleType.JAPANESE_YO],
    ['gong', ScaleType.CHINESE_GONG],
    ['celtic', ScaleType.CELTIC],
    ['slendro', ScaleType.INDONESIAN_SLENDRO],
    ['highland', ScaleType.SCOTTISH_HIGHLAND],
    ['throat', ScaleType.MONGOLIAN_THROAT],
    ['sacred', ScaleType.EGYPTIAN_SACRED],
    ['native', ScaleType.NATIVE_AMERICAN],
    ['aurora', ScaleType.NORDIC_AURORA]
  ];

  scaleShortcuts.forEach(([name, scaleType]) => {
    registerSound(
      name,
      createWorldSynth(scaleType),
      { type: 'synth', prebake: true }
    );
  });
}

// Export scale info for documentation
export { ScaleType, scaleNames };
