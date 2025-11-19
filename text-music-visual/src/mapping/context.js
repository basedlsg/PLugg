/**
 * Context Accumulator with Decay
 * Manages immediate, short-term, and long-term context for text-to-music mapping
 */

/**
 * Context Accumulator Class
 * Maintains three layers of context with exponential decay
 */
export class ContextAccumulator {
  constructor(options = {}) {
    // Configuration
    this.shortTermSize = options.shortTermSize || 5;        // Words in short-term memory
    this.longTermDecay = options.longTermDecay || 0.95;     // Decay rate per word
    this.parameterDecay = options.parameterDecay || 0.9;    // Parameter smoothing

    // Context storage
    this.immediate = null;
    this.shortTerm = [];
    this.longTerm = {
      // Accumulated parameter influences
      motion: 0.5,
      space: 0.5,
      complexity: 0.5,
      warmth: 0.5,
      brilliance: 0.5,

      // Accumulated semantic influences
      semanticWeights: new Map(),

      // Session statistics
      totalWords: 0,
      sentimentHistory: [],
      scaleHistory: [],
    };

    // Time tracking
    this.lastUpdateTime = Date.now();
    this.sessionStartTime = Date.now();
  }

  /**
   * Add a new word to the context
   * @param {Object} wordData - Processed word data
   */
  addWord(wordData) {
    const now = Date.now();
    const timeDelta = (now - this.lastUpdateTime) / 1000; // seconds

    // Apply time-based decay to long-term context
    this.applyTimeDecay(timeDelta);

    // Update immediate context
    this.immediate = wordData;

    // Update short-term context
    this.shortTerm.push(wordData);
    if (this.shortTerm.length > this.shortTermSize) {
      this.shortTerm.shift();
    }

    // Update long-term context
    this.updateLongTerm(wordData);

    this.lastUpdateTime = now;
  }

  /**
   * Apply time-based decay to accumulated parameters
   * @param {number} timeDelta - Time since last update in seconds
   */
  applyTimeDecay(timeDelta) {
    // Faster decay for longer pauses
    const decayFactor = Math.pow(this.longTermDecay, timeDelta);

    // Decay towards neutral (0.5)
    this.longTerm.motion = this.decayToNeutral(this.longTerm.motion, decayFactor);
    this.longTerm.space = this.decayToNeutral(this.longTerm.space, decayFactor);
    this.longTerm.complexity = this.decayToNeutral(this.longTerm.complexity, decayFactor);
    this.longTerm.warmth = this.decayToNeutral(this.longTerm.warmth, decayFactor);
    this.longTerm.brilliance = this.decayToNeutral(this.longTerm.brilliance, decayFactor);

    // Decay semantic weights
    for (const [key, value] of this.longTerm.semanticWeights) {
      this.longTerm.semanticWeights.set(key, value * decayFactor);
    }
  }

  /**
   * Decay a value towards neutral (0.5)
   * @param {number} value - Current value
   * @param {number} factor - Decay factor
   * @returns {number} Decayed value
   */
  decayToNeutral(value, factor) {
    return 0.5 + (value - 0.5) * factor;
  }

  /**
   * Update long-term context with new word data
   * @param {Object} wordData - Processed word data
   */
  updateLongTerm(wordData) {
    this.longTerm.totalWords++;

    // Blend in new parameters
    if (wordData.parameters) {
      const blend = 1 - this.parameterDecay;

      if (wordData.parameters.motion !== undefined) {
        this.longTerm.motion = this.longTerm.motion * this.parameterDecay +
                               wordData.parameters.motion * blend;
      }
      if (wordData.parameters.space !== undefined) {
        this.longTerm.space = this.longTerm.space * this.parameterDecay +
                              wordData.parameters.space * blend;
      }
      if (wordData.parameters.complexity !== undefined) {
        this.longTerm.complexity = this.longTerm.complexity * this.parameterDecay +
                                   wordData.parameters.complexity * blend;
      }
      if (wordData.parameters.warmth !== undefined) {
        this.longTerm.warmth = this.longTerm.warmth * this.parameterDecay +
                               wordData.parameters.warmth * blend;
      }
      if (wordData.parameters.brilliance !== undefined) {
        this.longTerm.brilliance = this.longTerm.brilliance * this.parameterDecay +
                                   wordData.parameters.brilliance * blend;
      }
    }

    // Update semantic weights
    if (wordData.semanticCategory) {
      const current = this.longTerm.semanticWeights.get(wordData.semanticCategory) || 0;
      this.longTerm.semanticWeights.set(wordData.semanticCategory, current + 1);
    }

    // Track sentiment history
    if (wordData.sentiment) {
      this.longTerm.sentimentHistory.push({
        valence: wordData.sentiment.valence,
        arousal: wordData.sentiment.arousal,
        time: Date.now(),
      });

      // Keep only recent history
      if (this.longTerm.sentimentHistory.length > 100) {
        this.longTerm.sentimentHistory.shift();
      }
    }

    // Track scale history
    if (wordData.scales && wordData.scales.length > 0) {
      this.longTerm.scaleHistory.push(wordData.scales[0]);

      if (this.longTerm.scaleHistory.length > 50) {
        this.longTerm.scaleHistory.shift();
      }
    }
  }

  /**
   * Get current context state
   * @returns {Object} Current context
   */
  getContext() {
    return {
      immediate: this.immediate,
      shortTerm: [...this.shortTerm],
      longTerm: {
        parameters: {
          motion: this.longTerm.motion,
          space: this.longTerm.space,
          complexity: this.longTerm.complexity,
          warmth: this.longTerm.warmth,
          brilliance: this.longTerm.brilliance,
        },
        semanticWeights: new Map(this.longTerm.semanticWeights),
        totalWords: this.longTerm.totalWords,
        sessionDuration: Date.now() - this.sessionStartTime,
      },
    };
  }

  /**
   * Get short-term parameter averages
   * @returns {Object} Averaged parameters from short-term context
   */
  getShortTermAverages() {
    if (this.shortTerm.length === 0) {
      return {
        motion: 0.5,
        space: 0.5,
        complexity: 0.5,
        warmth: 0.5,
        brilliance: 0.5,
      };
    }

    const sums = {
      motion: 0,
      space: 0,
      complexity: 0,
      warmth: 0,
      brilliance: 0,
    };

    let count = 0;
    for (const word of this.shortTerm) {
      if (word.parameters) {
        sums.motion += word.parameters.motion || 0.5;
        sums.space += word.parameters.space || 0.5;
        sums.complexity += word.parameters.complexity || 0.5;
        sums.warmth += word.parameters.warmth || 0.5;
        sums.brilliance += word.parameters.brilliance || 0.5;
        count++;
      }
    }

    if (count === 0) {
      return sums;
    }

    return {
      motion: sums.motion / count,
      space: sums.space / count,
      complexity: sums.complexity / count,
      warmth: sums.warmth / count,
      brilliance: sums.brilliance / count,
    };
  }

  /**
   * Get sentiment trend over short-term context
   * @returns {Object} Sentiment trend
   */
  getSentimentTrend() {
    if (this.longTerm.sentimentHistory.length < 2) {
      return {
        valenceDirection: 0,
        arousalDirection: 0,
        stability: 1,
      };
    }

    const recent = this.longTerm.sentimentHistory.slice(-10);

    // Calculate direction (positive = increasing)
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));

    const firstValence = firstHalf.reduce((sum, s) => sum + s.valence, 0) / firstHalf.length;
    const secondValence = secondHalf.reduce((sum, s) => sum + s.valence, 0) / secondHalf.length;
    const firstArousal = firstHalf.reduce((sum, s) => sum + s.arousal, 0) / firstHalf.length;
    const secondArousal = secondHalf.reduce((sum, s) => sum + s.arousal, 0) / secondHalf.length;

    // Calculate stability (low variance = stable)
    const avgValence = recent.reduce((sum, s) => sum + s.valence, 0) / recent.length;
    const variance = recent.reduce((sum, s) => sum + Math.pow(s.valence - avgValence, 2), 0) / recent.length;
    const stability = Math.max(0, 1 - Math.sqrt(variance) * 2);

    return {
      valenceDirection: secondValence - firstValence,
      arousalDirection: secondArousal - firstArousal,
      stability,
    };
  }

  /**
   * Get dominant semantic category from long-term context
   * @returns {string|null} Dominant category
   */
  getDominantCategory() {
    let maxWeight = 0;
    let dominant = null;

    for (const [category, weight] of this.longTerm.semanticWeights) {
      if (weight > maxWeight) {
        maxWeight = weight;
        dominant = category;
      }
    }

    return dominant;
  }

  /**
   * Get most common scale from history
   * @returns {string|null} Most common scale
   */
  getDominantScale() {
    if (this.longTerm.scaleHistory.length === 0) {
      return null;
    }

    const counts = new Map();
    for (const scale of this.longTerm.scaleHistory) {
      counts.set(scale, (counts.get(scale) || 0) + 1);
    }

    let maxCount = 0;
    let dominant = null;
    for (const [scale, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        dominant = scale;
      }
    }

    return dominant;
  }

  /**
   * Get harmonic density based on context
   * Higher density for more complex/rich context
   * @returns {number} Density 0-1
   */
  getHarmonicDensity() {
    // Base on short-term complexity
    const shortTermAvg = this.getShortTermAverages();

    // Factor in semantic variety
    const semanticVariety = Math.min(1, this.longTerm.semanticWeights.size / 5);

    // Factor in recent word count
    const recentActivity = Math.min(1, this.shortTerm.length / this.shortTermSize);

    return (
      shortTermAvg.complexity * 0.4 +
      semanticVariety * 0.3 +
      recentActivity * 0.3
    );
  }

  /**
   * Reset the context accumulator
   */
  reset() {
    this.immediate = null;
    this.shortTerm = [];
    this.longTerm = {
      motion: 0.5,
      space: 0.5,
      complexity: 0.5,
      warmth: 0.5,
      brilliance: 0.5,
      semanticWeights: new Map(),
      totalWords: 0,
      sentimentHistory: [],
      scaleHistory: [],
    };
    this.lastUpdateTime = Date.now();
    this.sessionStartTime = Date.now();
  }

  /**
   * Get session statistics
   * @returns {Object} Session stats
   */
  getSessionStats() {
    const duration = Date.now() - this.sessionStartTime;
    const wordsPerMinute = this.longTerm.totalWords / (duration / 60000);

    return {
      totalWords: this.longTerm.totalWords,
      duration,
      wordsPerMinute,
      dominantCategory: this.getDominantCategory(),
      dominantScale: this.getDominantScale(),
      currentHarmonicDensity: this.getHarmonicDensity(),
      sentimentTrend: this.getSentimentTrend(),
    };
  }
}

/**
 * Create a new context accumulator with default settings
 * @param {Object} options - Configuration options
 * @returns {ContextAccumulator} New accumulator instance
 */
export function createContext(options = {}) {
  return new ContextAccumulator(options);
}

/**
 * Blend immediate and contextual parameters
 * @param {Object} immediate - Immediate word parameters
 * @param {Object} shortTerm - Short-term averages
 * @param {Object} longTerm - Long-term parameters
 * @param {Object} weights - Blending weights
 * @returns {Object} Blended parameters
 */
export function blendParameters(immediate, shortTerm, longTerm, weights = {}) {
  const w = {
    immediate: weights.immediate || 0.5,
    shortTerm: weights.shortTerm || 0.3,
    longTerm: weights.longTerm || 0.2,
  };

  // Normalize weights
  const total = w.immediate + w.shortTerm + w.longTerm;
  w.immediate /= total;
  w.shortTerm /= total;
  w.longTerm /= total;

  const blend = (key) => {
    const i = immediate[key] || 0.5;
    const s = shortTerm[key] || 0.5;
    const l = longTerm[key] || 0.5;
    return i * w.immediate + s * w.shortTerm + l * w.longTerm;
  };

  return {
    motion: blend('motion'),
    space: blend('space'),
    complexity: blend('complexity'),
    warmth: blend('warmth'),
    brilliance: blend('brilliance'),
  };
}

export default {
  ContextAccumulator,
  createContext,
  blendParameters,
};
