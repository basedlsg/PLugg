/**
 * World Instruments Synthesizer for Strudel
 *
 * A synthesizer with pentatonic scales using just intonation,
 * inspired by world music traditions.
 */

import { registerSound } from '@strudel/superdough';
import { getAudioContext } from '@strudel/superdough';
import {
  gainNode,
  getADSRValues,
  getParamADSR,
} from '@strudel/superdough';
import {
  midiToJustFrequency,
  parseScale,
  ScaleType,
  scaleNames
} from './scales.mjs';

// Waveform types matching CelestialSynth
const waveforms = ['sine', 'sawtooth', 'square', 'triangle'];

/**
 * Create a simple lowpass filter
 */
function createLowpass(ctx, cutoff, resonance) {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  filter.Q.value = resonance;
  return filter;
}

/**
 * Create a delay effect
 */
function createDelay(ctx, time, feedback, mix) {
  const delay = ctx.createDelay(2.0);
  delay.delayTime.value = time;

  const feedbackGain = gainNode(feedback);
  const wetGain = gainNode(mix);
  const dryGain = gainNode(1 - mix);

  delay.connect(feedbackGain);
  feedbackGain.connect(delay);

  return { delay, wetGain, dryGain, feedbackGain };
}

/**
 * Apply vibrato (motion) to an oscillator
 */
function applyVibrato(ctx, target, rate, depth, startTime) {
  if (depth <= 0) return null;

  const lfo = ctx.createOscillator();
  const lfoGain = gainNode(depth * 100); // Convert to cents

  lfo.type = 'sine';
  lfo.frequency.value = rate;
  lfo.connect(lfoGain);
  lfoGain.connect(target);
  lfo.start(startTime);

  return lfo;
}

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

  // If frequency is directly specified, use it
  if (freq != null) {
    return freq;
  }

  // Convert note to MIDI number
  let midiNote = 60; // Default to middle C
  if (note != null) {
    if (typeof note === 'number') {
      midiNote = note;
    } else if (typeof note === 'string') {
      // Parse note name (e.g., "c4", "a3")
      midiNote = noteNameToMidi(note);
    }
  }

  // Convert using just intonation
  return midiToJustFrequency(midiNote, scaleType, 440);
}

/**
 * Create the world synth function for a specific scale
 */
function createWorldSynth(defaultScale) {
  return (t, value, onended) => {
    const ctx = getAudioContext();

    // Get parameters with defaults matching CelestialSynth
    const {
      duration,
      // Sacred Controls
      brilliance = 0.5,   // Filter cutoff (0-1)
      motion = 0.0,       // Vibrato depth (0-1)
      space = 0.0,        // Delay mix (0-1)
      warmth = 0.5,       // Tone warmth (0-1)
      purity = 0.5,       // Harmonic content (0-1)
      // Synthesis parameters
      waveform = 'sine',
      // Scale selection (can be overridden)
      scale = defaultScale,
      // Filter parameters
      cutoff,
      resonance = 1.0,
      // Delay parameters
      delaytime = 0.3,
      delayfeedback = 0.3,
      delaymix,
    } = value;

    // Parse scale if it's a string
    const scaleType = typeof scale === 'string' ? parseScale(scale) : scale;

    // Get ADSR values
    const [attack, decay, sustain, release] = getADSRValues(
      [value.attack, value.decay, value.sustain, value.release],
      'linear',
      [0.01, 0.1, 0.7, 0.1]
    );

    // Calculate frequency using just intonation
    const frequency = getWorldFrequency(value, scaleType);

    // Determine waveform from purity parameter
    let waveType = waveform;
    if (waveform === 'sine' && purity > 0.5) {
      // Higher purity = more harmonics
      const index = Math.floor(purity * 3);
      waveType = waveforms[Math.min(index, waveforms.length - 1)];
    }

    // Create oscillator
    const osc = ctx.createOscillator();
    osc.type = waveType;
    osc.frequency.value = frequency;

    // Apply warmth through subtle detuning
    if (warmth > 0.5) {
      osc.detune.value = (warmth - 0.5) * 10; // Subtle detuning
    }

    // Apply motion (vibrato)
    const vibratoRate = 4 + motion * 4; // 4-8 Hz
    const vibratoDepth = motion * 0.3; // 0-30%
    const vibratoLfo = applyVibrato(ctx, osc.detune, vibratoRate, vibratoDepth, t);

    // Create filter
    // Map brilliance to cutoff frequency (200 Hz to 10000 Hz)
    const filterCutoff = cutoff ?? (200 + brilliance * 9800);
    const filter = createLowpass(ctx, filterCutoff, resonance);

    // Create gain node
    const envGain = gainNode(1);

    // Connect: osc -> filter -> envGain
    osc.connect(filter).connect(envGain);

    // Apply envelope
    const holdEnd = t + duration;
    getParamADSR(envGain.gain, attack, decay, sustain, release, 0, 0.3, t, holdEnd, 'linear');

    // Create output with optional delay
    const effectiveMix = delaymix ?? space * 0.7;
    let outputNode = envGain;

    if (effectiveMix > 0) {
      const { delay, wetGain, dryGain, feedbackGain } = createDelay(
        ctx,
        delaytime,
        delayfeedback,
        effectiveMix
      );

      const mixNode = gainNode(1);
      envGain.connect(delay);
      delay.connect(wetGain).connect(mixNode);
      envGain.connect(dryGain).connect(mixNode);

      outputNode = mixNode;

      // Cleanup function needs to handle delay nodes
      osc.onended = () => {
        osc.disconnect();
        filter.disconnect();
        envGain.disconnect();
        delay.disconnect();
        wetGain.disconnect();
        dryGain.disconnect();
        feedbackGain.disconnect();
        mixNode.disconnect();
        vibratoLfo?.stop();
        vibratoLfo?.disconnect();
        onended();
      };
    } else {
      osc.onended = () => {
        osc.disconnect();
        filter.disconnect();
        envGain.disconnect();
        vibratoLfo?.stop();
        vibratoLfo?.disconnect();
        onended();
      };
    }

    // Start and schedule stop
    osc.start(t);
    const endTime = holdEnd + release + 0.01;
    osc.stop(endTime);

    return {
      node: outputNode,
      stop: (time) => {
        osc.stop(time);
        vibratoLfo?.stop(time);
      }
    };
  };
}

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
