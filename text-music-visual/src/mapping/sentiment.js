/**
 * Sentiment Analysis - Valence/Arousal Mapping
 * Maps emotional characteristics to performance parameters
 */

// Valence word lists (positive/negative)
const VALENCE_WORDS = {
  positive: {
    strong: [
      'amazing', 'wonderful', 'fantastic', 'excellent', 'brilliant', 'perfect',
      'beautiful', 'magnificent', 'glorious', 'spectacular', 'incredible', 'marvelous',
      'love', 'adore', 'cherish', 'treasure', 'bliss', 'ecstasy', 'euphoria',
      'triumph', 'victory', 'success', 'achieve', 'accomplish', 'conquer',
    ],
    moderate: [
      'good', 'nice', 'pleasant', 'happy', 'glad', 'pleased', 'satisfied',
      'enjoy', 'like', 'appreciate', 'grateful', 'thankful', 'blessed',
      'hope', 'optimistic', 'positive', 'confident', 'sure', 'certain',
      'calm', 'peaceful', 'serene', 'tranquil', 'relaxed', 'comfortable',
      'bright', 'light', 'clear', 'fresh', 'clean', 'pure', 'true',
    ],
    mild: [
      'okay', 'fine', 'alright', 'decent', 'fair', 'reasonable', 'acceptable',
      'steady', 'stable', 'balanced', 'neutral', 'normal', 'regular',
    ],
  },
  negative: {
    strong: [
      'terrible', 'horrible', 'awful', 'dreadful', 'appalling', 'atrocious',
      'hate', 'despise', 'loathe', 'detest', 'abhor', 'disgust', 'revolt',
      'agony', 'torment', 'torture', 'suffering', 'anguish', 'misery', 'despair',
      'destroy', 'devastate', 'annihilate', 'obliterate', 'ruin', 'wreck',
    ],
    moderate: [
      'bad', 'poor', 'sad', 'unhappy', 'upset', 'disappointed', 'frustrated',
      'angry', 'mad', 'annoyed', 'irritated', 'bothered', 'troubled',
      'worried', 'anxious', 'nervous', 'afraid', 'scared', 'fearful',
      'lonely', 'alone', 'isolated', 'abandoned', 'rejected', 'forgotten',
      'dark', 'dim', 'dull', 'grey', 'bleak', 'gloomy', 'dreary',
    ],
    mild: [
      'not', 'no', 'none', 'nothing', 'never', 'neither', 'without',
      'less', 'few', 'little', 'small', 'slight', 'minor', 'trivial',
    ],
  },
};

// Arousal word lists (high/low energy)
const AROUSAL_WORDS = {
  high: {
    strong: [
      'explode', 'burst', 'erupt', 'blast', 'boom', 'crash', 'smash',
      'rush', 'race', 'sprint', 'dash', 'fly', 'soar', 'zoom',
      'scream', 'shout', 'yell', 'roar', 'cry', 'shriek', 'wail',
      'rage', 'fury', 'wrath', 'frenzy', 'madness', 'chaos', 'storm',
      'fight', 'battle', 'war', 'attack', 'strike', 'hit', 'punch',
      'ecstasy', 'thrill', 'excitement', 'exhilaration', 'elation',
    ],
    moderate: [
      'quick', 'fast', 'rapid', 'swift', 'speedy', 'hasty', 'hurry',
      'run', 'jump', 'leap', 'bounce', 'spring', 'climb', 'rise',
      'push', 'pull', 'grab', 'catch', 'throw', 'kick', 'spin',
      'loud', 'noisy', 'busy', 'active', 'lively', 'energetic', 'dynamic',
      'eager', 'keen', 'enthusiastic', 'passionate', 'intense', 'fierce',
      'bright', 'vivid', 'bold', 'sharp', 'strong', 'powerful', 'mighty',
    ],
  },
  low: {
    strong: [
      'sleep', 'slumber', 'dream', 'rest', 'doze', 'nap', 'hibernate',
      'dead', 'death', 'still', 'frozen', 'paralyzed', 'numb', 'empty',
      'silent', 'quiet', 'mute', 'hushed', 'muffled', 'faint', 'dim',
      'fade', 'vanish', 'disappear', 'dissolve', 'melt', 'evaporate',
    ],
    moderate: [
      'slow', 'gentle', 'soft', 'mild', 'calm', 'peaceful', 'tranquil',
      'walk', 'stroll', 'wander', 'drift', 'float', 'glide', 'sway',
      'sit', 'stand', 'stay', 'wait', 'pause', 'stop', 'rest',
      'breathe', 'sigh', 'whisper', 'murmur', 'hum', 'lull', 'soothe',
      'relax', 'ease', 'comfort', 'settle', 'steady', 'stable', 'still',
      'pale', 'faded', 'muted', 'subtle', 'delicate', 'light', 'airy',
    ],
  },
};

// Intensifiers and modifiers
const MODIFIERS = {
  amplifiers: [
    'very', 'really', 'extremely', 'incredibly', 'absolutely', 'totally',
    'completely', 'utterly', 'entirely', 'thoroughly', 'deeply', 'highly',
    'so', 'too', 'such', 'much', 'most', 'more', 'super', 'ultra',
  ],
  diminishers: [
    'slightly', 'somewhat', 'fairly', 'rather', 'quite', 'a bit',
    'a little', 'barely', 'hardly', 'scarcely', 'almost', 'nearly',
  ],
  negators: [
    'not', 'no', 'never', 'neither', 'nor', 'none', 'nothing',
    'hardly', 'barely', 'scarcely', 'without', 'lack',
  ],
};

// Build lookup maps
const valenceLookup = new Map();
const arousalLookup = new Map();

function buildLookupMaps() {
  // Valence mappings
  for (const word of VALENCE_WORDS.positive.strong) {
    valenceLookup.set(word, 0.9);
  }
  for (const word of VALENCE_WORDS.positive.moderate) {
    valenceLookup.set(word, 0.7);
  }
  for (const word of VALENCE_WORDS.positive.mild) {
    valenceLookup.set(word, 0.55);
  }
  for (const word of VALENCE_WORDS.negative.strong) {
    valenceLookup.set(word, 0.1);
  }
  for (const word of VALENCE_WORDS.negative.moderate) {
    valenceLookup.set(word, 0.3);
  }
  for (const word of VALENCE_WORDS.negative.mild) {
    valenceLookup.set(word, 0.45);
  }

  // Arousal mappings
  for (const word of AROUSAL_WORDS.high.strong) {
    arousalLookup.set(word, 0.9);
  }
  for (const word of AROUSAL_WORDS.high.moderate) {
    arousalLookup.set(word, 0.7);
  }
  for (const word of AROUSAL_WORDS.low.strong) {
    arousalLookup.set(word, 0.1);
  }
  for (const word of AROUSAL_WORDS.low.moderate) {
    arousalLookup.set(word, 0.3);
  }
}

buildLookupMaps();

/**
 * Analyze sentiment of text
 * @param {string} text - Input text
 * @returns {Object} Sentiment analysis results
 */
export function analyzeSentiment(text) {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  let valenceSum = 0;
  let valenceCount = 0;
  let arousalSum = 0;
  let arousalCount = 0;

  let modifier = 1.0;
  let negated = false;

  const valenceWords = [];
  const arousalWords = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^a-z]/g, '');

    // Check for modifiers
    if (MODIFIERS.amplifiers.includes(word)) {
      modifier = 1.5;
      continue;
    }
    if (MODIFIERS.diminishers.includes(word)) {
      modifier = 0.5;
      continue;
    }
    if (MODIFIERS.negators.includes(word)) {
      negated = true;
      continue;
    }

    // Check valence
    if (valenceLookup.has(word)) {
      let value = valenceLookup.get(word);

      // Apply modifiers
      if (negated) {
        value = 1 - value;
        negated = false;
      }

      // Apply amplifier/diminisher (move further from neutral)
      const distance = Math.abs(value - 0.5);
      const direction = value > 0.5 ? 1 : -1;
      value = 0.5 + (distance * modifier * direction);
      value = Math.max(0, Math.min(1, value));

      valenceSum += value;
      valenceCount++;
      valenceWords.push({ word, value });
      modifier = 1.0;
    }

    // Check arousal
    if (arousalLookup.has(word)) {
      let value = arousalLookup.get(word);

      // Apply amplifier/diminisher
      const distance = Math.abs(value - 0.5);
      const direction = value > 0.5 ? 1 : -1;
      value = 0.5 + (distance * modifier * direction);
      value = Math.max(0, Math.min(1, value));

      arousalSum += value;
      arousalCount++;
      arousalWords.push({ word, value });
      modifier = 1.0;
    }

    // Reset modifier if word wasn't a sentiment word
    if (!valenceLookup.has(word) && !arousalLookup.has(word)) {
      modifier = 1.0;
      negated = false;
    }
  }

  // Calculate averages
  const valence = valenceCount > 0 ? valenceSum / valenceCount : 0.5;
  const arousal = arousalCount > 0 ? arousalSum / arousalCount : 0.5;

  // Calculate confidence based on coverage
  const coverage = (valenceCount + arousalCount) / (words.length * 2);

  return {
    valence,
    arousal,
    valenceWords,
    arousalWords,
    coverage: Math.min(1, coverage),
    totalWords: words.length,
    sentimentWords: valenceCount + arousalCount,
  };
}

/**
 * Map sentiment to synthesis parameters
 * @param {Object} sentiment - Sentiment analysis results
 * @returns {Object} Synthesis parameters
 */
export function mapToSynthParams(sentiment) {
  const { valence, arousal } = sentiment;

  return {
    // High valence = brighter, more motion
    brilliance: 0.3 + (valence * 0.5),
    motion: 0.2 + (valence * 0.3) + (arousal * 0.3),

    // Low valence = more space, reverb
    space: 0.2 + ((1 - valence) * 0.4) + ((1 - arousal) * 0.2),
    reverbMix: 0.2 + ((1 - valence) * 0.3),

    // High arousal = faster, sharper
    tempo: 0.5 + ((arousal - 0.5) * 0.6),
    attackSharpness: 0.3 + (arousal * 0.5),

    // Low arousal = longer release, slower
    releaseTime: 0.1 + ((1 - arousal) * 0.8),
    driftSpeed: 0.1 + ((1 - arousal) * 0.3),

    // Combined effects
    harmonicDensity: 0.3 + (valence * 0.2) + (arousal * 0.2),
    filterCutoff: 0.3 + (valence * 0.4) + (arousal * 0.2),
  };
}

/**
 * Get emotional quadrant
 * @param {number} valence - 0-1
 * @param {number} arousal - 0-1
 * @returns {string} Emotional quadrant name
 */
export function getEmotionalQuadrant(valence, arousal) {
  if (valence >= 0.5 && arousal >= 0.5) {
    return 'excited'; // High valence, high arousal
  } else if (valence >= 0.5 && arousal < 0.5) {
    return 'calm'; // High valence, low arousal
  } else if (valence < 0.5 && arousal >= 0.5) {
    return 'tense'; // Low valence, high arousal
  } else {
    return 'sad'; // Low valence, low arousal
  }
}

/**
 * Get detailed emotional state
 * @param {number} valence - 0-1
 * @param {number} arousal - 0-1
 * @returns {Object} Detailed emotional state
 */
export function getEmotionalState(valence, arousal) {
  const quadrant = getEmotionalQuadrant(valence, arousal);

  // More specific emotions based on intensity
  const intensity = Math.max(
    Math.abs(valence - 0.5),
    Math.abs(arousal - 0.5)
  ) * 2;

  const emotions = {
    excited: {
      low: 'pleased',
      medium: 'happy',
      high: 'ecstatic',
    },
    calm: {
      low: 'content',
      medium: 'peaceful',
      high: 'serene',
    },
    tense: {
      low: 'uneasy',
      medium: 'anxious',
      high: 'terrified',
    },
    sad: {
      low: 'melancholic',
      medium: 'sorrowful',
      high: 'devastated',
    },
  };

  let intensityLevel = 'medium';
  if (intensity < 0.3) intensityLevel = 'low';
  if (intensity > 0.7) intensityLevel = 'high';

  return {
    quadrant,
    emotion: emotions[quadrant][intensityLevel],
    intensity,
    valence,
    arousal,
  };
}

/**
 * Analyze a single word's sentiment
 * @param {string} word - Single word
 * @returns {Object} Word sentiment
 */
export function analyzeWord(word) {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');

  return {
    word: cleanWord,
    valence: valenceLookup.get(cleanWord) || 0.5,
    arousal: arousalLookup.get(cleanWord) || 0.5,
    hasValence: valenceLookup.has(cleanWord),
    hasArousal: arousalLookup.has(cleanWord),
  };
}

/**
 * Get sentiment trajectory over text
 * @param {string} text - Input text
 * @param {number} windowSize - Words per window
 * @returns {Array} Array of sentiment values over time
 */
export function getSentimentTrajectory(text, windowSize = 5) {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const trajectory = [];

  for (let i = 0; i < words.length; i += windowSize) {
    const window = words.slice(i, i + windowSize).join(' ');
    const sentiment = analyzeSentiment(window);
    trajectory.push({
      position: i / words.length,
      valence: sentiment.valence,
      arousal: sentiment.arousal,
      quadrant: getEmotionalQuadrant(sentiment.valence, sentiment.arousal),
    });
  }

  return trajectory;
}

/**
 * Interpolate between two sentiment states
 * @param {Object} from - Starting sentiment
 * @param {Object} to - Ending sentiment
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Object} Interpolated sentiment
 */
export function interpolateSentiment(from, to, t) {
  return {
    valence: from.valence + (to.valence - from.valence) * t,
    arousal: from.arousal + (to.arousal - from.arousal) * t,
  };
}

export default {
  analyzeSentiment,
  mapToSynthParams,
  getEmotionalQuadrant,
  getEmotionalState,
  analyzeWord,
  getSentimentTrajectory,
  interpolateSentiment,
  VALENCE_WORDS,
  AROUSAL_WORDS,
  MODIFIERS,
};
