/**
 * NoteGenerator.js
 * Convert semantic mapping parameters to scale notes for the world synth
 *
 * Generates notes in the appropriate scale based on:
 * - Scale selection from semantic category
 * - Root note from sentiment valence (higher valence = higher register)
 * - Note count from complexity
 */

// Scale definitions matching the world-instruments package
const SCALES = {
  major: [0, 2, 4, 7, 9],           // Major pentatonic intervals
  minor: [0, 3, 5, 7, 10],          // Minor pentatonic intervals
  harmonic: [0, 2, 4, 6, 7],        // Harmonic with tritone
  bhairav: [0, 1, 4, 5, 7],         // Bhairav raga
  insen: [0, 1, 5, 7, 10],          // In Sen Japanese
  slendro: [0, 2, 5, 7, 10],        // Slendro gamelan
  suspended: [0, 2, 5, 7, 10],      // Suspended/ambiguous
  pentatonic: [0, 2, 4, 7, 9],      // Default pentatonic
  phrygian: [0, 1, 3, 5, 7],        // Phrygian mode (5 notes)
  dorian: [0, 2, 3, 7, 9],          // Dorian mode (5 notes)
  lydian: [0, 2, 4, 6, 7],          // Lydian mode (5 notes)
  mixolydian: [0, 2, 4, 7, 10],     // Mixolydian mode (5 notes)
  chromatic: [0, 1, 3, 6, 8],       // Diminished feel
  wholetone: [0, 2, 4, 6, 8],       // Whole tone
  blues: [0, 3, 5, 6, 7],           // Blues scale (5 notes)
};

// Semantic category to scale mapping
const CATEGORY_TO_SCALE = {
  water: 'minor',
  fire: 'harmonic',
  earth: 'suspended',
  light: 'major',
  shadow: 'insen',
  love: 'major',
  loss: 'minor',
  air: 'lydian',
  time: 'dorian',
  neutral: 'pentatonic',
};

/**
 * Note generator for the drone pattern
 */
export class NoteGenerator {
  constructor(options = {}) {
    this.options = {
      baseOctave: options.baseOctave || 3,      // Starting octave
      octaveRange: options.octaveRange || 2,     // Octaves to span
      defaultScale: options.defaultScale || 'pentatonic',
      ...options,
    };

    // Current state
    this.currentNotes = ['c3'];
    this.currentScale = this.options.defaultScale;
    this.currentRoot = 48; // C3
  }

  /**
   * Convert MIDI note number to note name
   * @param {number} midi - MIDI note number
   * @returns {string} Note name (e.g., 'c3', 'd#4')
   */
  midiToNoteName(midi) {
    const noteNames = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    return `${noteNames[noteIndex]}${octave}`;
  }

  /**
   * Generate notes in a scale from a root
   * @param {number} rootMidi - Root MIDI note
   * @param {string} scaleName - Scale name
   * @param {number} noteCount - Number of notes to generate
   * @returns {string[]} Array of note names
   */
  generateScaleNotes(rootMidi, scaleName, noteCount) {
    const scaleIntervals = SCALES[scaleName] || SCALES.pentatonic;
    const notes = [];

    // Generate notes spanning octaves if needed
    for (let i = 0; i < noteCount; i++) {
      const octaveOffset = Math.floor(i / scaleIntervals.length) * 12;
      const degreeIndex = i % scaleIntervals.length;
      const interval = scaleIntervals[degreeIndex];
      const midiNote = rootMidi + interval + octaveOffset;

      // Keep notes in reasonable range (C2 to C6)
      const clampedMidi = Math.max(36, Math.min(84, midiNote));
      notes.push(this.midiToNoteName(clampedMidi));
    }

    return notes;
  }

  /**
   * Update notes from mapping parameters
   * @param {Object} params - Mapping parameters from FusionEngine
   * @returns {Object} Generated notes and scale info
   */
  updateFromMapping(params) {
    // Extract parameters with defaults
    const {
      scales = ['pentatonic'],
      parameters = {},
      analysis = {},
    } = params;

    const valence = analysis.sentiment?.valence ?? parameters.warmth ?? 0.5;
    const complexity = parameters.complexity ?? 0.5;
    const category = params.scales?.[0] || analysis.semantic?.primaryCategory || 'neutral';

    // Determine scale from semantic category or provided scales
    let selectedScale = this.options.defaultScale;

    if (scales && scales.length > 0) {
      // Use first scale if it's a known scale
      const firstScale = scales[0].toLowerCase();
      if (SCALES[firstScale]) {
        selectedScale = firstScale;
      } else if (CATEGORY_TO_SCALE[firstScale]) {
        selectedScale = CATEGORY_TO_SCALE[firstScale];
      }
    }

    // Calculate root MIDI note from valence
    // Low valence (0) = C2 (36), high valence (1) = C4 (60)
    const baseRoot = 36 + this.options.baseOctave * 12;
    const rootRange = this.options.octaveRange * 12;
    const rootMidi = Math.floor(baseRoot + valence * rootRange);

    // Calculate note count from complexity (1-4 notes)
    const noteCount = 1 + Math.floor(complexity * 3);

    // Generate notes
    const notes = this.generateScaleNotes(rootMidi, selectedScale, noteCount);

    // Update state
    this.currentNotes = notes;
    this.currentScale = selectedScale;
    this.currentRoot = rootMidi;

    return {
      notes,
      scale: selectedScale,
      rootMidi,
      noteCount,
      valence,
      complexity,
    };
  }

  /**
   * Get notes for a chord based on parameters
   * @param {Object} params - Parameters
   * @returns {string[]} Array of note names
   */
  getChordNotes(params = {}) {
    const {
      scale = this.currentScale,
      rootMidi = this.currentRoot,
      voicing = 'close', // 'close', 'open', 'spread'
      noteCount = 3,
    } = params;

    const scaleIntervals = SCALES[scale] || SCALES.pentatonic;
    const notes = [];

    switch (voicing) {
      case 'spread':
        // Notes spread across 2 octaves
        for (let i = 0; i < noteCount; i++) {
          const octaveOffset = i * 12;
          const midiNote = rootMidi + scaleIntervals[i % scaleIntervals.length] + octaveOffset;
          notes.push(this.midiToNoteName(Math.min(84, midiNote)));
        }
        break;

      case 'open':
        // Alternating low and high register
        for (let i = 0; i < noteCount; i++) {
          const isLow = i % 2 === 0;
          const octaveOffset = isLow ? 0 : 12;
          const midiNote = rootMidi + scaleIntervals[i % scaleIntervals.length] + octaveOffset;
          notes.push(this.midiToNoteName(Math.min(84, midiNote)));
        }
        break;

      case 'close':
      default:
        // Close voicing in same octave
        for (let i = 0; i < noteCount; i++) {
          const midiNote = rootMidi + scaleIntervals[i % scaleIntervals.length];
          notes.push(this.midiToNoteName(Math.min(84, midiNote)));
        }
        break;
    }

    return notes;
  }

  /**
   * Get a single drone note (the root)
   * @returns {string} Root note name
   */
  getDroneNote() {
    return this.currentNotes[0] || this.midiToNoteName(this.currentRoot);
  }

  /**
   * Get all current notes as a Strudel pattern string
   * @returns {string} Space-separated note names
   */
  getPatternString() {
    return this.currentNotes.join(' ');
  }

  /**
   * Get current state
   * @returns {Object} Current generator state
   */
  getState() {
    return {
      notes: [...this.currentNotes],
      scale: this.currentScale,
      rootMidi: this.currentRoot,
    };
  }

  /**
   * Set specific notes directly
   * @param {string[]} notes - Array of note names
   */
  setNotes(notes) {
    this.currentNotes = notes;
  }

  /**
   * Set scale directly
   * @param {string} scale - Scale name
   */
  setScale(scale) {
    if (SCALES[scale]) {
      this.currentScale = scale;
    }
  }

  /**
   * Reset to default state
   */
  reset() {
    this.currentNotes = ['c3'];
    this.currentScale = this.options.defaultScale;
    this.currentRoot = 48;
  }
}

/**
 * Map semantic parameters to synth parameters
 * @param {Object} mappingParams - Parameters from FusionEngine
 * @returns {Object} Synth control parameters
 */
export function mapToSynthControls(mappingParams) {
  const { parameters = {} } = mappingParams;

  return {
    // Direct mappings from fusion parameters
    brilliance: parameters.brilliance ?? 0.5,
    warmth: parameters.warmth ?? 0.5,
    motion: parameters.motion ?? 0.3,
    space: parameters.space ?? 0.4,

    // Drift from harmonic density and complexity
    drift: (parameters.harmonicDensity ?? 0.5) * 0.5 +
           (parameters.complexity ?? 0.5) * 0.3,

    // Envelope from sentiment-derived params
    attack: parameters.attackTime ?? 0.1,
    release: parameters.releaseTime ?? 0.5,
    sustain: parameters.bodyLayerSustain ?? 0.6,
  };
}

/**
 * Get the appropriate world instrument sound based on scale
 * @param {string} scale - Scale name
 * @returns {string} World instrument sound name
 */
export function getWorldSound(scale) {
  const scaleToSound = {
    major: 'world',
    minor: 'world',
    harmonic: 'world',
    bhairav: 'world',
    insen: 'world',
    slendro: 'slendro',
    suspended: 'world',
    pentatonic: 'world',
    phrygian: 'world',
    dorian: 'world',
    lydian: 'world',
    mixolydian: 'world',
    chromatic: 'world',
    wholetone: 'world',
    blues: 'world',
  };

  return scaleToSound[scale] || 'world';
}

export { SCALES, CATEGORY_TO_SCALE };
export default NoteGenerator;
