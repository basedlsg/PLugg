/**
 * Phoneme Extraction and Parameter Mapping
 * Maps phonetic features to synthesis texture/attack parameters
 */

// IPA-based phoneme categories
const PHONEME_PATTERNS = {
  // Fricatives - breath/air sounds
  fricatives: {
    voiceless: ['f', 'th', 's', 'sh', 'h', 'x', 'ch'],
    voiced: ['v', 'dh', 'z', 'zh', 'j'],
    patterns: [
      { regex: /sh|ch/gi, type: 'sibilant' },
      { regex: /th/gi, type: 'dental' },
      { regex: /[fszhx]/gi, type: 'fricative' },
    ]
  },

  // Plosives - percussive attacks
  plosives: {
    voiceless: ['p', 't', 'k'],
    voiced: ['b', 'd', 'g'],
    patterns: [
      { regex: /[ptk]/gi, type: 'voiceless_stop' },
      { regex: /[bdg]/gi, type: 'voiced_stop' },
    ]
  },

  // Nasals - sustained resonance
  nasals: {
    patterns: [
      { regex: /[mn]/gi, type: 'nasal' },
      { regex: /ng/gi, type: 'velar_nasal' },
    ]
  },

  // Liquids - flowing sounds
  liquids: {
    patterns: [
      { regex: /[lr]/gi, type: 'liquid' },
      { regex: /w|y/gi, type: 'glide' },
    ]
  },

  // Vowels - tonal character
  vowels: {
    high: ['i', 'ee', 'y'],      // Bright
    mid: ['e', 'a', 'o'],        // Neutral
    low: ['u', 'oo', 'ah'],      // Dark
    patterns: [
      { regex: /ee|ie|ea/gi, type: 'high_front' },
      { regex: /oo|ou|ow/gi, type: 'high_back' },
      { regex: /[iey]/gi, type: 'high' },
      { regex: /[aeo]/gi, type: 'mid' },
      { regex: /[u]/gi, type: 'low' },
    ]
  }
};

// Grapheme to phoneme approximations for English
const GRAPHEME_TO_PHONEME = {
  // Consonant clusters
  'sch': 'sh', 'tch': 'ch', 'dge': 'j', 'tion': 'shun',
  'sion': 'zhun', 'ght': 't', 'kn': 'n', 'wr': 'r',
  'ph': 'f', 'gh': 'f', 'qu': 'kw', 'ng': 'ng',

  // Vowel digraphs
  'ea': 'ee', 'ai': 'ay', 'oa': 'oh', 'ou': 'ow',
  'ie': 'ee', 'ei': 'ay', 'ue': 'oo', 'ey': 'ee',
  'aw': 'ah', 'au': 'ah', 'oi': 'oy', 'oo': 'oo',
};

/**
 * Extract phonetic features from text
 * @param {string} text - Input text
 * @returns {Object} Phonetic feature analysis
 */
export function extractPhonemes(text) {
  const normalizedText = normalizeText(text);

  return {
    fricatives: countFricatives(normalizedText),
    plosives: countPlosives(normalizedText),
    nasals: countNasals(normalizedText),
    liquids: countLiquids(normalizedText),
    vowelProfile: analyzeVowels(normalizedText),
    consonantDensity: getConsonantDensity(normalizedText),
    syllableCount: estimateSyllables(normalizedText),
  };
}

/**
 * Normalize text for phonetic analysis
 */
function normalizeText(text) {
  let normalized = text.toLowerCase();

  // Apply grapheme-to-phoneme mappings
  for (const [grapheme, phoneme] of Object.entries(GRAPHEME_TO_PHONEME)) {
    normalized = normalized.replace(new RegExp(grapheme, 'g'), phoneme);
  }

  return normalized;
}

/**
 * Count fricative sounds
 */
function countFricatives(text) {
  let count = 0;
  let sibilantCount = 0;

  for (const pattern of PHONEME_PATTERNS.fricatives.patterns) {
    const matches = text.match(pattern.regex) || [];
    count += matches.length;
    if (pattern.type === 'sibilant') {
      sibilantCount += matches.length;
    }
  }

  return { count, sibilantCount, ratio: count / (text.length || 1) };
}

/**
 * Count plosive sounds
 */
function countPlosives(text) {
  let voiceless = 0;
  let voiced = 0;

  for (const pattern of PHONEME_PATTERNS.plosives.patterns) {
    const matches = text.match(pattern.regex) || [];
    if (pattern.type === 'voiceless_stop') {
      voiceless += matches.length;
    } else {
      voiced += matches.length;
    }
  }

  return {
    count: voiceless + voiced,
    voiceless,
    voiced,
    ratio: (voiceless + voiced) / (text.length || 1)
  };
}

/**
 * Count nasal sounds
 */
function countNasals(text) {
  let count = 0;

  for (const pattern of PHONEME_PATTERNS.nasals.patterns) {
    const matches = text.match(pattern.regex) || [];
    count += matches.length;
  }

  return { count, ratio: count / (text.length || 1) };
}

/**
 * Count liquid sounds
 */
function countLiquids(text) {
  let count = 0;

  for (const pattern of PHONEME_PATTERNS.liquids.patterns) {
    const matches = text.match(pattern.regex) || [];
    count += matches.length;
  }

  return { count, ratio: count / (text.length || 1) };
}

/**
 * Analyze vowel characteristics
 */
function analyzeVowels(text) {
  let high = 0, mid = 0, low = 0;
  const vowelMatches = text.match(/[aeiou]/gi) || [];
  const total = vowelMatches.length || 1;

  // Count by height
  high = (text.match(/[iey]/gi) || []).length;
  mid = (text.match(/[aeo]/gi) || []).length;
  low = (text.match(/[u]/gi) || []).length;

  // Calculate brightness (high vowels = bright)
  const brightness = (high * 1.0 + mid * 0.5 + low * 0.0) / total;

  // Calculate openness (affects resonance)
  const openness = (text.match(/[aeo]/gi) || []).length / total;

  return {
    high, mid, low,
    total,
    brightness: Math.min(1, brightness),
    openness: Math.min(1, openness),
  };
}

/**
 * Calculate consonant density
 */
function getConsonantDensity(text) {
  const consonants = text.match(/[bcdfghjklmnpqrstvwxz]/gi) || [];
  const vowels = text.match(/[aeiou]/gi) || [];
  const total = consonants.length + vowels.length || 1;

  return consonants.length / total;
}

/**
 * Estimate syllable count
 */
function estimateSyllables(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  let total = 0;

  for (const word of words) {
    // Basic syllable estimation
    const vowelGroups = word.match(/[aeiou]+/gi) || [];
    let syllables = vowelGroups.length;

    // Adjust for silent e
    if (word.endsWith('e') && syllables > 1) {
      syllables--;
    }

    total += Math.max(1, syllables);
  }

  return total;
}

/**
 * Map phonetic features to synthesis parameters
 * @param {Object} phonemes - Extracted phoneme data
 * @returns {Object} Synthesis parameters
 */
export function mapToSynthParams(phonemes) {
  const params = {
    // Air/breath layer (0-1)
    airGain: 0.3,

    // Attack characteristics
    attackSharpness: 0.5,  // 0=soft, 1=percussive
    attackTime: 0.1,       // seconds

    // Tonal characteristics
    brilliance: 0.5,       // 0=dark, 1=bright
    filterResonance: 0.3,  // 0=smooth, 1=resonant

    // Sustain characteristics
    bodyLayerSustain: 0.5, // 0=short, 1=long
    releaseTime: 0.3,      // seconds

    // Additional texture
    graininess: 0.2,       // 0=smooth, 1=grainy
    harmonicContent: 0.5,  // 0=pure, 1=rich harmonics
  };

  // Fricatives increase air/breath layer
  if (phonemes.fricatives.ratio > 0.1) {
    params.airGain = Math.min(1, 0.3 + phonemes.fricatives.ratio * 3);
    params.graininess = Math.min(1, 0.2 + phonemes.fricatives.sibilantCount * 0.1);
  }

  // Plosives increase attack sharpness
  if (phonemes.plosives.ratio > 0.05) {
    params.attackSharpness = Math.min(1, 0.5 + phonemes.plosives.ratio * 4);
    params.attackTime = Math.max(0.001, 0.1 - phonemes.plosives.voiceless * 0.02);
  }

  // Vowel height affects brilliance
  params.brilliance = phonemes.vowelProfile.brightness;

  // Vowel openness affects resonance
  params.filterResonance = Math.min(1, 0.3 + phonemes.vowelProfile.openness * 0.5);

  // Nasals increase sustain
  if (phonemes.nasals.ratio > 0.05) {
    params.bodyLayerSustain = Math.min(1, 0.5 + phonemes.nasals.ratio * 4);
    params.releaseTime = Math.min(2, 0.3 + phonemes.nasals.count * 0.1);
    params.harmonicContent = Math.min(1, 0.5 + phonemes.nasals.ratio * 3);
  }

  // Liquids add smoothness
  if (phonemes.liquids.ratio > 0.05) {
    params.graininess = Math.max(0, params.graininess - phonemes.liquids.ratio * 2);
  }

  // Consonant density affects overall texture
  if (phonemes.consonantDensity > 0.6) {
    params.graininess = Math.min(1, params.graininess + 0.2);
  }

  return params;
}

/**
 * Get phonetic profile description
 * @param {Object} phonemes - Extracted phoneme data
 * @returns {string} Human-readable description
 */
export function describePhoneticProfile(phonemes) {
  const traits = [];

  if (phonemes.fricatives.ratio > 0.15) {
    traits.push('breathy');
  }
  if (phonemes.plosives.ratio > 0.1) {
    traits.push('percussive');
  }
  if (phonemes.nasals.ratio > 0.1) {
    traits.push('resonant');
  }
  if (phonemes.vowelProfile.brightness > 0.7) {
    traits.push('bright');
  } else if (phonemes.vowelProfile.brightness < 0.3) {
    traits.push('dark');
  }
  if (phonemes.liquids.ratio > 0.1) {
    traits.push('flowing');
  }

  return traits.length > 0 ? traits.join(', ') : 'neutral';
}

/**
 * Analyze a single word's phonetic character
 * @param {string} word - Single word
 * @returns {Object} Complete phonetic analysis and synth params
 */
export function analyzeWord(word) {
  const phonemes = extractPhonemes(word);
  const synthParams = mapToSynthParams(phonemes);
  const profile = describePhoneticProfile(phonemes);

  return {
    word,
    phonemes,
    synthParams,
    profile,
  };
}

export default {
  extractPhonemes,
  mapToSynthParams,
  describePhoneticProfile,
  analyzeWord,
  PHONEME_PATTERNS,
};
