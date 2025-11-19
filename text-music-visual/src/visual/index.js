/**
 * Visual System - Raymarched SDF Audio-Reactive Visuals
 *
 * Layer Hierarchy:
 * - Layer 0: Raymarched SDF Background (PRIMARY - 80% of visuals)
 * - Layer 1: AI Texture (ATMOSPHERIC - 10-30% opacity)
 * - Layer 2: GPU Particles (PUNCTUATION - 10k-30k max)
 * - Layer 3: Post-Processing (bloom, grain, color grading)
 *
 * Audio-Visual Mapping:
 * - RMS Energy -> Global scale, bloom intensity
 * - Spectral Centroid -> Color temperature
 * - Spectral Flux -> Particle emission rate
 * - Onset Detection -> White flash, geometry inversion
 * - Chord Root -> Base hue
 */

export { VisualEngine } from './VisualEngine.js';
export { AudioAnalyzer } from './AudioAnalyzer.js';
export { ColorSystem } from './ColorSystem.js';

// Re-export as default
import { VisualEngine } from './VisualEngine.js';
export default VisualEngine;
