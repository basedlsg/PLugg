/**
 * AudioRouter.js
 * Routes audio from Strudel/World Synth to analyser and destination
 *
 * Signal path:
 * Strudel Pattern -> World Synth -> Gain Node -> Destination
 *                                      |
 *                                      v
 *                               AnalyserNode -> VisualEngine
 */

/**
 * Audio routing manager for the text-to-music-visual pipeline
 */
export class AudioRouter {
  constructor(options = {}) {
    this.options = {
      fftSize: options.fftSize || 2048,
      smoothingTimeConstant: options.smoothingTimeConstant || 0.8,
      initialGain: options.initialGain || 0.8,
      morphTime: options.morphTime || 0.3, // 300ms default morph time
      ...options,
    };

    // Audio context - will be set externally or created
    this.audioContext = null;

    // Core nodes
    this.masterGain = null;
    this.analyser = null;

    // Analysis buffers
    this.frequencyData = null;
    this.timeDomainData = null;

    // State
    this.isInitialized = false;
    this.currentGain = this.options.initialGain;

    // Callbacks
    this.onAnalysisUpdate = null;
  }

  /**
   * Initialize the audio router with an AudioContext
   * @param {AudioContext} ctx - Web Audio Context (from Strudel or created)
   */
  initialize(ctx) {
    if (this.isInitialized) {
      this.dispose();
    }

    this.audioContext = ctx;

    // Create master gain node
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.options.initialGain;

    // Create analyser node
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.options.fftSize;
    this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;

    // Initialize analysis buffers
    const bufferLength = this.analyser.frequencyBinCount;
    this.frequencyData = new Uint8Array(bufferLength);
    this.timeDomainData = new Uint8Array(bufferLength);

    // Route: masterGain -> analyser -> destination
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.isInitialized = true;

    return this.masterGain;
  }

  /**
   * Get the input node for connecting audio sources
   * @returns {GainNode} Master gain node to connect sources to
   */
  getInputNode() {
    if (!this.isInitialized) {
      throw new Error('AudioRouter not initialized. Call initialize() first.');
    }
    return this.masterGain;
  }

  /**
   * Get the analyser node for visualization
   * @returns {AnalyserNode} Analyser node
   */
  getAnalyserNode() {
    if (!this.isInitialized) {
      throw new Error('AudioRouter not initialized. Call initialize() first.');
    }
    return this.analyser;
  }

  /**
   * Set master gain with smooth transition
   * @param {number} gain - Target gain (0-1)
   * @param {number} time - Transition time in seconds
   */
  setGain(gain, time = null) {
    if (!this.isInitialized) return;

    const morphTime = time ?? this.options.morphTime;
    const targetTime = this.audioContext.currentTime + morphTime;

    this.masterGain.gain.setTargetAtTime(
      gain,
      this.audioContext.currentTime,
      morphTime / 3
    );

    this.currentGain = gain;
  }

  /**
   * Fade out audio smoothly
   * @param {number} duration - Fade duration in seconds
   */
  fadeOut(duration = 2) {
    if (!this.isInitialized) return;

    this.masterGain.gain.setTargetAtTime(
      0,
      this.audioContext.currentTime,
      duration / 3
    );
  }

  /**
   * Fade in audio smoothly
   * @param {number} duration - Fade duration in seconds
   * @param {number} targetGain - Target gain level
   */
  fadeIn(duration = 1, targetGain = null) {
    if (!this.isInitialized) return;

    const target = targetGain ?? this.currentGain;

    this.masterGain.gain.setTargetAtTime(
      target,
      this.audioContext.currentTime,
      duration / 3
    );
  }

  /**
   * Get current frequency spectrum data
   * @returns {Uint8Array} Frequency data (0-255)
   */
  getFrequencyData() {
    if (!this.isInitialized || !this.analyser) {
      return new Uint8Array(0);
    }

    this.analyser.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  /**
   * Get current waveform data
   * @returns {Uint8Array} Time domain data (0-255)
   */
  getTimeDomainData() {
    if (!this.isInitialized || !this.analyser) {
      return new Uint8Array(0);
    }

    this.analyser.getByteTimeDomainData(this.timeDomainData);
    return this.timeDomainData;
  }

  /**
   * Get audio analysis features
   * @returns {Object} Analysis features for visualization
   */
  getAnalysis() {
    if (!this.isInitialized) {
      return {
        rmsEnergy: 0,
        spectralCentroid: 0,
        bassEnergy: 0,
        midEnergy: 0,
        highEnergy: 0,
        spectrum: new Uint8Array(0),
        waveform: new Uint8Array(0),
      };
    }

    // Get fresh data
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);

    // Calculate RMS energy
    let rmsSum = 0;
    for (let i = 0; i < this.timeDomainData.length; i++) {
      const sample = (this.timeDomainData[i] - 128) / 128;
      rmsSum += sample * sample;
    }
    const rmsEnergy = Math.sqrt(rmsSum / this.timeDomainData.length);

    // Calculate spectral centroid
    let weightedSum = 0;
    let sum = 0;
    const sampleRate = this.audioContext.sampleRate;
    const binCount = this.frequencyData.length;
    const nyquist = sampleRate / 2;

    for (let i = 0; i < binCount; i++) {
      const magnitude = this.frequencyData[i];
      const frequency = (i / binCount) * nyquist;
      weightedSum += magnitude * frequency;
      sum += magnitude;
    }
    const spectralCentroid = sum > 0 ? weightedSum / sum : 0;

    // Calculate band energies
    const bassEnd = Math.floor((200 / nyquist) * binCount);
    const midEnd = Math.floor((2000 / nyquist) * binCount);

    let bassEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;

    for (let i = 0; i < binCount; i++) {
      const value = this.frequencyData[i] / 255;
      if (i < bassEnd) {
        bassEnergy += value;
      } else if (i < midEnd) {
        midEnergy += value;
      } else {
        highEnergy += value;
      }
    }

    // Normalize band energies
    bassEnergy = bassEnergy / bassEnd;
    midEnergy = midEnergy / (midEnd - bassEnd);
    highEnergy = highEnergy / (binCount - midEnd);

    const analysis = {
      rmsEnergy: Math.min(rmsEnergy * 2, 1),
      spectralCentroid: Math.min(spectralCentroid / 8000, 1),
      bassEnergy: Math.min(bassEnergy, 1),
      midEnergy: Math.min(midEnergy, 1),
      highEnergy: Math.min(highEnergy, 1),
      spectrum: new Uint8Array(this.frequencyData),
      waveform: new Uint8Array(this.timeDomainData),
    };

    // Callback for external subscribers
    if (this.onAnalysisUpdate) {
      this.onAnalysisUpdate(analysis);
    }

    return analysis;
  }

  /**
   * Create a side chain for visualization (doesn't affect audio output)
   * @returns {AnalyserNode} Dedicated analyser for visualization
   */
  createVisualizationAnalyser() {
    if (!this.isInitialized) {
      throw new Error('AudioRouter not initialized');
    }

    const vizAnalyser = this.audioContext.createAnalyser();
    vizAnalyser.fftSize = this.options.fftSize;
    vizAnalyser.smoothingTimeConstant = this.options.smoothingTimeConstant;

    // Connect from master gain (parallel to main analyser)
    this.masterGain.connect(vizAnalyser);

    return vizAnalyser;
  }

  /**
   * Connect an external audio source
   * @param {AudioNode} source - Audio source node
   */
  connectSource(source) {
    if (!this.isInitialized) {
      throw new Error('AudioRouter not initialized');
    }
    source.connect(this.masterGain);
  }

  /**
   * Disconnect an external audio source
   * @param {AudioNode} source - Audio source node
   */
  disconnectSource(source) {
    try {
      source.disconnect(this.masterGain);
    } catch {
      // Source may already be disconnected
    }
  }

  /**
   * Resume audio context if suspended
   * @returns {Promise} Resolves when context is running
   */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Suspend audio context
   * @returns {Promise} Resolves when context is suspended
   */
  async suspend() {
    if (this.audioContext && this.audioContext.state === 'running') {
      await this.audioContext.suspend();
    }
  }

  /**
   * Get current state
   * @returns {Object} Router state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      currentGain: this.currentGain,
      contextState: this.audioContext?.state || 'closed',
      sampleRate: this.audioContext?.sampleRate || 0,
    };
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    this.frequencyData = null;
    this.timeDomainData = null;
    this.isInitialized = false;
    this.onAnalysisUpdate = null;
  }
}

/**
 * Create an audio router with default settings
 * @param {Object} options - Router options
 * @returns {AudioRouter} New router instance
 */
export function createAudioRouter(options = {}) {
  return new AudioRouter(options);
}

export default AudioRouter;
