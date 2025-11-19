/**
 * World Pentatonic Scales with Just Intonation
 *
 * Nine pentatonic scales from different world music traditions,
 * each using authentic just intonation ratios rather than equal temperament.
 */

// Scale type enumeration
export const ScaleType = {
  JAPANESE_YO: 0,      // Major pentatonic with Pythagorean 6th
  CHINESE_GONG: 1,     // Pure Pythagorean major pentatonic
  CELTIC: 2,           // Sus4 pentatonic
  INDONESIAN_SLENDRO: 3, // Approximated slendro
  SCOTTISH_HIGHLAND: 4,  // Sus4 pentatonic
  MONGOLIAN_THROAT: 5,   // Minor pentatonic
  EGYPTIAN_SACRED: 6,    // 5-limit just intonation major
  NATIVE_AMERICAN: 7,    // Minor pentatonic
  NORDIC_AURORA: 8       // Sus4 pentatonic
};

// Scale names for display
export const scaleNames = [
  'Japanese Yo',
  'Chinese Gong',
  'Celtic',
  'Indonesian Slendro',
  'Scottish Highland',
  'Mongolian Throat',
  'Egyptian Sacred',
  'Native American',
  'Nordic Aurora'
];

// Just intonation ratios for each scale (5 notes per scale)
// These are the exact frequency ratios relative to the root
export const scaleRatios = {
  // Japanese Yo - Major pentatonic with Pythagorean 6th
  [ScaleType.JAPANESE_YO]: [
    1.0,        // Root (1/1)
    9/8,        // Major 2nd (9/8)
    81/64,      // Pythagorean major 3rd (81/64)
    3/2,        // Perfect 5th (3/2)
    27/16       // Pythagorean major 6th (27/16)
  ],

  // Chinese Gong - Pure Pythagorean major pentatonic
  [ScaleType.CHINESE_GONG]: [
    1.0,        // Root (1/1)
    9/8,        // Major 2nd (9/8)
    81/64,      // Major 3rd (81/64)
    3/2,        // Perfect 5th (3/2)
    27/16       // Major 6th (27/16)
  ],

  // Celtic - Sus4 pentatonic
  [ScaleType.CELTIC]: [
    1.0,        // Root (1/1)
    9/8,        // Major 2nd (9/8)
    4/3,        // Perfect 4th (4/3)
    3/2,        // Perfect 5th (3/2)
    16/9        // Minor 7th (16/9)
  ],

  // Indonesian Slendro - Approximated slendro tuning
  [ScaleType.INDONESIAN_SLENDRO]: [
    1.0,        // Root
    8/7,        // ~231 cents
    21/16,      // ~471 cents
    3/2,        // ~702 cents
    7/4         // ~969 cents
  ],

  // Scottish Highland - Sus4 pentatonic (bagpipe-like)
  [ScaleType.SCOTTISH_HIGHLAND]: [
    1.0,        // Root (1/1)
    9/8,        // Major 2nd (9/8)
    4/3,        // Perfect 4th (4/3)
    3/2,        // Perfect 5th (3/2)
    16/9        // Minor 7th (16/9)
  ],

  // Mongolian Throat - Minor pentatonic
  [ScaleType.MONGOLIAN_THROAT]: [
    1.0,        // Root (1/1)
    32/27,      // Pythagorean minor 3rd (32/27)
    4/3,        // Perfect 4th (4/3)
    3/2,        // Perfect 5th (3/2)
    16/9        // Pythagorean minor 7th (16/9)
  ],

  // Egyptian Sacred - 5-limit just intonation major
  [ScaleType.EGYPTIAN_SACRED]: [
    1.0,        // Root (1/1)
    9/8,        // Major 2nd (9/8)
    5/4,        // Just major 3rd (5/4)
    3/2,        // Perfect 5th (3/2)
    5/3         // Just major 6th (5/3)
  ],

  // Native American - Minor pentatonic
  [ScaleType.NATIVE_AMERICAN]: [
    1.0,        // Root (1/1)
    32/27,      // Minor 3rd (32/27)
    4/3,        // Perfect 4th (4/3)
    3/2,        // Perfect 5th (3/2)
    16/9        // Minor 7th (16/9)
  ],

  // Nordic Aurora - Sus4 pentatonic
  [ScaleType.NORDIC_AURORA]: [
    1.0,        // Root (1/1)
    9/8,        // Major 2nd (9/8)
    4/3,        // Perfect 4th (4/3)
    3/2,        // Perfect 5th (3/2)
    16/9        // Minor 7th (16/9)
  ]
};

// Chromatic to pentatonic mapping (12 chromatic notes -> 5 pentatonic degrees)
// This maps each chromatic degree to the nearest pentatonic scale degree
export const chromaticToPentatonic = [
  0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4
];

/**
 * Convert a MIDI note to frequency using just intonation
 * @param {number} midiNote - MIDI note number (0-127)
 * @param {number} scaleType - One of ScaleType values
 * @param {number} rootFreq - Root frequency (default 440 Hz = A4)
 * @returns {number} Frequency in Hz
 */
export function midiToJustFrequency(midiNote, scaleType = ScaleType.JAPANESE_YO, rootFreq = 440) {
  // Get the octave and chromatic degree
  const octave = Math.floor(midiNote / 12) - 5; // Octave relative to A4
  const chromaticDegree = midiNote % 12;

  // Map chromatic degree to pentatonic degree
  const pentatonicDegree = chromaticToPentatonic[chromaticDegree];

  // Get the ratio for this scale and degree
  const ratio = scaleRatios[scaleType][pentatonicDegree];

  // Calculate frequency with octave adjustment
  return rootFreq * ratio * Math.pow(2, octave);
}

/**
 * Get scale degree name for a given pentatonic degree
 * @param {number} degree - Pentatonic degree (0-4)
 * @param {number} scaleType - Scale type
 * @returns {string} Degree name
 */
export function getDegreeName(degree, scaleType) {
  const degreeNames = [
    ['Do', 'Re', 'Mi', 'Sol', 'La'],           // Major pentatonic names
    ['Do', 'Re', 'Mi', 'Sol', 'La'],           // Chinese
    ['1', '2', '4', '5', '7'],                 // Sus4
    ['1', '2', '3', '5', '6'],                 // Slendro
    ['1', '2', '4', '5', '7'],                 // Highland
    ['La', 'Do', 'Re', 'Mi', 'Sol'],           // Minor pentatonic
    ['1', '2', '3', '5', '6'],                 // Egyptian
    ['La', 'Do', 'Re', 'Mi', 'Sol'],           // Native American
    ['1', '2', '4', '5', '7']                  // Nordic
  ];

  return degreeNames[scaleType]?.[degree] || String(degree + 1);
}

/**
 * Get the frequency ratio for a specific scale degree
 * @param {number} scaleType - Scale type
 * @param {number} degree - Pentatonic degree (0-4)
 * @returns {number} Frequency ratio
 */
export function getScaleRatio(scaleType, degree) {
  return scaleRatios[scaleType]?.[degree % 5] || 1.0;
}

/**
 * Get all ratios for a scale
 * @param {number} scaleType - Scale type
 * @returns {number[]} Array of 5 frequency ratios
 */
export function getScaleRatios(scaleType) {
  return scaleRatios[scaleType] || scaleRatios[ScaleType.JAPANESE_YO];
}

// Export scale aliases for pattern matching
export const scaleAliases = {
  'yo': ScaleType.JAPANESE_YO,
  'japanese': ScaleType.JAPANESE_YO,
  'gong': ScaleType.CHINESE_GONG,
  'chinese': ScaleType.CHINESE_GONG,
  'celtic': ScaleType.CELTIC,
  'slendro': ScaleType.INDONESIAN_SLENDRO,
  'indonesian': ScaleType.INDONESIAN_SLENDRO,
  'highland': ScaleType.SCOTTISH_HIGHLAND,
  'scottish': ScaleType.SCOTTISH_HIGHLAND,
  'throat': ScaleType.MONGOLIAN_THROAT,
  'mongolian': ScaleType.MONGOLIAN_THROAT,
  'sacred': ScaleType.EGYPTIAN_SACRED,
  'egyptian': ScaleType.EGYPTIAN_SACRED,
  'native': ScaleType.NATIVE_AMERICAN,
  'american': ScaleType.NATIVE_AMERICAN,
  'aurora': ScaleType.NORDIC_AURORA,
  'nordic': ScaleType.NORDIC_AURORA
};

/**
 * Parse scale name to scale type
 * @param {string|number} scale - Scale name or type number
 * @returns {number} Scale type
 */
export function parseScale(scale) {
  if (typeof scale === 'number') {
    return Math.max(0, Math.min(8, Math.floor(scale)));
  }
  const lower = String(scale).toLowerCase();
  return scaleAliases[lower] ?? ScaleType.JAPANESE_YO;
}
