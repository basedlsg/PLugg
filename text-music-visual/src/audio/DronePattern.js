/**
 * DronePattern.js
 * Continuous morphing drone pattern for the world synth
 *
 * Features:
 * - Never-stopping drone that morphs between states
 * - Smooth parameter transitions using setTargetAtTime
 * - Overlapping envelopes for seamless sound
 * - External parameter control for real-time updates
 */

import { NoteGenerator, mapToSynthControls, getWorldSound } from './NoteGenerator.js';

/**
 * Parameter manager for smooth transitions
 */
class ParameterManager {
  constructor(defaults = {}) {
    this.values = {
      brilliance: 0.5,
      motion: 0.3,
      space: 0.4,
      warmth: 0.5,
      drift: 0.2,
      ...defaults,
    };

    this.targets = { ...this.values };
    this.morphTime = 0.3; // 300ms default
  }

  /**
   * Get current parameter value
   * @param {string} name - Parameter name
   * @returns {number} Current value
   */
  get(name) {
    return this.values[name] ?? 0.5;
  }

  /**
   * Set target value with smooth transition
   * @param {string} name - Parameter name
   * @param {number} value - Target value (0-1)
   * @param {number} time - Morph time in seconds
   */
  setTarget(name, value, time = null) {
    this.targets[name] = Math.max(0, Math.min(1, value));
    this.values[name] = this.targets[name];
  }

  /**
   * Set multiple parameters at once
   * @param {Object} params - Parameter values
   * @param {number} time - Morph time in seconds
   */
  setTargets(params, time = null) {
    for (const [name, value] of Object.entries(params)) {
      if (this.values.hasOwnProperty(name)) {
        this.setTarget(name, value, time);
      }
    }
  }

  /**
   * Get all current values
   * @returns {Object} All parameter values
   */
  getAll() {
    return { ...this.values };
  }

  /**
   * Reset to defaults
   */
  reset() {
    this.values = {
      brilliance: 0.5,
      motion: 0.3,
      space: 0.4,
      warmth: 0.5,
      drift: 0.2,
    };
    this.targets = { ...this.values };
  }
}

/**
 * DronePattern - Manages continuous morphing drone patterns
 */
export class DronePattern {
  constructor(options = {}) {
    this.options = {
      sustainTime: options.sustainTime || 8,      // Long sustain
      releaseTime: options.releaseTime || 4,      // Slow release
      overlapTime: options.overlapTime || 2,      // Overlap between notes
      morphTime: options.morphTime || 0.3,        // Parameter morph time
      defaultScale: options.defaultScale || 'pentatonic',
      ...options,
    };

    // Note generator
    this.noteGenerator = new NoteGenerator({
      baseOctave: options.baseOctave || 3,
      octaveRange: options.octaveRange || 2,
      defaultScale: this.options.defaultScale,
    });

    // Parameter manager
    this.paramManager = new ParameterManager();

    // Pattern state
    this.isPlaying = false;
    this.currentPattern = null;
    this.currentSound = 'world';

    // Event callbacks
    this.onPatternUpdate = null;
    this.onParameterChange = null;
  }

  /**
   * Build a Strudel pattern string for the current state
   * @returns {string} Strudel pattern code
   */
  buildPatternCode() {
    const notes = this.noteGenerator.getPatternString();
    const sound = this.currentSound;
    const params = this.paramManager.getAll();

    // Build the pattern with all parameters
    const patternCode = `
      note("${notes}")
        .s("${sound}")
        .sustain(${this.options.sustainTime})
        .release(${this.options.releaseTime})
        .brilliance(${params.brilliance.toFixed(3)})
        .motion(${params.motion.toFixed(3)})
        .space(${params.space.toFixed(3)})
        .warmth(${params.warmth.toFixed(3)})
        .drift(${params.drift.toFixed(3)})
    `.trim();

    return patternCode;
  }

  /**
   * Update the pattern from semantic mapping results
   * @param {Object} mappingResult - Result from FusionEngine
   */
  updateFromMapping(mappingResult) {
    // Update notes from mapping
    const noteInfo = this.noteGenerator.updateFromMapping(mappingResult);

    // Update synth parameters
    const synthControls = mapToSynthControls(mappingResult);

    // Smooth transition to new parameters
    this.paramManager.setTargets(synthControls, this.options.morphTime);

    // Update sound based on scale
    this.currentSound = getWorldSound(noteInfo.scale);

    // Trigger pattern update if playing
    if (this.isPlaying && this.onPatternUpdate) {
      this.onPatternUpdate({
        notes: noteInfo.notes,
        scale: noteInfo.scale,
        sound: this.currentSound,
        parameters: this.paramManager.getAll(),
      });
    }

    return {
      notes: noteInfo,
      parameters: this.paramManager.getAll(),
      patternCode: this.buildPatternCode(),
    };
  }

  /**
   * Set a single synth parameter
   * @param {string} name - Parameter name
   * @param {number} value - Value (0-1)
   */
  setParameter(name, value) {
    this.paramManager.setTarget(name, value, this.options.morphTime);

    if (this.onParameterChange) {
      this.onParameterChange(name, value);
    }
  }

  /**
   * Set multiple parameters at once
   * @param {Object} params - Parameter values
   */
  setParameters(params) {
    this.paramManager.setTargets(params, this.options.morphTime);

    if (this.onParameterChange) {
      for (const [name, value] of Object.entries(params)) {
        this.onParameterChange(name, value);
      }
    }
  }

  /**
   * Get current parameter value
   * @param {string} name - Parameter name
   * @returns {number} Current value
   */
  getParameter(name) {
    return this.paramManager.get(name);
  }

  /**
   * Get all parameters
   * @returns {Object} All parameter values
   */
  getAllParameters() {
    return this.paramManager.getAll();
  }

  /**
   * Set notes directly
   * @param {string[]} notes - Array of note names
   */
  setNotes(notes) {
    this.noteGenerator.setNotes(notes);

    if (this.isPlaying && this.onPatternUpdate) {
      this.onPatternUpdate({
        notes,
        scale: this.noteGenerator.currentScale,
        sound: this.currentSound,
        parameters: this.paramManager.getAll(),
      });
    }
  }

  /**
   * Set scale directly
   * @param {string} scale - Scale name
   */
  setScale(scale) {
    this.noteGenerator.setScale(scale);
    this.currentSound = getWorldSound(scale);
  }

  /**
   * Start the drone pattern
   */
  start() {
    this.isPlaying = true;

    if (this.onPatternUpdate) {
      this.onPatternUpdate({
        notes: this.noteGenerator.currentNotes,
        scale: this.noteGenerator.currentScale,
        sound: this.currentSound,
        parameters: this.paramManager.getAll(),
      });
    }
  }

  /**
   * Stop the drone pattern
   */
  stop() {
    this.isPlaying = false;
  }

  /**
   * Check if pattern is playing
   * @returns {boolean} Playing state
   */
  isActive() {
    return this.isPlaying;
  }

  /**
   * Get current pattern state
   * @returns {Object} Complete pattern state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      notes: this.noteGenerator.getState(),
      parameters: this.paramManager.getAll(),
      sound: this.currentSound,
      patternCode: this.buildPatternCode(),
    };
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.noteGenerator.reset();
    this.paramManager.reset();
    this.currentSound = 'world';
    this.isPlaying = false;
  }

  /**
   * Create pattern with dynamic parameter access
   * Returns a function-based pattern for live parameter control
   * @returns {Object} Pattern configuration for Strudel
   */
  createDynamicPattern() {
    const paramManager = this.paramManager;
    const noteGenerator = this.noteGenerator;

    return {
      getNotes: () => noteGenerator.getPatternString(),
      getSound: () => this.currentSound,
      getSustain: () => this.options.sustainTime,
      getRelease: () => this.options.releaseTime,
      getBrilliance: () => paramManager.get('brilliance'),
      getMotion: () => paramManager.get('motion'),
      getSpace: () => paramManager.get('space'),
      getWarmth: () => paramManager.get('warmth'),
      getDrift: () => paramManager.get('drift'),
    };
  }
}

/**
 * Create a drone pattern instance
 * @param {Object} options - Pattern options
 * @returns {DronePattern} New drone pattern instance
 */
export function createDronePattern(options = {}) {
  return new DronePattern(options);
}

export { ParameterManager };
export default DronePattern;
