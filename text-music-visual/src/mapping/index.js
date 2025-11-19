/**
 * Text-to-Music Mapping System
 * Triple-layer architecture: Phonetic, Semantic, Sentiment
 *
 * This module provides comprehensive text analysis for musical parameter generation.
 */

// Layer 1: Phonetic Analysis
export {
  extractPhonemes,
  mapToSynthParams as phonemeToSynth,
  describePhoneticProfile,
  analyzeWord as analyzeWordPhonetics,
  PHONEME_PATTERNS,
} from './phonemes.js';

// Layer 2: Semantic Analysis
export {
  SCALES,
  SEMANTIC_DICTIONARY,
  analyzeSemantics,
  getDominantCategory,
  getBlendedParameters,
  lookupWord,
  getAllKeywords,
  getDictionaryStats,
} from './semantics.js';

// Layer 3: Sentiment Analysis
export {
  analyzeSentiment,
  mapToSynthParams as sentimentToSynth,
  getEmotionalQuadrant,
  getEmotionalState,
  analyzeWord as analyzeWordSentiment,
  getSentimentTrajectory,
  interpolateSentiment,
  VALENCE_WORDS,
  AROUSAL_WORDS,
} from './sentiment.js';

// Context Accumulation
export {
  ContextAccumulator,
  createContext,
  blendParameters,
} from './context.js';

// Fusion Engine
export {
  FusionEngine,
  createFusionEngine,
  quickAnalyze,
} from './fusion.js';

// Magic Words
export {
  MAGIC_WORDS,
  getMagicWord,
  isMagicWord,
  getAllMagicWords,
  getMagicWordsByCategory,
  getCategories as getMagicWordCategories,
  getMagicWordStats,
} from './magicWords.js';

// Convenience default export
export default {
  // Main entry point
  createFusionEngine,
  quickAnalyze,

  // Individual layers
  extractPhonemes,
  analyzeSemantics,
  analyzeSentiment,

  // Context
  createContext,

  // Magic words
  getMagicWord,
  isMagicWord,

  // Constants
  SCALES,
  SEMANTIC_DICTIONARY,
  MAGIC_WORDS,
};
