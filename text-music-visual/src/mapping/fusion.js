/**
 * Fusion Module - Combines Three Mapping Layers
 * Merges phonetic, semantic, and sentiment analysis into final synthesis parameters
 */

import { extractPhonemes, mapToSynthParams as phonemeToSynth } from './phonemes.js';
import { lookupWord, getDominantCategory, getBlendedParameters } from './semantics.js';
import { analyzeSentiment, mapToSynthParams as sentimentToSynth, getEmotionalState } from './sentiment.js';
import { ContextAccumulator, blendParameters } from './context.js';
import { getMagicWord } from './magicWords.js';

/**
 * Main Fusion Engine Class
 */
export class FusionEngine {
  constructor(options = {}) {
    // Layer weights
    this.weights = {
      phonetic: options.phoneticWeight || 0.25,
      semantic: options.semanticWeight || 0.35,
      sentiment: options.sentimentWeight || 0.25,
      context: options.contextWeight || 0.15,
    };

    // Context accumulator
    this.context = new ContextAccumulator(options.contextOptions || {});

    // Interpolation settings
    this.smoothing = options.smoothing || 0.3;
    this.previousOutput = null;
  }

  /**
   * Process a single word through all layers
   * @param {string} word - Input word
   * @returns {Object} Complete analysis and fused parameters
   */
  processWord(word) {
    // Check for magic word first
    const magicResult = getMagicWord(word);
    if (magicResult) {
      return this.processMagicWord(word, magicResult);
    }

    // Layer 1: Phonetic analysis
    const phonemes = extractPhonemes(word);
    const phoneticParams = phonemeToSynth(phonemes);

    // Layer 2: Semantic analysis
    const semantic = lookupWord(word);
    const semanticParams = semantic ? semantic.parameters : this.getDefaultSemanticParams();

    // Layer 3: Sentiment analysis
    const sentiment = analyzeSentiment(word);
    const sentimentParams = sentimentToSynth(sentiment);
    const emotionalState = getEmotionalState(sentiment.valence, sentiment.arousal);

    // Fuse the three layers
    const fusedParams = this.fuseParameters(phoneticParams, semanticParams, sentimentParams);

    // Create word data for context
    const wordData = {
      word,
      phonemes,
      semantic,
      sentiment,
      emotionalState,
      parameters: fusedParams,
      scales: semantic ? semantic.scales : [],
      semanticCategory: semantic ? semantic.primaryCategory : null,
    };

    // Update context
    this.context.addWord(wordData);

    // Apply context influence
    const contextualParams = this.applyContext(fusedParams);

    // Smooth transition
    const smoothedParams = this.smoothParameters(contextualParams);

    // Determine final scale selection
    const scales = this.selectScales(semantic, this.context);

    return {
      word,
      layers: {
        phonetic: phoneticParams,
        semantic: semanticParams,
        sentiment: sentimentParams,
      },
      analysis: {
        phonemes,
        semantic,
        sentiment,
        emotionalState,
      },
      parameters: smoothedParams,
      scales,
      context: this.context.getContext(),
      isMagicWord: false,
    };
  }

  /**
   * Process a magic word with its special parameters
   * @param {string} word - Magic word
   * @param {Object} magicData - Magic word data
   * @returns {Object} Complete analysis with magic overrides
   */
  processMagicWord(word, magicData) {
    // Still do basic analysis for context
    const phonemes = extractPhonemes(word);
    const sentiment = analyzeSentiment(word);
    const emotionalState = getEmotionalState(sentiment.valence, sentiment.arousal);

    // Create word data for context
    const wordData = {
      word,
      phonemes,
      semantic: null,
      sentiment,
      emotionalState,
      parameters: magicData.parameters,
      scales: magicData.scales,
      semanticCategory: magicData.category,
      isMagicWord: true,
    };

    // Update context
    this.context.addWord(wordData);

    // Apply light context influence (magic words are more independent)
    const contextualParams = this.applyContext(magicData.parameters, 0.3);

    // Smooth transition
    const smoothedParams = this.smoothParameters(contextualParams);

    return {
      word,
      layers: {
        phonetic: {},
        semantic: magicData.parameters,
        sentiment: {},
      },
      analysis: {
        phonemes,
        semantic: null,
        sentiment,
        emotionalState,
        magicWord: magicData,
      },
      parameters: smoothedParams,
      scales: magicData.scales,
      context: this.context.getContext(),
      isMagicWord: true,
      magicDescription: magicData.description,
    };
  }

  /**
   * Process a phrase (multiple words)
   * @param {string} phrase - Input phrase
   * @returns {Object} Combined analysis for the phrase
   */
  processPhrase(phrase) {
    const words = phrase.split(/\s+/).filter(w => w.length > 0);
    const wordResults = [];

    // Process each word
    for (const word of words) {
      wordResults.push(this.processWord(word));
    }

    // Get phrase-level semantic analysis
    const phraseSemantics = getBlendedParameters(phrase);
    const phraseSentiment = analyzeSentiment(phrase);

    // Combine word-level parameters
    const combinedParams = this.combineWordParameters(wordResults);

    // Apply phrase-level influences
    const phraseParams = this.fuseParameters(
      combinedParams,
      {
        motion: phraseSemantics.motion,
        space: phraseSemantics.space,
        complexity: phraseSemantics.complexity,
        warmth: phraseSemantics.warmth,
      },
      sentimentToSynth(phraseSentiment)
    );

    return {
      phrase,
      words: wordResults,
      parameters: phraseParams,
      scales: phraseSemantics.scales,
      sentiment: phraseSentiment,
      emotionalState: getEmotionalState(phraseSentiment.valence, phraseSentiment.arousal),
      context: this.context.getContext(),
    };
  }

  /**
   * Fuse parameters from three layers
   * @param {Object} phonetic - Phonetic parameters
   * @param {Object} semantic - Semantic parameters
   * @param {Object} sentiment - Sentiment parameters
   * @returns {Object} Fused parameters
   */
  fuseParameters(phonetic, semantic, sentiment) {
    const w = this.weights;
    const totalWeight = w.phonetic + w.semantic + w.sentiment;

    // Normalize weights
    const wp = w.phonetic / totalWeight;
    const ws = w.semantic / totalWeight;
    const wt = w.sentiment / totalWeight;

    return {
      // Texture parameters (phonetic-dominant)
      airGain: phonetic.airGain || 0.3,
      attackSharpness: (phonetic.attackSharpness || 0.5) * 0.6 +
                       (sentiment.attackSharpness || 0.5) * 0.4,
      attackTime: phonetic.attackTime || 0.1,
      graininess: phonetic.graininess || 0.2,

      // Tonal parameters (blended)
      brilliance: (phonetic.brilliance || 0.5) * wp +
                  (semantic.warmth || 0.5) * ws +
                  (sentiment.brilliance || 0.5) * wt,
      filterResonance: phonetic.filterResonance || 0.3,
      filterCutoff: sentiment.filterCutoff || 0.5,

      // Sustain parameters (phonetic + semantic)
      bodyLayerSustain: phonetic.bodyLayerSustain || 0.5,
      releaseTime: (phonetic.releaseTime || 0.3) * 0.5 +
                   (sentiment.releaseTime || 0.3) * 0.5,

      // Spatial parameters (semantic + sentiment)
      motion: (semantic.motion || 0.5) * ws +
              (sentiment.motion || 0.5) * wt +
              0.5 * wp,
      space: (semantic.space || 0.5) * ws +
             (sentiment.space || 0.5) * wt +
             0.5 * wp,
      reverbMix: sentiment.reverbMix || 0.3,

      // Harmonic parameters
      harmonicContent: phonetic.harmonicContent || 0.5,
      harmonicDensity: sentiment.harmonicDensity || 0.5,
      complexity: semantic.complexity || 0.5,

      // Temporal parameters
      tempo: sentiment.tempo || 0.5,
      driftSpeed: sentiment.driftSpeed || 0.2,

      // Global warmth
      warmth: semantic.warmth || 0.5,
    };
  }

  /**
   * Apply context influence to parameters
   * @param {Object} params - Current parameters
   * @param {number} influence - Context influence (0-1)
   * @returns {Object} Context-adjusted parameters
   */
  applyContext(params, influence = null) {
    const contextInfluence = influence !== null ? influence : this.weights.context;

    // Get context parameters
    const shortTermAvg = this.context.getShortTermAverages();
    const longTermParams = this.context.longTerm;
    const harmonicDensity = this.context.getHarmonicDensity();

    // Blend with context
    const blended = blendParameters(
      params,
      shortTermAvg,
      {
        motion: longTermParams.motion,
        space: longTermParams.space,
        complexity: longTermParams.complexity,
        warmth: longTermParams.warmth,
        brilliance: longTermParams.brilliance,
      },
      {
        immediate: 1 - contextInfluence,
        shortTerm: contextInfluence * 0.6,
        longTerm: contextInfluence * 0.4,
      }
    );

    // Apply harmonic density
    const adjustedParams = { ...params };
    for (const key of Object.keys(blended)) {
      if (params[key] !== undefined) {
        adjustedParams[key] = blended[key];
      }
    }

    adjustedParams.harmonicDensity = (params.harmonicDensity || 0.5) * (1 - contextInfluence) +
                                     harmonicDensity * contextInfluence;

    return adjustedParams;
  }

  /**
   * Smooth parameter transitions
   * @param {Object} params - Current parameters
   * @returns {Object} Smoothed parameters
   */
  smoothParameters(params) {
    if (!this.previousOutput) {
      this.previousOutput = params;
      return params;
    }

    const smoothed = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'number' && this.previousOutput[key] !== undefined) {
        smoothed[key] = this.previousOutput[key] * this.smoothing +
                       value * (1 - this.smoothing);
      } else {
        smoothed[key] = value;
      }
    }

    this.previousOutput = smoothed;
    return smoothed;
  }

  /**
   * Select scales based on semantic and context
   * @param {Object} semantic - Semantic analysis
   * @param {ContextAccumulator} context - Context accumulator
   * @returns {Array} Selected scales
   */
  selectScales(semantic, context) {
    // Get immediate scales
    const immediateScales = semantic ? semantic.scales : [];

    // Get dominant scale from context
    const dominantScale = context.getDominantScale();

    // Combine with preference to immediate
    const scales = [...immediateScales];

    // Add dominant scale if different
    if (dominantScale && !scales.includes(dominantScale)) {
      scales.push(dominantScale);
    }

    // Default fallback
    if (scales.length === 0) {
      scales.push('pentatonic');
    }

    return scales.slice(0, 3);
  }

  /**
   * Combine parameters from multiple words
   * @param {Array} wordResults - Array of word results
   * @returns {Object} Combined parameters
   */
  combineWordParameters(wordResults) {
    if (wordResults.length === 0) {
      return this.getDefaultParams();
    }

    const combined = {};
    const paramKeys = Object.keys(wordResults[0].parameters);

    for (const key of paramKeys) {
      let sum = 0;
      let count = 0;

      for (const result of wordResults) {
        if (result.parameters[key] !== undefined) {
          sum += result.parameters[key];
          count++;
        }
      }

      combined[key] = count > 0 ? sum / count : 0.5;
    }

    return combined;
  }

  /**
   * Get default parameters
   * @returns {Object} Default parameter set
   */
  getDefaultParams() {
    return {
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
      driftSpeed: 0.2,
      warmth: 0.5,
    };
  }

  /**
   * Get default semantic parameters
   * @returns {Object} Default semantic parameters
   */
  getDefaultSemanticParams() {
    return {
      motion: 0.5,
      space: 0.5,
      complexity: 0.5,
      warmth: 0.5,
    };
  }

  /**
   * Reset the fusion engine
   */
  reset() {
    this.context.reset();
    this.previousOutput = null;
  }

  /**
   * Get session statistics
   * @returns {Object} Session stats
   */
  getStats() {
    return this.context.getSessionStats();
  }

  /**
   * Set layer weights
   * @param {Object} weights - New weights
   */
  setWeights(weights) {
    if (weights.phonetic !== undefined) this.weights.phonetic = weights.phonetic;
    if (weights.semantic !== undefined) this.weights.semantic = weights.semantic;
    if (weights.sentiment !== undefined) this.weights.sentiment = weights.sentiment;
    if (weights.context !== undefined) this.weights.context = weights.context;
  }
}

/**
 * Create a new fusion engine
 * @param {Object} options - Configuration options
 * @returns {FusionEngine} New engine instance
 */
export function createFusionEngine(options = {}) {
  return new FusionEngine(options);
}

/**
 * Quick analysis of text without context
 * @param {string} text - Input text
 * @returns {Object} Quick analysis results
 */
export function quickAnalyze(text) {
  const engine = new FusionEngine();

  if (text.includes(' ')) {
    return engine.processPhrase(text);
  } else {
    return engine.processWord(text);
  }
}

export default {
  FusionEngine,
  createFusionEngine,
  quickAnalyze,
};
