/**
 * Magic Words - 30 Hand-Crafted Special Word Mappings
 * These words trigger unique, carefully designed sonic experiences
 * Each word has been tuned to feel inevitable - the sound IS the word
 */

// Scale constants
const SCALES = {
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

/**
 * Magic Word Dictionary
 * Each word has carefully tuned parameters for a unique sonic signature
 */
export const MAGIC_WORDS = {
  // ===== CELESTIAL (3) =====

  cosmos: {
    description: 'Vast, slowly evolving space with shimmering harmonics',
    category: 'celestial',
    scales: [SCALES.WHOLE_TONE, SCALES.LYDIAN],
    parameters: {
      // Core synthesis
      brilliance: 0.6,
      motion: 0.2,
      space: 0.95,
      warmth: 0.4,
      drift: 0.8,

      // Attack/texture
      attackSharpness: 0.08,
      attackTime: 0.6,
      airGain: 0.55,
      bodyLayerSustain: 0.92,
      releaseTime: 3.5,

      // Harmonic character
      filterResonance: 0.35,
      harmonicDensity: 0.75,
      complexity: 0.6,
      graininess: 0.08,

      // Temporal
      tempo: 0.15,
      driftSpeed: 0.08,

      // Reverb/space
      reverbMix: 0.85,
    },
    // Visual hints
    colorHue: 280,
    particleDensity: 0.25,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  aurora: {
    description: 'Dancing colors, shifting brightness, ethereal curtains of light',
    category: 'celestial',
    scales: [SCALES.MAJOR, SCALES.LYDIAN, SCALES.WHOLE_TONE],
    parameters: {
      // Core synthesis
      brilliance: 0.88,
      motion: 0.75,
      space: 0.78,
      warmth: 0.58,
      drift: 0.65,

      // Attack/texture
      attackSharpness: 0.18,
      attackTime: 0.25,
      airGain: 0.48,
      bodyLayerSustain: 0.78,
      releaseTime: 1.8,

      // Harmonic character
      filterResonance: 0.58,
      harmonicDensity: 0.62,
      complexity: 0.55,
      graininess: 0.04,

      // Temporal
      tempo: 0.42,
      driftSpeed: 0.35,

      // Reverb/space
      reverbMix: 0.62,
    },
    // Visual hints
    colorHue: 160,
    particleDensity: 0.7,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  nebula: {
    description: 'Deep, mysterious, slowly swirling clouds of cosmic dust',
    category: 'celestial',
    scales: [SCALES.DORIAN, SCALES.MIXOLYDIAN],
    parameters: {
      // Core synthesis
      brilliance: 0.52,
      motion: 0.38,
      space: 0.92,
      warmth: 0.48,
      drift: 0.72,

      // Attack/texture
      attackSharpness: 0.12,
      attackTime: 0.45,
      airGain: 0.68,
      bodyLayerSustain: 0.88,
      releaseTime: 2.8,

      // Harmonic character
      filterResonance: 0.48,
      harmonicDensity: 0.82,
      complexity: 0.72,
      graininess: 0.22,

      // Temporal
      tempo: 0.18,
      driftSpeed: 0.15,

      // Reverb/space
      reverbMix: 0.78,
    },
    // Visual hints
    colorHue: 320,
    particleDensity: 0.45,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  // ===== ELEMENTAL (4) =====

  thunder: {
    description: 'Powerful low end, sharp attack, rumbling decay',
    category: 'elemental',
    scales: [SCALES.PHRYGIAN, SCALES.CHROMATIC],
    parameters: {
      // Core synthesis
      brilliance: 0.35,
      motion: 0.85,
      space: 0.72,
      warmth: 0.28,
      drift: 0.55,

      // Attack/texture
      attackSharpness: 0.98,
      attackTime: 0.001,
      airGain: 0.25,
      bodyLayerSustain: 0.72,
      releaseTime: 1.8,

      // Harmonic character
      filterResonance: 0.75,
      harmonicDensity: 0.95,
      complexity: 0.85,
      graininess: 0.65,

      // Temporal
      tempo: 0.75,
      driftSpeed: 0.45,

      // Reverb/space
      reverbMix: 0.65,
    },
    // Visual hints
    colorHue: 45,
    particleDensity: 0.9,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: true,
  },

  whisper: {
    description: 'Extreme air layer, minimal body, intimate space',
    category: 'elemental',
    scales: [SCALES.PENTATONIC, SCALES.SUSPENDED],
    parameters: {
      // Core synthesis
      brilliance: 0.28,
      motion: 0.15,
      space: 0.55,
      warmth: 0.62,
      drift: 0.25,

      // Attack/texture
      attackSharpness: 0.04,
      attackTime: 0.35,
      airGain: 0.92,
      bodyLayerSustain: 0.25,
      releaseTime: 0.9,

      // Harmonic character
      filterResonance: 0.18,
      harmonicDensity: 0.15,
      complexity: 0.18,
      graininess: 0.35,

      // Temporal
      tempo: 0.25,
      driftSpeed: 0.08,

      // Reverb/space
      reverbMix: 0.38,
    },
    // Visual hints
    colorHue: 200,
    particleDensity: 0.1,
    // Special behaviors
    triggerAiImage: false,
    isApexWord: false,
  },

  crystallize: {
    description: 'Sharp attacks, high brilliance, sparse, precise geometric patterns',
    category: 'elemental',
    scales: [SCALES.LYDIAN, SCALES.WHOLE_TONE],
    parameters: {
      // Core synthesis
      brilliance: 0.98,
      motion: 0.55,
      space: 0.48,
      warmth: 0.15,
      drift: 0.28,

      // Attack/texture
      attackSharpness: 0.88,
      attackTime: 0.015,
      airGain: 0.18,
      bodyLayerSustain: 0.58,
      releaseTime: 0.65,

      // Harmonic character
      filterResonance: 0.82,
      harmonicDensity: 0.38,
      complexity: 0.48,
      graininess: 0.02,

      // Temporal
      tempo: 0.52,
      driftSpeed: 0.18,

      // Reverb/space
      reverbMix: 0.52,
    },
    // Visual hints
    colorHue: 185,
    particleDensity: 0.35,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  volcano: {
    description: 'Building intensity, explosive release, flowing heat',
    category: 'elemental',
    scales: [SCALES.HARMONIC, SCALES.PHRYGIAN],
    parameters: {
      // Core synthesis
      brilliance: 0.48,
      motion: 0.92,
      space: 0.38,
      warmth: 0.92,
      drift: 0.68,

      // Attack/texture
      attackSharpness: 0.95,
      attackTime: 0.008,
      airGain: 0.38,
      bodyLayerSustain: 0.82,
      releaseTime: 2.2,

      // Harmonic character
      filterResonance: 0.85,
      harmonicDensity: 0.98,
      complexity: 0.92,
      graininess: 0.45,

      // Temporal
      tempo: 0.82,
      driftSpeed: 0.55,

      // Reverb/space
      reverbMix: 0.48,
    },
    // Visual hints
    colorHue: 15,
    particleDensity: 0.95,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: true,
  },

  // ===== EMOTIONAL (5) =====

  melancholy: {
    description: 'Rich warmth, slow drift, deep space, minor tonality',
    category: 'emotional',
    scales: [SCALES.MINOR, SCALES.DORIAN],
    parameters: {
      // Core synthesis
      brilliance: 0.32,
      motion: 0.25,
      space: 0.82,
      warmth: 0.78,
      drift: 0.58,

      // Attack/texture
      attackSharpness: 0.15,
      attackTime: 0.28,
      airGain: 0.42,
      bodyLayerSustain: 0.75,
      releaseTime: 1.8,

      // Harmonic character
      filterResonance: 0.38,
      harmonicDensity: 0.52,
      complexity: 0.42,
      graininess: 0.12,

      // Temporal
      tempo: 0.28,
      driftSpeed: 0.12,

      // Reverb/space
      reverbMix: 0.68,
    },
    // Visual hints
    colorHue: 220,
    particleDensity: 0.3,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  euphoria: {
    description: 'High brilliance, fast motion, major tonality, bright ascending waves',
    category: 'emotional',
    scales: [SCALES.MAJOR, SCALES.LYDIAN],
    parameters: {
      // Core synthesis
      brilliance: 0.95,
      motion: 0.88,
      space: 0.62,
      warmth: 0.82,
      drift: 0.45,

      // Attack/texture
      attackSharpness: 0.42,
      attackTime: 0.04,
      airGain: 0.28,
      bodyLayerSustain: 0.72,
      releaseTime: 1.0,

      // Harmonic character
      filterResonance: 0.52,
      harmonicDensity: 0.75,
      complexity: 0.65,
      graininess: 0.03,

      // Temporal
      tempo: 0.75,
      driftSpeed: 0.35,

      // Reverb/space
      reverbMix: 0.55,
    },
    // Visual hints
    colorHue: 50,
    particleDensity: 0.85,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: true,
  },

  nostalgia: {
    description: 'Warm, slightly detuned, medium space, distant echoes',
    category: 'emotional',
    scales: [SCALES.MIXOLYDIAN, SCALES.DORIAN],
    parameters: {
      // Core synthesis
      brilliance: 0.42,
      motion: 0.32,
      space: 0.72,
      warmth: 0.75,
      drift: 0.48,

      // Attack/texture
      attackSharpness: 0.22,
      attackTime: 0.18,
      airGain: 0.38,
      bodyLayerSustain: 0.78,
      releaseTime: 1.6,

      // Harmonic character
      filterResonance: 0.32,
      harmonicDensity: 0.48,
      complexity: 0.42,
      graininess: 0.18,

      // Temporal
      tempo: 0.32,
      driftSpeed: 0.12,

      // Reverb/space
      reverbMix: 0.68,
    },
    // Visual hints
    colorHue: 35,
    particleDensity: 0.35,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  serenity: {
    description: 'Pure, minimal motion, wide space, suspended tranquility',
    category: 'emotional',
    scales: [SCALES.SUSPENDED, SCALES.PENTATONIC],
    parameters: {
      // Core synthesis
      brilliance: 0.48,
      motion: 0.08,
      space: 0.88,
      warmth: 0.62,
      drift: 0.35,

      // Attack/texture
      attackSharpness: 0.08,
      attackTime: 0.45,
      airGain: 0.52,
      bodyLayerSustain: 0.85,
      releaseTime: 2.5,

      // Harmonic character
      filterResonance: 0.18,
      harmonicDensity: 0.28,
      complexity: 0.18,
      graininess: 0.02,

      // Temporal
      tempo: 0.15,
      driftSpeed: 0.04,

      // Reverb/space
      reverbMix: 0.75,
    },
    // Visual hints
    colorHue: 180,
    particleDensity: 0.2,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  anxiety: {
    description: 'High motion, dissonant tendencies, tight claustrophobic space',
    category: 'emotional',
    scales: [SCALES.CHROMATIC, SCALES.PHRYGIAN],
    parameters: {
      // Core synthesis
      brilliance: 0.58,
      motion: 0.95,
      space: 0.25,
      warmth: 0.25,
      drift: 0.72,

      // Attack/texture
      attackSharpness: 0.75,
      attackTime: 0.025,
      airGain: 0.52,
      bodyLayerSustain: 0.38,
      releaseTime: 0.25,

      // Harmonic character
      filterResonance: 0.75,
      harmonicDensity: 0.65,
      complexity: 0.85,
      graininess: 0.45,

      // Temporal
      tempo: 0.85,
      driftSpeed: 0.65,

      // Reverb/space
      reverbMix: 0.28,
    },
    // Visual hints
    colorHue: 0,
    particleDensity: 0.8,
    // Special behaviors
    triggerAiImage: false,
    isApexWord: false,
  },

  // ===== TEMPORAL (3) =====

  eternal: {
    description: 'Extremely slow drift, infinite sustain feel, time suspended',
    category: 'temporal',
    scales: [SCALES.SUSPENDED, SCALES.WHOLE_TONE],
    parameters: {
      // Core synthesis
      brilliance: 0.48,
      motion: 0.05,
      space: 0.98,
      warmth: 0.52,
      drift: 0.15,

      // Attack/texture
      attackSharpness: 0.05,
      attackTime: 0.8,
      airGain: 0.42,
      bodyLayerSustain: 1.0,
      releaseTime: 5.0,

      // Harmonic character
      filterResonance: 0.28,
      harmonicDensity: 0.42,
      complexity: 0.28,
      graininess: 0.03,

      // Temporal
      tempo: 0.05,
      driftSpeed: 0.02,

      // Reverb/space
      reverbMix: 0.92,
    },
    // Visual hints
    colorHue: 260,
    particleDensity: 0.15,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  fleeting: {
    description: 'Fast attacks, quick decay, sparse and ephemeral',
    category: 'temporal',
    scales: [SCALES.PENTATONIC, SCALES.MAJOR],
    parameters: {
      // Core synthesis
      brilliance: 0.72,
      motion: 0.75,
      space: 0.38,
      warmth: 0.48,
      drift: 0.58,

      // Attack/texture
      attackSharpness: 0.68,
      attackTime: 0.008,
      airGain: 0.28,
      bodyLayerSustain: 0.18,
      releaseTime: 0.08,

      // Harmonic character
      filterResonance: 0.42,
      harmonicDensity: 0.28,
      complexity: 0.28,
      graininess: 0.08,

      // Temporal
      tempo: 0.85,
      driftSpeed: 0.55,

      // Reverb/space
      reverbMix: 0.28,
    },
    // Visual hints
    colorHue: 60,
    particleDensity: 0.6,
    // Special behaviors
    triggerAiImage: false,
    isApexWord: false,
  },

  ancient: {
    description: 'Deep, rich harmonics, slow ceremonial weight',
    category: 'temporal',
    scales: [SCALES.BHAIRAV, SCALES.IN_SEN],
    parameters: {
      // Core synthesis
      brilliance: 0.28,
      motion: 0.18,
      space: 0.82,
      warmth: 0.42,
      drift: 0.42,

      // Attack/texture
      attackSharpness: 0.18,
      attackTime: 0.35,
      airGain: 0.28,
      bodyLayerSustain: 0.85,
      releaseTime: 2.5,

      // Harmonic character
      filterResonance: 0.52,
      harmonicDensity: 0.68,
      complexity: 0.55,
      graininess: 0.28,

      // Temporal
      tempo: 0.18,
      driftSpeed: 0.08,

      // Reverb/space
      reverbMix: 0.75,
    },
    // Visual hints
    colorHue: 30,
    particleDensity: 0.25,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  // ===== NATURAL (3) =====

  bloom: {
    description: 'Growing brightness, expanding space, organic unfolding',
    category: 'natural',
    scales: [SCALES.MAJOR, SCALES.LYDIAN],
    parameters: {
      // Core synthesis
      brilliance: 0.75,
      motion: 0.52,
      space: 0.68,
      warmth: 0.72,
      drift: 0.45,

      // Attack/texture
      attackSharpness: 0.12,
      attackTime: 0.5,
      airGain: 0.42,
      bodyLayerSustain: 0.72,
      releaseTime: 1.4,

      // Harmonic character
      filterResonance: 0.42,
      harmonicDensity: 0.62,
      complexity: 0.45,
      graininess: 0.08,

      // Temporal
      tempo: 0.42,
      driftSpeed: 0.22,

      // Reverb/space
      reverbMix: 0.55,
    },
    // Visual hints
    colorHue: 330,
    particleDensity: 0.55,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  decay: {
    description: 'Falling energy, increasing warmth, graceful fading',
    category: 'natural',
    scales: [SCALES.MINOR, SCALES.PHRYGIAN],
    parameters: {
      // Core synthesis
      brilliance: 0.25,
      motion: 0.28,
      space: 0.78,
      warmth: 0.68,
      drift: 0.52,

      // Attack/texture
      attackSharpness: 0.18,
      attackTime: 0.22,
      airGain: 0.55,
      bodyLayerSustain: 0.48,
      releaseTime: 2.8,

      // Harmonic character
      filterResonance: 0.38,
      harmonicDensity: 0.42,
      complexity: 0.42,
      graininess: 0.35,

      // Temporal
      tempo: 0.22,
      driftSpeed: 0.08,

      // Reverb/space
      reverbMix: 0.72,
    },
    // Visual hints
    colorHue: 25,
    particleDensity: 0.3,
    // Special behaviors
    triggerAiImage: false,
    isApexWord: false,
  },

  forest: {
    description: 'Layered complexity, organic motion, living ecosystem',
    category: 'natural',
    scales: [SCALES.DORIAN, SCALES.PENTATONIC],
    parameters: {
      // Core synthesis
      brilliance: 0.48,
      motion: 0.52,
      space: 0.72,
      warmth: 0.58,
      drift: 0.55,

      // Attack/texture
      attackSharpness: 0.28,
      attackTime: 0.12,
      airGain: 0.52,
      bodyLayerSustain: 0.62,
      releaseTime: 1.0,

      // Harmonic character
      filterResonance: 0.42,
      harmonicDensity: 0.75,
      complexity: 0.68,
      graininess: 0.22,

      // Temporal
      tempo: 0.42,
      driftSpeed: 0.28,

      // Reverb/space
      reverbMix: 0.62,
    },
    // Visual hints
    colorHue: 120,
    particleDensity: 0.65,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  // ===== MYSTICAL (3) =====

  ritual: {
    description: 'Ceremonial, harmonic series, slow building sacred patterns',
    category: 'mystical',
    scales: [SCALES.BHAIRAV, SCALES.HARMONIC],
    parameters: {
      // Core synthesis
      brilliance: 0.38,
      motion: 0.38,
      space: 0.75,
      warmth: 0.48,
      drift: 0.42,

      // Attack/texture
      attackSharpness: 0.38,
      attackTime: 0.12,
      airGain: 0.28,
      bodyLayerSustain: 0.82,
      releaseTime: 1.8,

      // Harmonic character
      filterResonance: 0.62,
      harmonicDensity: 0.75,
      complexity: 0.62,
      graininess: 0.18,

      // Temporal
      tempo: 0.32,
      driftSpeed: 0.12,

      // Reverb/space
      reverbMix: 0.68,
    },
    // Visual hints
    colorHue: 300,
    particleDensity: 0.4,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  oracle: {
    description: 'Mysterious, bhairav scale, questioning pronouncements',
    category: 'mystical',
    scales: [SCALES.BHAIRAV, SCALES.IN_SEN],
    parameters: {
      // Core synthesis
      brilliance: 0.52,
      motion: 0.32,
      space: 0.82,
      warmth: 0.38,
      drift: 0.48,

      // Attack/texture
      attackSharpness: 0.22,
      attackTime: 0.28,
      airGain: 0.48,
      bodyLayerSustain: 0.78,
      releaseTime: 1.6,

      // Harmonic character
      filterResonance: 0.58,
      harmonicDensity: 0.58,
      complexity: 0.58,
      graininess: 0.22,

      // Temporal
      tempo: 0.28,
      driftSpeed: 0.12,

      // Reverb/space
      reverbMix: 0.72,
    },
    // Visual hints
    colorHue: 275,
    particleDensity: 0.35,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  phantom: {
    description: 'Ethereal, lots of air, ghostly barely-there presence',
    category: 'mystical',
    scales: [SCALES.PHRYGIAN, SCALES.IN_SEN],
    parameters: {
      // Core synthesis
      brilliance: 0.32,
      motion: 0.22,
      space: 0.92,
      warmth: 0.28,
      drift: 0.42,

      // Attack/texture
      attackSharpness: 0.08,
      attackTime: 0.4,
      airGain: 0.78,
      bodyLayerSustain: 0.45,
      releaseTime: 2.2,

      // Harmonic character
      filterResonance: 0.28,
      harmonicDensity: 0.28,
      complexity: 0.38,
      graininess: 0.28,

      // Temporal
      tempo: 0.18,
      driftSpeed: 0.08,

      // Reverb/space
      reverbMix: 0.85,
    },
    // Visual hints
    colorHue: 240,
    particleDensity: 0.15,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  // ===== KINETIC (3) =====

  pulse: {
    description: 'Strong rhythmic motion, clear attacks, steady heartbeat',
    category: 'kinetic',
    scales: [SCALES.MINOR, SCALES.DORIAN],
    parameters: {
      // Core synthesis
      brilliance: 0.48,
      motion: 0.75,
      space: 0.38,
      warmth: 0.52,
      drift: 0.35,

      // Attack/texture
      attackSharpness: 0.75,
      attackTime: 0.015,
      airGain: 0.18,
      bodyLayerSustain: 0.52,
      releaseTime: 0.35,

      // Harmonic character
      filterResonance: 0.52,
      harmonicDensity: 0.52,
      complexity: 0.42,
      graininess: 0.12,

      // Temporal
      tempo: 0.68,
      driftSpeed: 0.28,

      // Reverb/space
      reverbMix: 0.32,
    },
    // Visual hints
    colorHue: 350,
    particleDensity: 0.7,
    // Special behaviors
    triggerAiImage: false,
    isApexWord: false,
  },

  cascade: {
    description: 'Descending patterns, flowing waterfall motion',
    category: 'kinetic',
    scales: [SCALES.SLENDRO, SCALES.PENTATONIC],
    parameters: {
      // Core synthesis
      brilliance: 0.68,
      motion: 0.82,
      space: 0.58,
      warmth: 0.52,
      drift: 0.55,

      // Attack/texture
      attackSharpness: 0.52,
      attackTime: 0.04,
      airGain: 0.42,
      bodyLayerSustain: 0.62,
      releaseTime: 0.8,

      // Harmonic character
      filterResonance: 0.52,
      harmonicDensity: 0.62,
      complexity: 0.52,
      graininess: 0.08,

      // Temporal
      tempo: 0.62,
      driftSpeed: 0.42,

      // Reverb/space
      reverbMix: 0.52,
    },
    // Visual hints
    colorHue: 195,
    particleDensity: 0.75,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  spiral: {
    description: 'Rotating modulation, building complexity, centripetal energy',
    category: 'kinetic',
    scales: [SCALES.CHROMATIC, SCALES.WHOLE_TONE],
    parameters: {
      // Core synthesis
      brilliance: 0.58,
      motion: 0.78,
      space: 0.52,
      warmth: 0.45,
      drift: 0.65,

      // Attack/texture
      attackSharpness: 0.48,
      attackTime: 0.06,
      airGain: 0.32,
      bodyLayerSustain: 0.58,
      releaseTime: 0.7,

      // Harmonic character
      filterResonance: 0.58,
      harmonicDensity: 0.58,
      complexity: 0.68,
      graininess: 0.12,

      // Temporal
      tempo: 0.58,
      driftSpeed: 0.38,

      // Reverb/space
      reverbMix: 0.48,
    },
    // Visual hints
    colorHue: 290,
    particleDensity: 0.6,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  // ===== TEXTURAL (3) =====

  velvet: {
    description: 'Maximum warmth, soft attacks, rich luxurious smoothness',
    category: 'textural',
    scales: [SCALES.MAJOR, SCALES.MIXOLYDIAN],
    parameters: {
      // Core synthesis
      brilliance: 0.42,
      motion: 0.28,
      space: 0.62,
      warmth: 0.95,
      drift: 0.35,

      // Attack/texture
      attackSharpness: 0.12,
      attackTime: 0.25,
      airGain: 0.22,
      bodyLayerSustain: 0.75,
      releaseTime: 1.2,

      // Harmonic character
      filterResonance: 0.22,
      harmonicDensity: 0.52,
      complexity: 0.32,
      graininess: 0.01,

      // Temporal
      tempo: 0.32,
      driftSpeed: 0.12,

      // Reverb/space
      reverbMix: 0.52,
    },
    // Visual hints
    colorHue: 340,
    particleDensity: 0.3,
    // Special behaviors
    triggerAiImage: false,
    isApexWord: false,
  },

  rust: {
    description: 'Gritty harmonics, worn texture, weathered character',
    category: 'textural',
    scales: [SCALES.BLUES, SCALES.DORIAN],
    parameters: {
      // Core synthesis
      brilliance: 0.32,
      motion: 0.32,
      space: 0.52,
      warmth: 0.38,
      drift: 0.42,

      // Attack/texture
      attackSharpness: 0.38,
      attackTime: 0.1,
      airGain: 0.42,
      bodyLayerSustain: 0.52,
      releaseTime: 0.9,

      // Harmonic character
      filterResonance: 0.48,
      harmonicDensity: 0.52,
      complexity: 0.48,
      graininess: 0.58,

      // Temporal
      tempo: 0.32,
      driftSpeed: 0.18,

      // Reverb/space
      reverbMix: 0.42,
    },
    // Visual hints
    colorHue: 20,
    particleDensity: 0.4,
    // Special behaviors
    triggerAiImage: false,
    isApexWord: false,
  },

  silk: {
    description: 'Smooth, pure, flowing delicate continuity',
    category: 'textural',
    scales: [SCALES.PENTATONIC, SCALES.LYDIAN],
    parameters: {
      // Core synthesis
      brilliance: 0.68,
      motion: 0.42,
      space: 0.68,
      warmth: 0.62,
      drift: 0.38,

      // Attack/texture
      attackSharpness: 0.08,
      attackTime: 0.28,
      airGain: 0.35,
      bodyLayerSustain: 0.68,
      releaseTime: 1.3,

      // Harmonic character
      filterResonance: 0.18,
      harmonicDensity: 0.32,
      complexity: 0.28,
      graininess: 0.005,

      // Temporal
      tempo: 0.38,
      driftSpeed: 0.18,

      // Reverb/space
      reverbMix: 0.58,
    },
    // Visual hints
    colorHue: 45,
    particleDensity: 0.35,
    // Special behaviors
    triggerAiImage: false,
    isApexWord: false,
  },

  // ===== ABSTRACT (3) =====

  infinity: {
    description: 'Endless sustain, no attack, pure boundless expansion',
    category: 'abstract',
    scales: [SCALES.WHOLE_TONE, SCALES.SUSPENDED],
    parameters: {
      // Core synthesis
      brilliance: 0.52,
      motion: 0.12,
      space: 1.0,
      warmth: 0.52,
      drift: 0.25,

      // Attack/texture
      attackSharpness: 0.02,
      attackTime: 1.0,
      airGain: 0.48,
      bodyLayerSustain: 0.98,
      releaseTime: 6.0,

      // Harmonic character
      filterResonance: 0.32,
      harmonicDensity: 0.48,
      complexity: 0.38,
      graininess: 0.02,

      // Temporal
      tempo: 0.08,
      driftSpeed: 0.03,

      // Reverb/space
      reverbMix: 0.95,
    },
    // Visual hints
    colorHue: 270,
    particleDensity: 0.2,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: true,
  },

  void: {
    description: 'Minimal everything, deep space, presence of absence',
    category: 'abstract',
    scales: [SCALES.IN_SEN, SCALES.PHRYGIAN],
    parameters: {
      // Core synthesis
      brilliance: 0.15,
      motion: 0.05,
      space: 0.98,
      warmth: 0.18,
      drift: 0.22,

      // Attack/texture
      attackSharpness: 0.03,
      attackTime: 0.5,
      airGain: 0.65,
      bodyLayerSustain: 0.35,
      releaseTime: 3.0,

      // Harmonic character
      filterResonance: 0.15,
      harmonicDensity: 0.12,
      complexity: 0.15,
      graininess: 0.08,

      // Temporal
      tempo: 0.05,
      driftSpeed: 0.03,

      // Reverb/space
      reverbMix: 0.88,
    },
    // Visual hints
    colorHue: 250,
    particleDensity: 0.05,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },

  becoming: {
    description: 'Constant evolution, never settling, perpetual transformation',
    category: 'abstract',
    scales: [SCALES.CHROMATIC, SCALES.WHOLE_TONE],
    parameters: {
      // Core synthesis
      brilliance: 0.58,
      motion: 0.68,
      space: 0.72,
      warmth: 0.52,
      drift: 0.85,

      // Attack/texture
      attackSharpness: 0.25,
      attackTime: 0.2,
      airGain: 0.42,
      bodyLayerSustain: 0.68,
      releaseTime: 1.5,

      // Harmonic character
      filterResonance: 0.48,
      harmonicDensity: 0.62,
      complexity: 0.72,
      graininess: 0.15,

      // Temporal
      tempo: 0.45,
      driftSpeed: 0.48,

      // Reverb/space
      reverbMix: 0.62,
    },
    // Visual hints
    colorHue: 160,
    particleDensity: 0.55,
    // Special behaviors
    triggerAiImage: true,
    isApexWord: false,
  },
};

/**
 * Get magic word data if it exists
 * @param {string} word - Input word
 * @returns {Object|null} Magic word data or null
 */
export function getMagicWord(word) {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
  return MAGIC_WORDS[normalized] || null;
}

/**
 * Check if a word is a magic word
 * @param {string} word - Input word
 * @returns {boolean} True if magic word
 */
export function isMagicWord(word) {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
  return MAGIC_WORDS.hasOwnProperty(normalized);
}

/**
 * Get all magic words
 * @returns {string[]} Array of magic words
 */
export function getAllMagicWords() {
  return Object.keys(MAGIC_WORDS);
}

/**
 * Get magic words by category
 * @param {string} category - Category name
 * @returns {string[]} Words in category
 */
export function getMagicWordsByCategory(category) {
  return Object.entries(MAGIC_WORDS)
    .filter(([_, data]) => data.category === category)
    .map(([word]) => word);
}

/**
 * Get all categories
 * @returns {string[]} Array of categories
 */
export function getCategories() {
  const categories = new Set();
  for (const data of Object.values(MAGIC_WORDS)) {
    categories.add(data.category);
  }
  return [...categories];
}

/**
 * Get magic word statistics
 * @returns {Object} Statistics about magic words
 */
export function getMagicWordStats() {
  const stats = {
    totalWords: Object.keys(MAGIC_WORDS).length,
    categories: {},
    apexWords: [],
    aiImageWords: [],
  };

  for (const [word, data] of Object.entries(MAGIC_WORDS)) {
    if (!stats.categories[data.category]) {
      stats.categories[data.category] = [];
    }
    stats.categories[data.category].push(word);

    if (data.isApexWord) {
      stats.apexWords.push(word);
    }
    if (data.triggerAiImage) {
      stats.aiImageWords.push(word);
    }
  }

  return stats;
}

/**
 * Get apex words (climactic, powerful moments)
 * @returns {string[]} Array of apex word names
 */
export function getApexWords() {
  return Object.entries(MAGIC_WORDS)
    .filter(([_, data]) => data.isApexWord)
    .map(([word]) => word);
}

/**
 * Get words that trigger AI image generation
 * @returns {string[]} Array of word names
 */
export function getAiImageWords() {
  return Object.entries(MAGIC_WORDS)
    .filter(([_, data]) => data.triggerAiImage)
    .map(([word]) => word);
}

export default {
  MAGIC_WORDS,
  getMagicWord,
  isMagicWord,
  getAllMagicWords,
  getMagicWordsByCategory,
  getCategories,
  getMagicWordStats,
  getApexWords,
  getAiImageWords,
};
