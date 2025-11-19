/**
 * Semantic Keyword Dictionary with Scale Associations
 * Maps word categories to musical scales/worlds
 */

// Scale/World definitions
export const SCALES = {
  MAJOR: 'major',
  MINOR: 'minor',
  HARMONIC: 'harmonic',
  SUSPENDED: 'suspended',
  SLENDRO: 'slendro',
  IN_SEN: 'insen',
  BHAIRAV: 'bhairav',
  PENTATONIC: 'pentatonic',
  CHROMATIC: 'chromatic',
  WHOLE_TONE: 'wholetone',
  BLUES: 'blues',
  PHRYGIAN: 'phrygian',
  DORIAN: 'dorian',
  LYDIAN: 'lydian',
  MIXOLYDIAN: 'mixolydian',
};

// Comprehensive keyword dictionary (200+ words)
export const SEMANTIC_DICTIONARY = {
  // WATER - flowing, emotional, introspective
  water: {
    scales: [SCALES.MINOR, SCALES.SLENDRO, SCALES.DORIAN],
    keywords: [
      // Primary water words
      'ocean', 'river', 'rain', 'flow', 'water', 'sea', 'wave', 'stream',
      'lake', 'pond', 'pool', 'flood', 'tide', 'current', 'ripple', 'splash',
      'drip', 'drop', 'mist', 'fog', 'dew', 'moisture', 'humid', 'wet',
      // Extended water concepts
      'tears', 'cry', 'weep', 'fluid', 'liquid', 'aqua', 'marine', 'nautical',
      'drift', 'float', 'swim', 'dive', 'submerge', 'drown', 'sink', 'surface',
      'shore', 'beach', 'coast', 'harbor', 'bay', 'cove', 'inlet', 'delta',
      // Metaphorical water
      'emotion', 'feeling', 'intuition', 'dream', 'sleep', 'rest', 'peace',
      'calm', 'serene', 'tranquil', 'still', 'quiet', 'gentle', 'soft',
    ],
    parameters: {
      motion: 0.4,
      space: 0.7,
      complexity: 0.5,
      warmth: 0.4,
    }
  },

  // FIRE - energetic, passionate, transformative
  fire: {
    scales: [SCALES.HARMONIC, SCALES.PHRYGIAN, SCALES.CHROMATIC],
    keywords: [
      // Primary fire words
      'fire', 'flame', 'burn', 'heat', 'energy', 'blaze', 'inferno', 'ember',
      'spark', 'ignite', 'torch', 'candle', 'bonfire', 'wildfire', 'furnace',
      // Heat and temperature
      'hot', 'warm', 'scorch', 'sear', 'sizzle', 'smolder', 'glow', 'radiant',
      // Passion and intensity
      'passion', 'desire', 'rage', 'anger', 'fury', 'wrath', 'fierce', 'intense',
      'wild', 'savage', 'powerful', 'strong', 'force', 'might', 'vigor', 'vital',
      // Transformation
      'transform', 'change', 'evolve', 'mutate', 'shift', 'convert', 'transmute',
      // Action and movement
      'rush', 'charge', 'attack', 'strike', 'fight', 'battle', 'war', 'conflict',
      'explode', 'burst', 'erupt', 'detonate', 'blast', 'boom', 'crash',
    ],
    parameters: {
      motion: 0.9,
      space: 0.3,
      complexity: 0.7,
      warmth: 0.9,
    }
  },

  // EARTH - grounded, stable, natural
  earth: {
    scales: [SCALES.SUSPENDED, SCALES.PENTATONIC, SCALES.MIXOLYDIAN],
    keywords: [
      // Primary earth words
      'earth', 'ground', 'stone', 'mountain', 'rock', 'soil', 'dirt', 'clay',
      'sand', 'mud', 'dust', 'gravel', 'pebble', 'boulder', 'cliff', 'canyon',
      // Nature and plants
      'tree', 'forest', 'wood', 'leaf', 'root', 'branch', 'trunk', 'bark',
      'grass', 'field', 'meadow', 'valley', 'hill', 'plain', 'prairie', 'desert',
      'flower', 'plant', 'seed', 'grow', 'bloom', 'blossom', 'garden', 'harvest',
      // Stability concepts
      'stable', 'solid', 'firm', 'steady', 'secure', 'safe', 'anchor', 'foundation',
      'base', 'core', 'center', 'balance', 'grounded', 'rooted', 'settled',
      // Materials
      'metal', 'iron', 'steel', 'copper', 'gold', 'silver', 'bronze', 'mineral',
      'crystal', 'gem', 'diamond', 'emerald', 'ruby', 'sapphire', 'jade',
    ],
    parameters: {
      motion: 0.3,
      space: 0.5,
      complexity: 0.4,
      warmth: 0.5,
    }
  },

  // LIGHT - uplifting, hopeful, clarity
  light: {
    scales: [SCALES.MAJOR, SCALES.LYDIAN, SCALES.WHOLE_TONE],
    keywords: [
      // Primary light words
      'light', 'sun', 'bright', 'glow', 'shine', 'ray', 'beam', 'radiance',
      'luminous', 'brilliant', 'gleam', 'sparkle', 'glitter', 'shimmer', 'flash',
      // Celestial
      'star', 'moon', 'sky', 'heaven', 'celestial', 'cosmic', 'stellar', 'solar',
      'dawn', 'sunrise', 'morning', 'day', 'noon', 'afternoon', 'golden',
      // Positive emotions
      'joy', 'happy', 'bliss', 'delight', 'pleasure', 'cheer', 'merry', 'glad',
      'hope', 'faith', 'trust', 'believe', 'optimism', 'positive', 'uplift',
      // Clarity and truth
      'clear', 'pure', 'clean', 'truth', 'honest', 'open', 'transparent', 'visible',
      'see', 'vision', 'sight', 'view', 'reveal', 'illuminate', 'enlighten',
      // Life and energy
      'life', 'alive', 'living', 'birth', 'new', 'fresh', 'young', 'vibrant',
    ],
    parameters: {
      motion: 0.6,
      space: 0.6,
      complexity: 0.5,
      warmth: 0.7,
    }
  },

  // SHADOW - mysterious, introspective, depth
  shadow: {
    scales: [SCALES.IN_SEN, SCALES.BHAIRAV, SCALES.PHRYGIAN],
    keywords: [
      // Primary shadow words
      'shadow', 'dark', 'night', 'void', 'deep', 'black', 'shade', 'dim',
      'murky', 'obscure', 'hidden', 'secret', 'mystery', 'unknown', 'invisible',
      // Night and darkness
      'midnight', 'dusk', 'twilight', 'evening', 'nightfall', 'eclipse', 'gloom',
      // Emotional depth
      'fear', 'afraid', 'terror', 'horror', 'dread', 'anxiety', 'worry', 'doubt',
      'lonely', 'alone', 'isolated', 'abandoned', 'forgotten', 'lost', 'wander',
      // Philosophical
      'death', 'end', 'fade', 'vanish', 'disappear', 'nothing', 'empty', 'hollow',
      'silence', 'quiet', 'still', 'pause', 'wait', 'watch', 'listen',
      // Mystical
      'spirit', 'ghost', 'phantom', 'specter', 'haunted', 'curse', 'spell', 'magic',
      'ancient', 'old', 'eternal', 'infinite', 'abyss', 'depths', 'below',
    ],
    parameters: {
      motion: 0.3,
      space: 0.8,
      complexity: 0.6,
      warmth: 0.2,
    }
  },

  // LOVE - warm, connected, tender
  love: {
    scales: [SCALES.MAJOR, SCALES.DORIAN, SCALES.LYDIAN],
    keywords: [
      // Primary love words
      'love', 'heart', 'warm', 'embrace', 'hold', 'touch', 'kiss', 'hug',
      'care', 'cherish', 'adore', 'devotion', 'affection', 'fond', 'dear',
      // Relationships
      'friend', 'family', 'mother', 'father', 'child', 'baby', 'partner', 'soul',
      'together', 'unite', 'bond', 'connect', 'belong', 'home', 'comfort', 'safe',
      // Gentle emotions
      'gentle', 'kind', 'tender', 'soft', 'sweet', 'lovely', 'beautiful', 'grace',
      'compassion', 'mercy', 'forgive', 'accept', 'understand', 'empathy', 'sympathy',
      // Romance
      'romance', 'passion', 'desire', 'longing', 'yearn', 'miss', 'remember', 'memory',
      // Joy from love
      'smile', 'laugh', 'play', 'dance', 'sing', 'celebrate', 'gift', 'blessing',
    ],
    parameters: {
      motion: 0.5,
      space: 0.5,
      complexity: 0.4,
      warmth: 0.8,
    }
  },

  // LOSS - melancholic, reflective, poignant
  loss: {
    scales: [SCALES.MINOR, SCALES.BLUES, SCALES.PHRYGIAN],
    keywords: [
      // Primary loss words
      'loss', 'grief', 'tears', 'fade', 'gone', 'miss', 'mourn', 'sorrow',
      'sad', 'pain', 'hurt', 'ache', 'wound', 'broken', 'shatter', 'crack',
      // Endings
      'end', 'finish', 'close', 'final', 'last', 'goodbye', 'farewell', 'leave',
      'depart', 'abandon', 'forsake', 'betray', 'desert', 'reject', 'refuse',
      // Absence
      'empty', 'hollow', 'void', 'nothing', 'zero', 'none', 'lack', 'without',
      'alone', 'lonely', 'solitary', 'isolated', 'separate', 'apart', 'distant',
      // Decay
      'decay', 'rot', 'wither', 'willt', 'die', 'death', 'dead', 'grave',
      'ash', 'dust', 'ruin', 'wreck', 'destroy', 'collapse', 'fall', 'fail',
      // Regret
      'regret', 'remorse', 'guilt', 'shame', 'sorry', 'mistake', 'wrong', 'fault',
    ],
    parameters: {
      motion: 0.3,
      space: 0.7,
      complexity: 0.5,
      warmth: 0.3,
    }
  },

  // AIR/WIND - movement, freedom, breath
  air: {
    scales: [SCALES.WHOLE_TONE, SCALES.LYDIAN, SCALES.PENTATONIC],
    keywords: [
      'air', 'wind', 'breeze', 'gust', 'blow', 'breath', 'whisper', 'sigh',
      'fly', 'soar', 'glide', 'float', 'drift', 'hover', 'rise', 'ascend',
      'free', 'freedom', 'liberty', 'release', 'escape', 'open', 'vast', 'wide',
      'cloud', 'sky', 'atmosphere', 'space', 'above', 'high', 'altitude', 'summit',
      'bird', 'wing', 'feather', 'flight', 'angel', 'spirit', 'ethereal', 'light',
    ],
    parameters: {
      motion: 0.7,
      space: 0.8,
      complexity: 0.4,
      warmth: 0.5,
    }
  },

  // TIME - temporal, cyclical, eternal
  time: {
    scales: [SCALES.DORIAN, SCALES.MIXOLYDIAN, SCALES.SUSPENDED],
    keywords: [
      'time', 'moment', 'now', 'present', 'past', 'future', 'history', 'memory',
      'clock', 'hour', 'minute', 'second', 'day', 'week', 'month', 'year',
      'season', 'spring', 'summer', 'autumn', 'winter', 'cycle', 'rhythm', 'pulse',
      'forever', 'eternal', 'infinite', 'endless', 'always', 'never', 'once', 'again',
      'begin', 'start', 'origin', 'source', 'end', 'finish', 'complete', 'whole',
    ],
    parameters: {
      motion: 0.5,
      space: 0.6,
      complexity: 0.5,
      warmth: 0.5,
    }
  },
};

// Build reverse lookup map for efficiency
const wordToCategory = new Map();

function buildLookupMap() {
  for (const [category, data] of Object.entries(SEMANTIC_DICTIONARY)) {
    for (const keyword of data.keywords) {
      if (!wordToCategory.has(keyword)) {
        wordToCategory.set(keyword, []);
      }
      wordToCategory.get(keyword).push(category);
    }
  }
}

buildLookupMap();

/**
 * Analyze text for semantic categories
 * @param {string} text - Input text
 * @returns {Object} Semantic analysis results
 */
export function analyzeSemantics(text) {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const matches = {};
  const unmatchedWords = [];

  // Initialize category counts
  for (const category of Object.keys(SEMANTIC_DICTIONARY)) {
    matches[category] = {
      count: 0,
      words: [],
    };
  }

  // Analyze each word
  for (const word of words) {
    // Clean word of punctuation
    const cleanWord = word.replace(/[^a-z]/g, '');

    const categories = wordToCategory.get(cleanWord);
    if (categories) {
      for (const category of categories) {
        matches[category].count++;
        matches[category].words.push(cleanWord);
      }
    } else {
      unmatchedWords.push(cleanWord);
    }
  }

  return {
    matches,
    unmatchedWords,
    totalWords: words.length,
    matchedWords: words.length - unmatchedWords.length,
  };
}

/**
 * Get dominant semantic category from text
 * @param {string} text - Input text
 * @returns {Object} Dominant category and associated data
 */
export function getDominantCategory(text) {
  const analysis = analyzeSemantics(text);

  let dominant = null;
  let maxCount = 0;

  for (const [category, data] of Object.entries(analysis.matches)) {
    if (data.count > maxCount) {
      maxCount = data.count;
      dominant = category;
    }
  }

  if (!dominant) {
    return {
      category: 'neutral',
      scales: [SCALES.PENTATONIC],
      parameters: {
        motion: 0.5,
        space: 0.5,
        complexity: 0.5,
        warmth: 0.5,
      },
      confidence: 0,
    };
  }

  const categoryData = SEMANTIC_DICTIONARY[dominant];
  const confidence = maxCount / analysis.totalWords;

  return {
    category: dominant,
    scales: categoryData.scales,
    parameters: { ...categoryData.parameters },
    confidence: Math.min(1, confidence),
    matchedWords: analysis.matches[dominant].words,
  };
}

/**
 * Get blended parameters from multiple categories
 * @param {string} text - Input text
 * @returns {Object} Blended parameters
 */
export function getBlendedParameters(text) {
  const analysis = analyzeSemantics(text);

  // Calculate total matches
  let totalMatches = 0;
  for (const data of Object.values(analysis.matches)) {
    totalMatches += data.count;
  }

  if (totalMatches === 0) {
    return {
      scales: [SCALES.PENTATONIC],
      motion: 0.5,
      space: 0.5,
      complexity: 0.5,
      warmth: 0.5,
    };
  }

  // Blend parameters by weight
  let motion = 0, space = 0, complexity = 0, warmth = 0;
  const scaleWeights = new Map();

  for (const [category, matchData] of Object.entries(analysis.matches)) {
    if (matchData.count === 0) continue;

    const weight = matchData.count / totalMatches;
    const categoryData = SEMANTIC_DICTIONARY[category];

    motion += categoryData.parameters.motion * weight;
    space += categoryData.parameters.space * weight;
    complexity += categoryData.parameters.complexity * weight;
    warmth += categoryData.parameters.warmth * weight;

    // Accumulate scale weights
    for (const scale of categoryData.scales) {
      const current = scaleWeights.get(scale) || 0;
      scaleWeights.set(scale, current + weight);
    }
  }

  // Sort scales by weight
  const sortedScales = [...scaleWeights.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([scale]) => scale);

  return {
    scales: sortedScales.slice(0, 3),
    motion,
    space,
    complexity,
    warmth,
  };
}

/**
 * Look up a single word
 * @param {string} word - Single word
 * @returns {Object|null} Category data or null
 */
export function lookupWord(word) {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  const categories = wordToCategory.get(cleanWord);

  if (!categories) return null;

  return {
    word: cleanWord,
    categories,
    primaryCategory: categories[0],
    scales: SEMANTIC_DICTIONARY[categories[0]].scales,
    parameters: SEMANTIC_DICTIONARY[categories[0]].parameters,
  };
}

/**
 * Get all words in dictionary
 * @returns {string[]} All keywords
 */
export function getAllKeywords() {
  return [...wordToCategory.keys()];
}

/**
 * Get statistics about the dictionary
 * @returns {Object} Dictionary statistics
 */
export function getDictionaryStats() {
  const stats = {
    totalCategories: Object.keys(SEMANTIC_DICTIONARY).length,
    totalKeywords: wordToCategory.size,
    categorySizes: {},
  };

  for (const [category, data] of Object.entries(SEMANTIC_DICTIONARY)) {
    stats.categorySizes[category] = data.keywords.length;
  }

  return stats;
}

export default {
  SCALES,
  SEMANTIC_DICTIONARY,
  analyzeSemantics,
  getDominantCategory,
  getBlendedParameters,
  lookupWord,
  getAllKeywords,
  getDictionaryStats,
};
