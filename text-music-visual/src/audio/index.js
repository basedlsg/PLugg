/**
 * Audio Pipeline for Text-Music-Visual System
 *
 * Connects Strudel patterns to the 3-layer world synthesizer
 * with smooth morphing between states based on semantic analysis.
 *
 * Architecture:
 * - StrudelBridge: Initialize Strudel, manage patterns
 * - DronePattern: Continuous morphing drone pattern
 * - NoteGenerator: Convert mapping params to scale notes
 * - AudioRouter: Connect to analyser and destination
 */

export { StrudelBridge, createStrudelBridge } from './StrudelBridge.js';
export { DronePattern, createDronePattern, ParameterManager } from './DronePattern.js';
export { NoteGenerator, mapToSynthControls, getWorldSound, SCALES, CATEGORY_TO_SCALE } from './NoteGenerator.js';
export { AudioRouter, createAudioRouter } from './AudioRouter.js';

// Default export for convenience
import { StrudelBridge } from './StrudelBridge.js';
import { DronePattern } from './DronePattern.js';
import { NoteGenerator } from './NoteGenerator.js';
import { AudioRouter } from './AudioRouter.js';

export default {
  StrudelBridge,
  DronePattern,
  NoteGenerator,
  AudioRouter,
};

/**
 * Quick setup function for the complete audio pipeline
 *
 * @param {Object} options - Configuration options
 * @returns {Object} Configured pipeline with all components
 *
 * @example
 * import { setupAudioPipeline } from './audio';
 *
 * const pipeline = setupAudioPipeline({
 *   sustainTime: 8,
 *   releaseTime: 4,
 *   morphTime: 0.3,
 * });
 *
 * // Initialize and start
 * await pipeline.bridge.initialize();
 *
 * // Update from text analysis
 * pipeline.bridge.updateFromMapping(fusionResult);
 *
 * // Get analysis for visualization
 * const analysis = pipeline.bridge.getAnalysis();
 */
export function setupAudioPipeline(options = {}) {
  const bridge = new StrudelBridge(options);

  return {
    bridge,
    dronePattern: bridge.dronePattern,
    audioRouter: bridge.audioRouter,

    // Convenience methods
    async start() {
      await bridge.initialize();
    },

    stop() {
      bridge.stop();
    },

    updateFromMapping(result) {
      return bridge.updateFromMapping(result);
    },

    setParameter(name, value) {
      bridge.setParameter(name, value);
    },

    setParameters(params) {
      bridge.setParameters(params);
    },

    getAnalysis() {
      return bridge.getAnalysis();
    },

    getState() {
      return bridge.getState();
    },

    dispose() {
      bridge.dispose();
    },
  };
}

/**
 * Example usage demonstrating the complete pipeline
 *
 * @example
 * import { setupAudioPipeline } from './audio';
 * import { FusionEngine } from '../mapping/fusion.js';
 *
 * // Setup
 * const pipeline = setupAudioPipeline();
 * const fusion = new FusionEngine();
 *
 * // Start audio
 * await pipeline.start();
 *
 * // Process text and update audio
 * function processText(text) {
 *   const result = fusion.processPhrase(text);
 *   pipeline.updateFromMapping(result);
 *
 *   // Get analysis for visualization
 *   const analysis = pipeline.getAnalysis();
 *   visualEngine.update(analysis);
 * }
 *
 * // Direct parameter control
 * pipeline.setParameters({
 *   brilliance: 0.7,
 *   motion: 0.4,
 *   space: 0.5,
 *   warmth: 0.6,
 *   drift: 0.3,
 * });
 *
 * // Cleanup
 * pipeline.dispose();
 */
