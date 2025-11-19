/**
 * StrudelBridge.js
 * Initialize Strudel and manage patterns for the world synth
 *
 * Connects the text-music-visual system to Strudel's pattern engine
 * and the 3-layer world instruments synthesizer.
 */

import { DronePattern } from './DronePattern.js';
import { AudioRouter } from './AudioRouter.js';

/**
 * Bridge between Strudel pattern system and the world synthesizer
 */
export class StrudelBridge {
  constructor(options = {}) {
    this.options = {
      morphTime: options.morphTime || 0.3,
      sustainTime: options.sustainTime || 8,
      releaseTime: options.releaseTime || 4,
      autoStart: options.autoStart !== false,
      ...options,
    };

    // Audio routing
    this.audioRouter = new AudioRouter(options.routerOptions || {});

    // Drone pattern manager
    this.dronePattern = new DronePattern({
      sustainTime: this.options.sustainTime,
      releaseTime: this.options.releaseTime,
      morphTime: this.options.morphTime,
    });

    // Strudel references
    this.strudel = null;
    this.repl = null;
    this.audioContext = null;

    // State
    this.isInitialized = false;
    this.isPlaying = false;
    this.currentPattern = null;

    // Event callbacks
    this.onInitialized = null;
    this.onPatternUpdate = null;
    this.onError = null;

    // Setup drone pattern callback
    this.dronePattern.onPatternUpdate = (update) => {
      if (this.isPlaying) {
        this.evaluatePattern(this.dronePattern.buildPatternCode());
      }
    };
  }

  /**
   * Initialize Strudel and register world instruments
   * @returns {Promise} Resolves when initialization is complete
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Dynamic import of Strudel modules
      const [
        { repl, controls },
        { getAudioContext, webaudioOutput, registerSynthSounds },
        worldInstruments
      ] = await Promise.all([
        import('@strudel/core'),
        import('@strudel/webaudio'),
        import('@strudel/world-instruments'),
      ]);

      // Get or create audio context
      this.audioContext = getAudioContext();

      // Initialize audio router with the context
      const inputNode = this.audioRouter.initialize(this.audioContext);

      // Register world instruments synths
      if (worldInstruments.registerWorldSynths) {
        worldInstruments.registerWorldSynths();
      }

      // Register standard synth sounds
      if (registerSynthSounds) {
        registerSynthSounds();
      }

      // Create REPL with custom output that routes through our router
      this.repl = repl({
        defaultOutput: webaudioOutput,
        getTime: () => this.audioContext.currentTime,
        audioContext: this.audioContext,
      });

      this.strudel = { repl: this.repl, controls };
      this.isInitialized = true;

      if (this.onInitialized) {
        this.onInitialized();
      }

      // Auto-start if configured
      if (this.options.autoStart) {
        await this.start();
      }

    } catch (error) {
      console.error('Failed to initialize Strudel:', error);

      if (this.onError) {
        this.onError(error);
      }

      throw error;
    }
  }

  /**
   * Evaluate a Strudel pattern
   * @param {string} code - Pattern code
   * @returns {Promise} Resolves when pattern is evaluated
   */
  async evaluatePattern(code) {
    if (!this.isInitialized || !this.repl) {
      throw new Error('StrudelBridge not initialized');
    }

    try {
      this.currentPattern = code;
      await this.repl.evaluate(code);

      if (this.onPatternUpdate) {
        this.onPatternUpdate(code);
      }

    } catch (error) {
      console.error('Pattern evaluation error:', error);

      if (this.onError) {
        this.onError(error);
      }

      throw error;
    }
  }

  /**
   * Update drone from mapping results
   * @param {Object} mappingResult - Result from FusionEngine
   */
  updateFromMapping(mappingResult) {
    const result = this.dronePattern.updateFromMapping(mappingResult);

    // If playing, evaluate the new pattern
    if (this.isPlaying) {
      this.evaluatePattern(result.patternCode);
    }

    return result;
  }

  /**
   * Set a synth parameter with smooth transition
   * @param {string} name - Parameter name
   * @param {number} value - Value (0-1)
   */
  setParameter(name, value) {
    this.dronePattern.setParameter(name, value);

    // Evaluate updated pattern
    if (this.isPlaying) {
      this.evaluatePattern(this.dronePattern.buildPatternCode());
    }
  }

  /**
   * Set multiple parameters at once
   * @param {Object} params - Parameter values
   */
  setParameters(params) {
    this.dronePattern.setParameters(params);

    // Evaluate updated pattern
    if (this.isPlaying) {
      this.evaluatePattern(this.dronePattern.buildPatternCode());
    }
  }

  /**
   * Set notes directly
   * @param {string[]} notes - Array of note names
   */
  setNotes(notes) {
    this.dronePattern.setNotes(notes);

    // Evaluate updated pattern
    if (this.isPlaying) {
      this.evaluatePattern(this.dronePattern.buildPatternCode());
    }
  }

  /**
   * Set scale
   * @param {string} scale - Scale name
   */
  setScale(scale) {
    this.dronePattern.setScale(scale);

    // Evaluate updated pattern
    if (this.isPlaying) {
      this.evaluatePattern(this.dronePattern.buildPatternCode());
    }
  }

  /**
   * Start playing the drone pattern
   */
  async start() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Resume audio context if needed
    await this.audioRouter.resume();

    // Start the drone pattern
    this.dronePattern.start();

    // Evaluate initial pattern
    const patternCode = this.dronePattern.buildPatternCode();
    await this.evaluatePattern(patternCode);

    // Start the REPL scheduler
    if (this.repl && this.repl.scheduler) {
      this.repl.scheduler.start();
    }

    this.isPlaying = true;
  }

  /**
   * Stop playing
   */
  stop() {
    this.isPlaying = false;
    this.dronePattern.stop();

    // Stop the REPL scheduler
    if (this.repl && this.repl.scheduler) {
      this.repl.scheduler.stop();
    }

    // Fade out audio
    this.audioRouter.fadeOut(2);
  }

  /**
   * Pause playback
   */
  async pause() {
    if (this.repl && this.repl.scheduler) {
      this.repl.scheduler.pause();
    }

    await this.audioRouter.suspend();
    this.isPlaying = false;
  }

  /**
   * Resume playback
   */
  async resume() {
    await this.audioRouter.resume();

    if (this.repl && this.repl.scheduler) {
      this.repl.scheduler.start();
    }

    this.isPlaying = true;
  }

  /**
   * Get the audio analyser node for visualization
   * @returns {AnalyserNode} Analyser node
   */
  getAnalyserNode() {
    return this.audioRouter.getAnalyserNode();
  }

  /**
   * Get audio analysis for visualization
   * @returns {Object} Analysis features
   */
  getAnalysis() {
    return this.audioRouter.getAnalysis();
  }

  /**
   * Set master volume
   * @param {number} gain - Gain value (0-1)
   */
  setVolume(gain) {
    this.audioRouter.setGain(gain);
  }

  /**
   * Get current pattern code
   * @returns {string} Current Strudel pattern
   */
  getPatternCode() {
    return this.dronePattern.buildPatternCode();
  }

  /**
   * Get all parameters
   * @returns {Object} All parameter values
   */
  getAllParameters() {
    return this.dronePattern.getAllParameters();
  }

  /**
   * Get current state
   * @returns {Object} Bridge state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      pattern: this.dronePattern.getState(),
      router: this.audioRouter.getState(),
    };
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.stop();
    this.dronePattern.reset();
    this.currentPattern = null;
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    this.stop();
    this.dronePattern.reset();
    this.audioRouter.dispose();

    this.repl = null;
    this.strudel = null;
    this.audioContext = null;
    this.isInitialized = false;
  }
}

/**
 * Create a Strudel bridge instance
 * @param {Object} options - Bridge options
 * @returns {StrudelBridge} New bridge instance
 */
export function createStrudelBridge(options = {}) {
  return new StrudelBridge(options);
}

export default StrudelBridge;
