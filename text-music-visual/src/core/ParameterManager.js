/**
 * Parameter Manager - The Nervous System
 * Handles smooth parameter interpolation with momentum for responsive morphing
 */

/**
 * Simple EventBus implementation for parameter events
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    for (const callback of this.listeners.get(event)) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    }
  }
}

/**
 * Parameter morph speed configurations
 * Each parameter type has its own characteristic transition time
 */
const MORPH_SPEEDS = {
  // Fast (0.3-0.5s) - Immediate response needed
  brilliance: 2.0,        // Immediate tone change
  attackSharpness: 2.5,   // Quick attack response
  attackTime: 3.0,        // Instant attack feel
  filterCutoff: 2.0,      // Immediate brightness
  graininess: 2.5,        // Quick texture change

  // Medium (1s) - Gradual blending
  motion: 1.0,            // Gradual movement
  warmth: 1.0,            // Chorus blends smoothly
  harmonicContent: 1.2,   // Harmonic shifts
  filterResonance: 1.0,   // Resonance sweep
  tempo: 0.8,             // Tempo changes feel natural
  complexity: 1.0,        // Complexity evolution

  // Slow (2s) - Needs time to develop
  space: 0.5,             // Reverb needs time
  reverbMix: 0.5,         // Wet/dry blend
  releaseTime: 0.6,       // Release envelope
  bodyLayerSustain: 0.6,  // Sustain transition

  // Very slow (4s) - Subtle evolution
  drift: 0.25,            // Subtle drift
  driftSpeed: 0.25,       // Ultra slow evolution
  harmonicDensity: 0.3,   // Gradual density change

  // Visual parameters
  hue: 1.5,               // Color shifts
  saturation: 1.2,        // Saturation blends
  lightness: 1.5,         // Brightness changes
  particleSpeed: 1.0,     // Particle motion
  particleSize: 1.2,      // Size transitions
  glowIntensity: 1.5,     // Glow fades

  // Default for unknown parameters
  default: 1.0
};

/**
 * Parameter categories for grouped operations
 */
const PARAMETER_CATEGORIES = {
  audio: [
    'brilliance', 'attackSharpness', 'attackTime', 'filterCutoff', 'graininess',
    'motion', 'warmth', 'harmonicContent', 'filterResonance', 'tempo', 'complexity',
    'space', 'reverbMix', 'releaseTime', 'bodyLayerSustain', 'airGain',
    'drift', 'driftSpeed', 'harmonicDensity'
  ],
  visual: [
    'hue', 'saturation', 'lightness', 'particleSpeed', 'particleSize',
    'glowIntensity', 'noiseAmount', 'flowSpeed', 'turbulence'
  ],
  scale: ['scaleIndex', 'rootNote', 'octave']
};

/**
 * Default parameter values
 */
const DEFAULT_PARAMS = {
  // Audio synthesis
  airGain: 0.3,
  attackSharpness: 0.5,
  attackTime: 0.1,
  graininess: 0.2,
  brilliance: 0.5,
  filterResonance: 0.3,
  filterCutoff: 0.5,
  bodyLayerSustain: 0.5,
  releaseTime: 0.3,
  motion: 0.5,
  space: 0.5,
  reverbMix: 0.3,
  harmonicContent: 0.5,
  harmonicDensity: 0.5,
  complexity: 0.5,
  tempo: 0.5,
  drift: 0.2,
  driftSpeed: 0.2,
  warmth: 0.5,

  // Visual
  hue: 0.5,
  saturation: 0.6,
  lightness: 0.5,
  particleSpeed: 0.5,
  particleSize: 0.5,
  glowIntensity: 0.3,
  noiseAmount: 0.2,
  flowSpeed: 0.3,
  turbulence: 0.3,

  // Scale
  scaleIndex: 0,
  rootNote: 60,
  octave: 4
};

/**
 * Main Parameter Manager Class
 * Handles smooth interpolation with momentum for all synthesis parameters
 */
export class ParameterManager {
  constructor(options = {}) {
    // Core state
    this.current = { ...DEFAULT_PARAMS };
    this.target = { ...DEFAULT_PARAMS };
    this.velocity = {};
    this.acceleration = {};

    // Initialize velocity for all parameters
    for (const key of Object.keys(DEFAULT_PARAMS)) {
      this.velocity[key] = 0;
      this.acceleration[key] = 0;
    }

    // Configuration
    this.speeds = { ...MORPH_SPEEDS, ...options.speeds };
    this.momentumDecay = options.momentumDecay || 0.85;
    this.accelerationFactor = options.accelerationFactor || 0.15;
    this.maxVelocity = options.maxVelocity || 2.0;

    // Anticipation state
    this.anticipation = {
      active: false,
      predicted: {},
      influence: 0.1,  // 10% drift toward predicted
      timeout: null,
      typingTimeout: 1500  // Reset after 1.5s of no typing
    };

    // Blend state
    this.blend = {
      active: false,
      source: {},
      target: {},
      progress: 0,
      duration: 300,  // 300ms for 50/50 blend
      startTime: 0
    };

    // History for constellation navigation
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;

    // Event bus
    this.eventBus = options.eventBus || new EventBus();

    // Animation frame
    this.animating = false;
    this.lastUpdateTime = 0;

    // Callbacks
    this.onUpdate = options.onUpdate || null;

    // Bind event handlers
    this.setupEventHandlers();
  }

  /**
   * Setup event bus handlers
   */
  setupEventHandlers() {
    // Word submitted - set new targets
    this.eventBus.on('word:submitted', (data) => {
      if (data && data.parameters) {
        this.setTargets(data.parameters);
        this.addToHistory(data.parameters);
        this.clearAnticipation();
      }
    });

    // Anticipation start - begin prediction drift
    this.eventBus.on('anticipation:start', (data) => {
      if (data && data.predicted) {
        this.setAnticipation(data.predicted, data.influence || 0.1);
      }
    });

    // Anticipation end - clear prediction
    this.eventBus.on('anticipation:end', () => {
      this.clearAnticipation();
    });

    // Constellation navigation
    this.eventBus.on('constellation:select', (data) => {
      if (data && data.parameters) {
        this.blendTo(data.parameters);
      }
    });

    // History navigation
    this.eventBus.on('history:back', () => {
      this.navigateHistory(-1);
    });

    this.eventBus.on('history:forward', () => {
      this.navigateHistory(1);
    });

    // Reset
    this.eventBus.on('reset', () => {
      this.reset();
    });
  }

  /**
   * Main update loop - exponential smoothing with momentum
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Clamp dt to prevent huge jumps
    dt = Math.min(dt, 0.1);

    let hasChanges = false;

    // Process blend mode
    if (this.blend.active) {
      this.updateBlend(dt);
      hasChanges = true;
    }

    // Update each parameter
    for (const key of Object.keys(this.target)) {
      // Get effective target (with anticipation if active)
      let effectiveTarget = this.target[key];

      if (this.anticipation.active && this.anticipation.predicted[key] !== undefined) {
        // Drift toward predicted by anticipation influence
        const predicted = this.anticipation.predicted[key];
        effectiveTarget = this.current[key] +
          (predicted - this.current[key]) * this.anticipation.influence;
      }

      // Calculate difference
      const diff = effectiveTarget - this.current[key];

      // Skip if essentially at target
      if (Math.abs(diff) < 0.0001 && Math.abs(this.velocity[key]) < 0.0001) {
        continue;
      }

      hasChanges = true;

      // Get speed for this parameter
      const speed = this.getSpeed(key);

      // Update acceleration based on difference
      this.acceleration[key] = diff * this.accelerationFactor;

      // Apply acceleration to velocity with decay
      this.velocity[key] = this.velocity[key] * this.momentumDecay +
                          this.acceleration[key];

      // Clamp velocity
      this.velocity[key] = Math.max(-this.maxVelocity,
                          Math.min(this.maxVelocity, this.velocity[key]));

      // Update current value
      this.current[key] += this.velocity[key] * dt * speed;

      // Clamp to 0-1 range for most parameters
      if (!['scaleIndex', 'rootNote', 'octave'].includes(key)) {
        this.current[key] = Math.max(0, Math.min(1, this.current[key]));
      }
    }

    // Emit update if there were changes
    if (hasChanges) {
      this.eventBus.emit('parameters:updated', {
        current: this.getCurrent(),
        target: this.getTarget(),
        velocity: this.getVelocity()
      });

      if (this.onUpdate) {
        this.onUpdate(this.getCurrent());
      }
    }

    return hasChanges;
  }

  /**
   * Update blend mode progress
   * @param {number} dt - Delta time
   */
  updateBlend(dt) {
    const now = performance.now();
    this.blend.progress = Math.min(1, (now - this.blend.startTime) / this.blend.duration);

    // Ease function for smooth blend
    const ease = this.easeInOutCubic(this.blend.progress);

    // Update targets based on blend
    for (const key of Object.keys(this.blend.target)) {
      if (this.blend.source[key] !== undefined) {
        this.target[key] = this.blend.source[key] +
          (this.blend.target[key] - this.blend.source[key]) * ease;
      }
    }

    // Complete blend
    if (this.blend.progress >= 1) {
      this.blend.active = false;
      this.eventBus.emit('blend:complete');
    }
  }

  /**
   * Cubic ease in-out function
   * @param {number} t - Progress 0-1
   * @returns {number} Eased value
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Get morph speed for a parameter
   * @param {string} key - Parameter name
   * @returns {number} Speed multiplier
   */
  getSpeed(key) {
    return this.speeds[key] || this.speeds.default;
  }

  /**
   * Set target values
   * @param {Object} params - New target parameters
   */
  setTargets(params) {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'number') {
        // Initialize if new parameter
        if (this.target[key] === undefined) {
          this.current[key] = value;
          this.velocity[key] = 0;
          this.acceleration[key] = 0;
        }
        this.target[key] = value;
      }
    }

    this.eventBus.emit('targets:set', params);
  }

  /**
   * Set anticipation mode (drift toward predicted while typing)
   * @param {Object} predicted - Predicted parameters
   * @param {number} influence - How much to drift (0-1, default 0.1)
   */
  setAnticipation(predicted, influence = 0.1) {
    this.anticipation.active = true;
    this.anticipation.predicted = predicted;
    this.anticipation.influence = influence;

    // Reset timeout
    if (this.anticipation.timeout) {
      clearTimeout(this.anticipation.timeout);
    }

    // Auto-clear after typing stops
    this.anticipation.timeout = setTimeout(() => {
      this.clearAnticipation();
    }, this.anticipation.typingTimeout);

    this.eventBus.emit('anticipation:active', { predicted, influence });
  }

  /**
   * Clear anticipation mode
   */
  clearAnticipation() {
    if (this.anticipation.timeout) {
      clearTimeout(this.anticipation.timeout);
      this.anticipation.timeout = null;
    }

    this.anticipation.active = false;
    this.anticipation.predicted = {};

    this.eventBus.emit('anticipation:cleared');
  }

  /**
   * Blend to new parameters (50/50 blend for constellation history)
   * @param {Object} params - Target parameters
   * @param {number} duration - Blend duration in ms
   */
  blendTo(params, duration = 300) {
    this.blend.active = true;
    this.blend.source = { ...this.target };
    this.blend.target = params;
    this.blend.progress = 0;
    this.blend.duration = duration;
    this.blend.startTime = performance.now();

    // Preserve momentum from current state
    // (velocity continues, creating smooth transition)

    this.eventBus.emit('blend:start', { source: this.blend.source, target: params, duration });
  }

  /**
   * Instant jump to parameters (no interpolation)
   * @param {Object} params - Parameters to set
   */
  jumpTo(params) {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'number') {
        this.current[key] = value;
        this.target[key] = value;
        this.velocity[key] = 0;
        this.acceleration[key] = 0;
      }
    }

    this.eventBus.emit('parameters:jumped', params);
  }

  /**
   * Add current state to history
   * @param {Object} params - Parameters to save
   */
  addToHistory(params) {
    // Remove future history if we've navigated back
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push({
      params: { ...params },
      timestamp: Date.now()
    });

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.historyIndex = this.history.length - 1;
  }

  /**
   * Navigate through history
   * @param {number} direction - -1 for back, 1 for forward
   */
  navigateHistory(direction) {
    const newIndex = this.historyIndex + direction;

    if (newIndex >= 0 && newIndex < this.history.length) {
      this.historyIndex = newIndex;
      const entry = this.history[newIndex];
      this.blendTo(entry.params);

      this.eventBus.emit('history:navigated', {
        index: newIndex,
        total: this.history.length,
        params: entry.params
      });
    }
  }

  /**
   * Get current interpolated values
   * @returns {Object} Current parameter values
   */
  getCurrent() {
    return { ...this.current };
  }

  /**
   * Get target values
   * @returns {Object} Target parameter values
   */
  getTarget() {
    return { ...this.target };
  }

  /**
   * Get current velocities
   * @returns {Object} Parameter velocities
   */
  getVelocity() {
    return { ...this.velocity };
  }

  /**
   * Get audio-specific parameters
   * @returns {Object} Audio parameters
   */
  getAudioParams() {
    const params = {};
    for (const key of PARAMETER_CATEGORIES.audio) {
      if (this.current[key] !== undefined) {
        params[key] = this.current[key];
      }
    }
    return params;
  }

  /**
   * Get visual-specific parameters
   * @returns {Object} Visual parameters
   */
  getVisualParams() {
    const params = {};
    for (const key of PARAMETER_CATEGORIES.visual) {
      if (this.current[key] !== undefined) {
        params[key] = this.current[key];
      }
    }
    return params;
  }

  /**
   * Get scale parameters
   * @returns {Object} Scale parameters
   */
  getScaleParams() {
    const params = {};
    for (const key of PARAMETER_CATEGORIES.scale) {
      if (this.current[key] !== undefined) {
        params[key] = this.current[key];
      }
    }
    return params;
  }

  /**
   * Set morph speed for a parameter
   * @param {string} key - Parameter name
   * @param {number} speed - Speed multiplier
   */
  setSpeed(key, speed) {
    this.speeds[key] = speed;
  }

  /**
   * Set multiple morph speeds
   * @param {Object} speeds - Map of parameter to speed
   */
  setSpeeds(speeds) {
    Object.assign(this.speeds, speeds);
  }

  /**
   * Check if parameters are still animating
   * @returns {boolean} True if any parameter is moving
   */
  isAnimating() {
    for (const key of Object.keys(this.target)) {
      const diff = Math.abs(this.target[key] - this.current[key]);
      const vel = Math.abs(this.velocity[key]);
      if (diff > 0.001 || vel > 0.001) {
        return true;
      }
    }
    return this.blend.active;
  }

  /**
   * Get animation progress (0-1)
   * @returns {number} Overall progress toward targets
   */
  getProgress() {
    let totalDiff = 0;
    let maxDiff = 0;
    let count = 0;

    for (const key of Object.keys(this.target)) {
      const diff = Math.abs(this.target[key] - this.current[key]);
      totalDiff += diff;
      maxDiff = Math.max(maxDiff, diff);
      count++;
    }

    if (count === 0) return 1;

    // Use average difference as progress indicator
    const avgDiff = totalDiff / count;
    return Math.max(0, 1 - avgDiff);
  }

  /**
   * Start the animation loop
   */
  startAnimation() {
    if (this.animating) return;

    this.animating = true;
    this.lastUpdateTime = performance.now();

    const animate = () => {
      if (!this.animating) return;

      const now = performance.now();
      const dt = (now - this.lastUpdateTime) / 1000;
      this.lastUpdateTime = now;

      this.update(dt);

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * Stop the animation loop
   */
  stopAnimation() {
    this.animating = false;
  }

  /**
   * Reset to default state
   */
  reset() {
    this.current = { ...DEFAULT_PARAMS };
    this.target = { ...DEFAULT_PARAMS };

    for (const key of Object.keys(this.velocity)) {
      this.velocity[key] = 0;
      this.acceleration[key] = 0;
    }

    this.clearAnticipation();
    this.blend.active = false;
    this.history = [];
    this.historyIndex = -1;

    this.eventBus.emit('parameters:reset');
  }

  /**
   * Get the event bus for external subscription
   * @returns {EventBus} The event bus
   */
  getEventBus() {
    return this.eventBus;
  }

  /**
   * Serialize current state
   * @returns {Object} Serialized state
   */
  serialize() {
    return {
      current: { ...this.current },
      target: { ...this.target },
      history: this.history.slice(-10), // Last 10 entries
      historyIndex: Math.min(this.historyIndex, 9)
    };
  }

  /**
   * Restore from serialized state
   * @param {Object} state - Serialized state
   */
  deserialize(state) {
    if (state.current) this.current = { ...state.current };
    if (state.target) this.target = { ...state.target };
    if (state.history) this.history = state.history;
    if (state.historyIndex !== undefined) this.historyIndex = state.historyIndex;

    // Reset velocities
    for (const key of Object.keys(this.velocity)) {
      this.velocity[key] = 0;
      this.acceleration[key] = 0;
    }
  }
}

/**
 * Create a new parameter manager instance
 * @param {Object} options - Configuration options
 * @returns {ParameterManager} New manager instance
 */
export function createParameterManager(options = {}) {
  return new ParameterManager(options);
}

/**
 * Shared event bus instance for global coordination
 */
export const globalEventBus = new EventBus();

/**
 * Create a parameter manager with the global event bus
 * @param {Object} options - Additional options
 * @returns {ParameterManager} Manager connected to global bus
 */
export function createGlobalParameterManager(options = {}) {
  return new ParameterManager({
    ...options,
    eventBus: globalEventBus
  });
}

export { EventBus, MORPH_SPEEDS, PARAMETER_CATEGORIES, DEFAULT_PARAMS };

export default {
  ParameterManager,
  createParameterManager,
  createGlobalParameterManager,
  EventBus,
  globalEventBus,
  MORPH_SPEEDS,
  PARAMETER_CATEGORIES,
  DEFAULT_PARAMS
};
