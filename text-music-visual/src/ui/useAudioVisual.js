import { useCallback, useRef, useState } from 'react';

/**
 * useAudioVisual Hook
 *
 * Connects UI to audio/visual systems with:
 * - Anticipation phase (subtle changes while typing)
 * - Release phase (full morph on Enter)
 * - Blending from history
 * - Breathing cycle management
 */
export default function useAudioVisual() {
  const [currentParameters, setCurrentParameters] = useState({
    brightness: 0.5,
    warmth: 0.5,
    density: 0.5,
    movement: 0.5,
    depth: 0.5,
    texture: 0.5
  });

  const targetParametersRef = useRef({ ...currentParameters });
  const breathingPhaseRef = useRef(0);
  const anticipationWordRef = useRef('');

  // Initialize the world - called during first 10s choreography
  const initializeWorld = useCallback(async () => {
    // Start ambient breathing cycle (8-15s)
    const breathe = () => {
      breathingPhaseRef.current += 0.01;
      const breath = Math.sin(breathingPhaseRef.current) * 0.5 + 0.5;

      // Subtle ambient changes
      setCurrentParameters(prev => ({
        ...prev,
        brightness: prev.brightness + (breath - 0.5) * 0.02,
        movement: prev.movement + (breath - 0.5) * 0.01
      }));

      requestAnimationFrame(breathe);
    };

    requestAnimationFrame(breathe);

    return Promise.resolve();
  }, []);

  // Anticipation phase - system "dreams" the word
  const setAnticipation = useCallback((text) => {
    anticipationWordRef.current = text;

    // Analyze text for subtle parameter hints
    const analysis = analyzeWord(text);

    // Apply very subtle anticipation changes (10% intensity)
    setCurrentParameters(prev => {
      const newParams = {};
      Object.keys(prev).forEach(key => {
        if (analysis[key] !== undefined) {
          // Subtle lean toward target
          newParams[key] = prev[key] + (analysis[key] - prev[key]) * 0.1;
        } else {
          newParams[key] = prev[key];
        }
      });
      return newParams;
    });
  }, []);

  // Release phase - full morph blooms
  const triggerMorph = useCallback((word) => {
    const analysis = analyzeWord(word);

    // Store as target
    targetParametersRef.current = { ...analysis };

    // Animate to target over 400ms
    const startParams = { ...currentParameters };
    const startTime = performance.now();
    const duration = 400;

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setCurrentParameters(() => {
        const newParams = {};
        Object.keys(startParams).forEach(key => {
          const start = startParams[key];
          const target = analysis[key] ?? start;
          newParams[key] = start + (target - start) * eased;
        });
        return newParams;
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [currentParameters]);

  // Blend from history - combine past with current
  const blendFromHistory = useCallback((historicalParams) => {
    // 50/50 blend over 300ms
    const startParams = { ...currentParameters };
    const startTime = performance.now();
    const duration = 300;

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);

      setCurrentParameters(() => {
        const newParams = {};
        Object.keys(startParams).forEach(key => {
          const current = startParams[key];
          const historical = historicalParams[key] ?? current;
          // 50% blend
          const target = (current + historical) / 2;
          newParams[key] = current + (target - current) * eased;
        });
        return newParams;
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [currentParameters]);

  // Get current parameters for history storage
  const getCurrentParameters = useCallback(() => {
    return { ...currentParameters };
  }, [currentParameters]);

  return {
    initializeWorld,
    setAnticipation,
    triggerMorph,
    blendFromHistory,
    getCurrentParameters,
    currentParameters
  };
}

/**
 * Analyze a word to extract audio/visual parameters
 *
 * No wrong answers - everything creates valid parameters:
 * - Known words map to specific feelings
 * - Unknown words interpreted phonetically
 * - Typos create unique hybrids
 */
function analyzeWord(word) {
  const normalized = word.toLowerCase().trim();

  // Base parameters
  const params = {
    brightness: 0.5,
    warmth: 0.5,
    density: 0.5,
    movement: 0.5,
    depth: 0.5,
    texture: 0.5
  };

  // Known word mappings (semantic analysis)
  const semanticMappings = {
    // Time of day
    dawn: { brightness: 0.6, warmth: 0.7, movement: 0.3 },
    morning: { brightness: 0.8, warmth: 0.6, movement: 0.5 },
    afternoon: { brightness: 0.9, warmth: 0.5, movement: 0.6 },
    dusk: { brightness: 0.4, warmth: 0.8, movement: 0.3 },
    night: { brightness: 0.2, warmth: 0.3, movement: 0.2 },

    // Weather
    rain: { brightness: 0.3, depth: 0.8, texture: 0.7, movement: 0.4 },
    storm: { brightness: 0.2, density: 0.9, movement: 0.9, depth: 0.9 },
    sun: { brightness: 1.0, warmth: 0.9, depth: 0.3 },
    fog: { brightness: 0.4, density: 0.7, depth: 0.2, texture: 0.3 },
    snow: { brightness: 0.9, warmth: 0.2, density: 0.5, texture: 0.8 },

    // Nature
    forest: { brightness: 0.4, density: 0.8, depth: 0.7, texture: 0.6 },
    ocean: { brightness: 0.5, depth: 0.9, movement: 0.6, warmth: 0.4 },
    mountain: { brightness: 0.6, density: 0.7, depth: 0.9, movement: 0.1 },
    river: { brightness: 0.5, movement: 0.7, depth: 0.5, texture: 0.4 },
    wind: { brightness: 0.6, movement: 0.8, density: 0.2, texture: 0.3 },

    // Emotions
    calm: { movement: 0.2, density: 0.3, depth: 0.6 },
    joy: { brightness: 0.9, warmth: 0.8, movement: 0.7 },
    melancholy: { brightness: 0.3, warmth: 0.4, depth: 0.8, movement: 0.2 },
    wonder: { brightness: 0.7, depth: 0.9, movement: 0.5 },
    peace: { brightness: 0.6, movement: 0.1, density: 0.3, warmth: 0.6 },

    // Abstract
    stillness: { movement: 0.1, density: 0.2, depth: 0.5 },
    chaos: { movement: 1.0, density: 0.9, texture: 0.9 },
    space: { brightness: 0.1, density: 0.1, depth: 1.0 },
    light: { brightness: 1.0, warmth: 0.6, density: 0.2 },
    dark: { brightness: 0.1, warmth: 0.3, depth: 0.7 }
  };

  // Check for known word
  if (semanticMappings[normalized]) {
    return { ...params, ...semanticMappings[normalized] };
  }

  // Phonetic analysis for unknown words
  // Vowels affect warmth and brightness
  const vowelCount = (normalized.match(/[aeiou]/gi) || []).length;
  const vowelRatio = vowelCount / Math.max(normalized.length, 1);
  params.warmth = 0.3 + vowelRatio * 0.5;
  params.brightness = 0.3 + vowelRatio * 0.4;

  // Hard consonants affect density and texture
  const hardConsonants = (normalized.match(/[kptbdg]/gi) || []).length;
  params.density = 0.3 + (hardConsonants / Math.max(normalized.length, 1)) * 0.5;
  params.texture = 0.3 + (hardConsonants / Math.max(normalized.length, 1)) * 0.4;

  // Sibilants affect movement
  const sibilants = (normalized.match(/[szfvh]/gi) || []).length;
  params.movement = 0.3 + (sibilants / Math.max(normalized.length, 1)) * 0.5;

  // Word length affects depth
  params.depth = Math.min(0.3 + normalized.length * 0.05, 1);

  // Repeating characters create emphasis
  const hasRepeats = /(.)\1/.test(normalized);
  if (hasRepeats) {
    params.depth = Math.min(params.depth + 0.2, 1);
  }

  return params;
}
