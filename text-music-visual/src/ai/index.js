/**
 * AI Image Layer
 * Atmospheric texture generation for text-music-visual system
 *
 * This module provides AI-generated painterly textures that enhance
 * the visual experience without competing with procedural visuals.
 *
 * Features:
 * - fal.ai FLUX.1 schnell integration for fast generation
 * - Intelligent trigger detection (semantic shifts, stability, apex moments)
 * - Heavy processing (blur, posterize, color matching)
 * - Smooth crossfading at 20-30% opacity
 * - Flow field extraction for particle system
 * - LRU caching with graceful degradation
 */

// Core modules
export { AI_CONFIG } from './config.js';
export { ImageGenerator } from './ImageGenerator.js';
export { ImageProcessor } from './ImageProcessor.js';
export { PromptBuilder } from './PromptBuilder.js';
export { TextureManager } from './TextureManager.js';

// Default export is the main TextureManager
export { default } from './TextureManager.js';

/**
 * Quick setup helper
 * @param {THREE.WebGLRenderer} renderer - Three.js renderer
 * @param {Object} options - Configuration options
 * @returns {TextureManager} Configured texture manager
 *
 * @example
 * import { createTextureManager } from './ai';
 *
 * const textureManager = createTextureManager(renderer, {
 *     targetOpacity: 0.25,
 * });
 *
 * // In render loop:
 * textureManager.update(deltaTime, visualParams, palette);
 *
 * // Get uniforms for shader:
 * const uniforms = textureManager.getShaderUniforms();
 */
export function createTextureManager(renderer, options = {}) {
    const { TextureManager } = require('./TextureManager.js');
    return new TextureManager(renderer, options);
}

/**
 * Integration example with VisualEngine
 *
 * @example
 * // In VisualEngine.js:
 *
 * import { TextureManager } from './ai';
 *
 * // In init():
 * this.textureManager = new TextureManager(this.renderer);
 *
 * // Add uniforms to SDF material:
 * const aiUniforms = this.textureManager.getShaderUniforms();
 * Object.assign(this.sdfMaterial.uniforms, aiUniforms);
 *
 * // In render loop:
 * this.textureManager.update(this.deltaTime, {
 *     motion: this.audioParams.spectralFlux,
 *     complexity: this.audioParams.spectralCentroid,
 *     warmth: 0.5, // from sentiment
 *     space: 0.6, // from semantics
 *     energy: this.audioParams.rmsEnergy,
 *     sentiment: 0.3, // from sentiment analysis
 *     semanticCategory: 'water', // from semantic analysis
 * }, this.colorSystem.getCurrentPalette());
 *
 * // Update shader uniforms:
 * this.sdfMaterial.uniforms.uAiTexture.value = this.textureManager.getTexture();
 * this.sdfMaterial.uniforms.uAiOpacity.value = this.textureManager.getOpacity();
 *
 * // Use flow field for particles:
 * const flow = this.textureManager.sampleFlowField(x, y, width, height);
 * particle.velocity.x += flow.x * strength;
 * particle.velocity.y += flow.y * strength;
 */

/**
 * Shader integration snippet
 *
 * Add these uniforms to your shader:
 *
 * uniform sampler2D uAiTexture;
 * uniform float uAiOpacity;
 *
 * In fragment shader, blend with base color:
 *
 * vec4 aiColor = texture2D(uAiTexture, vUv);
 * vec3 finalColor = mix(baseColor.rgb, aiColor.rgb, uAiOpacity * aiColor.a);
 */
