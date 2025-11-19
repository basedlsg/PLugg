/**
 * Seven Distinct Just Intonation Pentatonic Scales
 *
 * Each scale uses authentic just intonation ratios with unique character.
 * These are not approximations of equal temperament, but mathematically
 * pure intervals that create distinct emotional qualities.
 */

// Scale type enumeration - using strings for better readability
export const ScaleType = {
  HARMONIC: 'harmonic',     // Otherworldly, transcendent (uses 11th harmonic)
  BHAIRAV: 'bhairav',       // Devotional, yearning (Indian raga)
  IN_SEN: 'in_sen',         // Mysterious, dark (Japanese wabi-sabi)
  SLENDRO: 'slendro',       // Floating, metallic (Javanese gamelan)
  MAJOR: 'major',           // Joyful, pure happiness (5-limit JI)
  MINOR: 'minor',           // Bluesy, grounded sadness (5-limit JI)
  SUSPENDED: 'suspended'    // Vast, ambiguous (drone-based)
};

// Scale names for display
export const scaleNames = {
  [ScaleType.HARMONIC]: 'Harmonic',
  [ScaleType.BHAIRAV]: 'Bhairav',
  [ScaleType.IN_SEN]: 'In Sen',
  [ScaleType.SLENDRO]: 'Slendro',
  [ScaleType.MAJOR]: 'Major',
  [ScaleType.MINOR]: 'Minor',
  [ScaleType.SUSPENDED]: 'Suspended'
};

/**
 * Scale metadata for semantic understanding
 * Use these values to inform synthesis parameters, visual feedback, etc.
 */
export const scaleMetadata = {
  [ScaleType.HARMONIC]: {
    character: 'Otherworldly, transcendent',
    energy: 0.6,
    mood: 'cosmic',
    colorHue: 280,    // purple - mystical, ethereal
    description: 'Uses the 11th harmonic (11/8) creating an alien tritone-like interval'
  },
  [ScaleType.BHAIRAV]: {
    character: 'Devotional, yearning',
    energy: 0.4,
    mood: 'sacred',
    colorHue: 30,     // orange - warm devotion
    description: 'Indian raga with chromatic 16/15 creating intense longing'
  },
  [ScaleType.IN_SEN]: {
    character: 'Mysterious, contemplative',
    energy: 0.3,
    mood: 'wabi-sabi',
    colorHue: 200,    // blue-gray - somber beauty
    description: 'Japanese scale evoking impermanence and quiet melancholy'
  },
  [ScaleType.SLENDRO]: {
    character: 'Floating, metallic',
    energy: 0.5,
    mood: 'gamelan',
    colorHue: 50,     // gold - bronze gamelan
    description: 'Javanese gamelan tuning with 7-limit intervals'
  },
  [ScaleType.MAJOR]: {
    character: 'Joyful, radiant',
    energy: 0.8,
    mood: 'happy',
    colorHue: 60,     // yellow - pure sunshine
    description: 'Pure 5-limit just intonation for maximum consonance'
  },
  [ScaleType.MINOR]: {
    character: 'Bluesy, grounded',
    energy: 0.4,
    mood: 'melancholy',
    colorHue: 240,    // blue - gentle sadness
    description: '5-limit minor with 6/5 third and 9/5 seventh'
  },
  [ScaleType.SUSPENDED]: {
    character: 'Vast, ambiguous',
    energy: 0.5,
    mood: 'open',
    colorHue: 180,    // cyan - spacious, neutral
    description: 'No third degree creates harmonic ambiguity, perfect for drones'
  }
};

/**
 * Just intonation ratios for each scale (5 notes per scale)
 * These are exact frequency ratios relative to the root note.
 *
 * Each scale is mathematically distinct - no duplicates.
 */
export const scaleRatios = {
  // HARMONIC - Otherworldly, cosmic
  // Uses partials from the harmonic series including the striking 11th harmonic
  [ScaleType.HARMONIC]: [
    1,              // Root (1/1)
    9/8,            // Major 2nd (9/8) - ~204 cents
    5/4,            // Just major 3rd (5/4) - ~386 cents
    11/8,           // Undecimal tritone (11/8) - ~551 cents - the alien interval
    3/2             // Perfect 5th (3/2) - ~702 cents
  ],

  // BHAIRAV - Devotional, yearning
  // Raga Bhairav morning raga with chromatic 2nd creating longing
  [ScaleType.BHAIRAV]: [
    1,              // Root (1/1)
    16/15,          // Just minor 2nd (16/15) - ~112 cents - intense yearning
    5/4,            // Just major 3rd (5/4) - ~386 cents
    4/3,            // Perfect 4th (4/3) - ~498 cents
    3/2             // Perfect 5th (3/2) - ~702 cents
  ],

  // IN SEN - Mysterious, wabi-sabi
  // Japanese scale for shakuhachi, evokes impermanence
  [ScaleType.IN_SEN]: [
    1,              // Root (1/1)
    16/15,          // Minor 2nd (16/15) - ~112 cents - dark opening
    4/3,            // Perfect 4th (4/3) - ~498 cents
    3/2,            // Perfect 5th (3/2) - ~702 cents
    16/9            // Pythagorean minor 7th (16/9) - ~996 cents
  ],

  // SLENDRO - Floating, gamelan
  // Javanese 5-tone scale with distinctive 7-limit intervals
  [ScaleType.SLENDRO]: [
    1,              // Root (1/1)
    8/7,            // Septimal major 2nd (8/7) - ~231 cents
    21/16,          // Narrow 4th (21/16) - ~471 cents
    3/2,            // Perfect 5th (3/2) - ~702 cents
    7/4             // Septimal minor 7th (7/4) - ~969 cents - the gamelan blue note
  ],

  // MAJOR - Joyful, pure happiness
  // Classic 5-limit just intonation for maximum brightness
  [ScaleType.MAJOR]: [
    1,              // Root (1/1)
    9/8,            // Major 2nd (9/8) - ~204 cents
    5/4,            // Just major 3rd (5/4) - ~386 cents
    3/2,            // Perfect 5th (3/2) - ~702 cents
    5/3             // Just major 6th (5/3) - ~884 cents - bright and happy
  ],

  // MINOR - Bluesy, grounded sadness
  // Natural minor pentatonic with 5-limit intervals
  [ScaleType.MINOR]: [
    1,              // Root (1/1)
    6/5,            // Just minor 3rd (6/5) - ~316 cents - the blue note
    4/3,            // Perfect 4th (4/3) - ~498 cents
    3/2,            // Perfect 5th (3/2) - ~702 cents
    9/5             // Just minor 7th (9/5) - ~1018 cents - soulful
  ],

  // SUSPENDED - Vast, ambiguous
  // No third creates open, drone-friendly harmonies
  [ScaleType.SUSPENDED]: [
    1,              // Root (1/1)
    9/8,            // Major 2nd (9/8) - ~204 cents
    4/3,            // Perfect 4th (4/3) - ~498 cents - replaces 3rd
    3/2,            // Perfect 5th (3/2) - ~702 cents
    16/9            // Pythagorean minor 7th (16/9) - ~996 cents
  ]
};

// List of all scale types for iteration
export const allScaleTypes = Object.values(ScaleType);

// Chromatic to pentatonic mapping (12 chromatic notes -> 5 pentatonic degrees)
// This maps each chromatic degree to the nearest pentatonic scale degree
export const chromaticToPentatonic = [
  0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4
];

/**
 * Convert a MIDI note to frequency using just intonation
 * @param {number} midiNote - MIDI note number (0-127)
 * @param {string} scaleType - One of ScaleType values
 * @param {number} rootFreq - Root frequency (default 440 Hz = A4)
 * @returns {number} Frequency in Hz
 */
export function midiToJustFrequency(midiNote, scaleType = ScaleType.MAJOR, rootFreq = 440) {
  // Get the octave and chromatic degree
  const octave = Math.floor(midiNote / 12) - 5; // Octave relative to A4
  const chromaticDegree = midiNote % 12;

  // Map chromatic degree to pentatonic degree
  const pentatonicDegree = chromaticToPentatonic[chromaticDegree];

  // Get the ratio for this scale and degree
  const ratios = scaleRatios[scaleType] || scaleRatios[ScaleType.MAJOR];
  const ratio = ratios[pentatonicDegree];

  // Calculate frequency with octave adjustment
  return rootFreq * ratio * Math.pow(2, octave);
}

/**
 * Get scale degree name for a given pentatonic degree
 * @param {number} degree - Pentatonic degree (0-4)
 * @param {string} scaleType - Scale type
 * @returns {string} Degree name
 */
export function getDegreeName(degree, scaleType) {
  const degreeNames = {
    [ScaleType.HARMONIC]: ['1', '2', '3', '11', '5'],      // Highlights the 11th
    [ScaleType.BHAIRAV]: ['Sa', 'Re♭', 'Ga', 'Ma', 'Pa'],  // Indian solfege
    [ScaleType.IN_SEN]: ['1', '♭2', '4', '5', '♭7'],       // Chromatic notation
    [ScaleType.SLENDRO]: ['1', '2', '3', '5', '6'],        // Javanese pelog-style
    [ScaleType.MAJOR]: ['Do', 'Re', 'Mi', 'Sol', 'La'],    // Major pentatonic
    [ScaleType.MINOR]: ['La', 'Do', 'Re', 'Mi', 'Sol'],    // Minor pentatonic
    [ScaleType.SUSPENDED]: ['1', '2', '4', '5', '7']       // Intervallic
  };

  return degreeNames[scaleType]?.[degree] || String(degree + 1);
}

/**
 * Get the frequency ratio for a specific scale degree
 * @param {string} scaleType - Scale type
 * @param {number} degree - Pentatonic degree (0-4)
 * @returns {number} Frequency ratio
 */
export function getScaleRatio(scaleType, degree) {
  const ratios = scaleRatios[scaleType] || scaleRatios[ScaleType.MAJOR];
  return ratios[degree % 5] || 1.0;
}

/**
 * Get all ratios for a scale
 * @param {string} scaleType - Scale type
 * @returns {number[]} Array of 5 frequency ratios
 */
export function getScaleRatios(scaleType) {
  return scaleRatios[scaleType] || scaleRatios[ScaleType.MAJOR];
}

/**
 * Get metadata for a scale
 * @param {string} scaleType - Scale type
 * @returns {object} Scale metadata
 */
export function getScaleMetadata(scaleType) {
  return scaleMetadata[scaleType] || scaleMetadata[ScaleType.MAJOR];
}

// Export scale aliases for pattern matching
export const scaleAliases = {
  // HARMONIC aliases
  'harmonic': ScaleType.HARMONIC,
  'cosmic': ScaleType.HARMONIC,
  'overtone': ScaleType.HARMONIC,

  // BHAIRAV aliases
  'bhairav': ScaleType.BHAIRAV,
  'devotional': ScaleType.BHAIRAV,
  'raga': ScaleType.BHAIRAV,

  // IN_SEN aliases
  'in_sen': ScaleType.IN_SEN,
  'insen': ScaleType.IN_SEN,
  'japanese': ScaleType.IN_SEN,
  'wabi': ScaleType.IN_SEN,

  // SLENDRO aliases
  'slendro': ScaleType.SLENDRO,
  'gamelan': ScaleType.SLENDRO,
  'javanese': ScaleType.SLENDRO,

  // MAJOR aliases
  'major': ScaleType.MAJOR,
  'happy': ScaleType.MAJOR,
  'bright': ScaleType.MAJOR,

  // MINOR aliases
  'minor': ScaleType.MINOR,
  'blues': ScaleType.MINOR,
  'sad': ScaleType.MINOR,

  // SUSPENDED aliases
  'suspended': ScaleType.SUSPENDED,
  'sus': ScaleType.SUSPENDED,
  'sus4': ScaleType.SUSPENDED,
  'drone': ScaleType.SUSPENDED,
  'open': ScaleType.SUSPENDED
};

/**
 * Parse scale name to scale type
 * @param {string|number} scale - Scale name or type
 * @returns {string} Scale type
 */
export function parseScale(scale) {
  if (typeof scale === 'string') {
    const lower = scale.toLowerCase();
    // Direct match
    if (scaleAliases[lower]) {
      return scaleAliases[lower];
    }
    // Check if it's already a valid scale type
    if (allScaleTypes.includes(lower)) {
      return lower;
    }
  }
  // Default to major for unknown scales
  return ScaleType.MAJOR;
}

/**
 * Get a scale type by index (for compatibility with numeric patterns)
 * @param {number} index - Scale index (0-6)
 * @returns {string} Scale type
 */
export function getScaleByIndex(index) {
  const normalizedIndex = Math.abs(Math.floor(index)) % allScaleTypes.length;
  return allScaleTypes[normalizedIndex];
}

/**
 * Calculate the cent value of a ratio
 * @param {number} ratio - Frequency ratio
 * @returns {number} Cents value
 */
export function ratioToCents(ratio) {
  return 1200 * Math.log2(ratio);
}

/**
 * Get all intervals for a scale in cents
 * @param {string} scaleType - Scale type
 * @returns {number[]} Array of cent values
 */
export function getScaleCents(scaleType) {
  const ratios = getScaleRatios(scaleType);
  return ratios.map(ratioToCents);
}
