/**
 * TextureManager.js
 * Manages AI textures: caching, crossfading, flow fields, Three.js integration
 */

import * as THREE from 'three';
import { AI_CONFIG } from './config.js';
import { ImageGenerator } from './ImageGenerator.js';
import { ImageProcessor } from './ImageProcessor.js';
import { PromptBuilder } from './PromptBuilder.js';

export class TextureManager {
    constructor(renderer, options = {}) {
        this.renderer = renderer;
        this.options = { ...AI_CONFIG.display, ...options };

        // Initialize sub-modules
        this.generator = new ImageGenerator();
        this.processor = new ImageProcessor();
        this.promptBuilder = new PromptBuilder();

        // Texture cache
        this.cache = new Map();
        this.cacheOrder = []; // LRU tracking

        // Current textures
        this.currentTexture = null;
        this.previousTexture = null;
        this.targetTexture = null;

        // Crossfade state
        this.crossfadeProgress = 0;
        this.isCrossfading = false;
        this.crossfadeStartTime = 0;

        // Flow field data
        this.flowField = null;
        this.flowFieldTexture = null;

        // Generation state
        this.lastParams = null;
        this.lastSemanticHash = '';
        this.lastGenerationTime = 0;
        this.stabilityStartTime = 0;
        this.isGenerating = false;

        // Apex detection
        this.energyHistory = [];
        this.sentimentHistory = [];
        this.maxHistoryLength = 30;

        // Current opacity
        this.currentOpacity = 0;
        this.targetOpacity = 0;

        // API availability
        this.apiAvailable = false;
        this.checkApiAvailability();

        // Preloaded fallback textures
        this.fallbackTextures = [];
        this.currentFallbackIndex = 0;

        // Setup callbacks
        this.generator.onGenerated = (result) => this.onImageGenerated(result);
        this.generator.onError = (error) => this.onGenerationError(error);

        // Create placeholder texture
        this.createPlaceholderTexture();
    }

    /**
     * Check if fal.ai API is available
     */
    async checkApiAvailability() {
        this.apiAvailable = await this.generator.checkAvailability();

        if (!this.apiAvailable && AI_CONFIG.fallback.useProceduralNoise) {
            if (AI_CONFIG.debug.logGenerations) {
                console.log('[TextureManager] API unavailable, using procedural fallback');
            }
            this.preloadFallbackTextures();
        }
    }

    /**
     * Preload procedural fallback textures
     */
    preloadFallbackTextures() {
        const count = AI_CONFIG.fallback.preloadedTextureCount;
        const palette = this.getDefaultPalette();

        for (let i = 0; i < count; i++) {
            // Vary hue for each fallback
            const variedPalette = this.varyPalette(palette, i / count);
            const processed = this.processor.createProceduralNoise(512, 512, variedPalette);
            const texture = this.createTextureFromCanvas(processed.canvas);

            this.fallbackTextures.push({
                texture,
                flowField: processed.flowField,
                dominantColors: processed.dominantColors,
            });
        }
    }

    /**
     * Create placeholder texture
     */
    createPlaceholderTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Dark gradient placeholder
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 180);
        gradient.addColorStop(0, '#2a3a4a');
        gradient.addColorStop(1, '#1a2030');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);

        this.currentTexture = this.createTextureFromCanvas(canvas);
        this.currentOpacity = 0;
    }

    /**
     * Update the texture manager (call each frame)
     * @param {number} deltaTime - Time since last frame in seconds
     * @param {Object} params - Current visual parameters
     * @param {Object} palette - Current color palette (RGB 0-1)
     */
    update(deltaTime, params, palette) {
        // Update crossfade
        if (this.isCrossfading) {
            this.updateCrossfade(deltaTime);
        }

        // Update opacity
        this.updateOpacity(deltaTime);

        // Track for apex detection
        this.trackApexData(params);

        // Check generation triggers
        if (!this.isGenerating) {
            this.checkGenerationTriggers(params, palette);
        }
    }

    /**
     * Check if generation should be triggered
     * @param {Object} params - Current visual parameters
     * @param {Object} palette - Current color palette
     */
    checkGenerationTriggers(params, palette) {
        const now = Date.now();

        // Check minimum interval
        if (now - this.lastGenerationTime < AI_CONFIG.timing.minInterval) {
            return;
        }

        // Check cache first
        const paramHash = this.promptBuilder.createParameterHash(params);
        if (this.cache.has(paramHash)) {
            this.applyCachedTexture(paramHash);
            return;
        }

        // Trigger 1: Significant semantic shift
        if (this.detectSemanticShift(params)) {
            this.triggerGeneration(params, palette, 'semantic_shift');
            return;
        }

        // Trigger 2: Stability after change
        if (this.detectStability(params)) {
            this.triggerGeneration(params, palette, 'stability');
            return;
        }

        // Trigger 3: Apex moment
        if (this.detectApexMoment(params)) {
            this.triggerGeneration(params, palette, 'apex');
            return;
        }
    }

    /**
     * Detect significant semantic shift
     * @param {Object} params - Current parameters
     * @returns {boolean} Whether shift detected
     */
    detectSemanticShift(params) {
        if (!this.lastParams) {
            return false;
        }

        // Calculate parameter distance
        const distance = Math.sqrt(
            Math.pow((params.motion || 0) - (this.lastParams.motion || 0), 2) +
            Math.pow((params.complexity || 0) - (this.lastParams.complexity || 0), 2) +
            Math.pow((params.warmth || 0) - (this.lastParams.warmth || 0), 2) +
            Math.pow((params.space || 0) - (this.lastParams.space || 0), 2)
        ) / 2; // Normalize to 0-1 range

        return distance > AI_CONFIG.triggers.semanticShiftThreshold;
    }

    /**
     * Detect stability after changes
     * @param {Object} params - Current parameters
     * @returns {boolean} Whether stable
     */
    detectStability(params) {
        if (!this.lastParams) {
            this.lastParams = { ...params };
            this.stabilityStartTime = Date.now();
            return false;
        }

        // Check if parameters are stable
        const distance = Math.sqrt(
            Math.pow((params.motion || 0) - (this.lastParams.motion || 0), 2) +
            Math.pow((params.complexity || 0) - (this.lastParams.complexity || 0), 2)
        );

        if (distance > AI_CONFIG.triggers.parameterChangeThreshold) {
            // Parameters changed, reset stability timer
            this.lastParams = { ...params };
            this.stabilityStartTime = Date.now();
            return false;
        }

        // Check if stable for long enough
        const stableTime = Date.now() - this.stabilityStartTime;
        return stableTime >= AI_CONFIG.timing.stabilityThreshold;
    }

    /**
     * Detect apex moment (high energy + sentiment peak)
     * @param {Object} params - Current parameters
     * @returns {boolean} Whether apex detected
     */
    detectApexMoment(params) {
        const energy = params.energy || params.rmsEnergy || 0;
        const sentiment = Math.abs(params.sentiment || 0);

        const combined = energy + sentiment;

        return (
            energy > AI_CONFIG.triggers.apexEnergyThreshold &&
            sentiment > AI_CONFIG.triggers.apexSentimentThreshold &&
            combined > AI_CONFIG.triggers.apexCombinedThreshold
        );
    }

    /**
     * Track data for apex detection
     * @param {Object} params - Current parameters
     */
    trackApexData(params) {
        const energy = params.energy || params.rmsEnergy || 0;
        const sentiment = params.sentiment || 0;

        this.energyHistory.push(energy);
        this.sentimentHistory.push(sentiment);

        // Trim history
        if (this.energyHistory.length > this.maxHistoryLength) {
            this.energyHistory.shift();
        }
        if (this.sentimentHistory.length > this.maxHistoryLength) {
            this.sentimentHistory.shift();
        }
    }

    /**
     * Trigger image generation
     * @param {Object} params - Visual parameters
     * @param {Object} palette - Color palette
     * @param {string} reason - Trigger reason
     */
    async triggerGeneration(params, palette, reason) {
        this.isGenerating = true;
        this.lastGenerationTime = Date.now();
        this.lastParams = { ...params };

        if (AI_CONFIG.debug.logGenerations) {
            console.log(`[TextureManager] Triggering generation: ${reason}`);
        }

        // Check API availability
        if (!this.apiAvailable) {
            this.useFallbackTexture(palette);
            this.isGenerating = false;
            return;
        }

        try {
            // Build prompt from parameters
            const prompt = this.promptBuilder.buildPrompt({
                ...params,
                colorHue: this.getHueFromPalette(palette),
            });

            // Generate image
            const result = await this.generator.generate(prompt, {
                width: AI_CONFIG.generation.width,
                height: AI_CONFIG.generation.height,
            });

            // Process the generated image
            const processed = await this.processor.process(
                result.imageBitmap,
                palette,
                {
                    targetWidth: window.innerWidth || 1920,
                    targetHeight: window.innerHeight || 1080,
                }
            );

            // Create Three.js texture
            const texture = this.createTextureFromCanvas(processed.canvas);

            // Cache the result
            const paramHash = this.promptBuilder.createParameterHash(params);
            this.cacheTexture(paramHash, {
                texture,
                flowField: processed.flowField,
                dominantColors: processed.dominantColors,
            });

            // Start crossfade to new texture
            this.startCrossfade(texture, processed.flowField);

        } catch (error) {
            console.error('[TextureManager] Generation failed:', error);
            this.useFallbackTexture(palette);
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * Use fallback procedural texture
     * @param {Object} palette - Color palette
     */
    useFallbackTexture(palette) {
        if (this.fallbackTextures.length > 0) {
            // Use preloaded fallback
            const fallback = this.fallbackTextures[this.currentFallbackIndex];
            this.currentFallbackIndex = (this.currentFallbackIndex + 1) % this.fallbackTextures.length;
            this.startCrossfade(fallback.texture, fallback.flowField);
        } else {
            // Generate procedural noise
            const processed = this.processor.createProceduralNoise(
                window.innerWidth || 1920,
                window.innerHeight || 1080,
                palette
            );
            const texture = this.createTextureFromCanvas(processed.canvas);
            this.startCrossfade(texture, processed.flowField);
        }
    }

    /**
     * Handle successful generation callback
     * @param {Object} result - Generation result
     */
    onImageGenerated(result) {
        if (AI_CONFIG.debug.logGenerations) {
            console.log(`[TextureManager] Image generated in ${result.elapsedTime}ms`);
        }
    }

    /**
     * Handle generation error callback
     * @param {Error} error - Generation error
     */
    onGenerationError(error) {
        console.error('[TextureManager] Generation error:', error);
    }

    /**
     * Create Three.js texture from canvas
     * @param {HTMLCanvasElement} canvas - Source canvas
     * @returns {THREE.Texture} Three.js texture
     */
    createTextureFromCanvas(canvas) {
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;
        texture.needsUpdate = true;
        return texture;
    }

    /**
     * Cache a texture with LRU eviction
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    cacheTexture(key, data) {
        // Remove if already cached (for LRU update)
        if (this.cache.has(key)) {
            const index = this.cacheOrder.indexOf(key);
            if (index > -1) {
                this.cacheOrder.splice(index, 1);
            }
        }

        // Add to cache
        this.cache.set(key, {
            ...data,
            timestamp: Date.now(),
        });
        this.cacheOrder.push(key);

        // Evict if over limit
        while (this.cache.size > AI_CONFIG.cache.maxCachedImages) {
            const oldestKey = this.cacheOrder.shift();
            const oldEntry = this.cache.get(oldestKey);
            if (oldEntry && oldEntry.texture) {
                oldEntry.texture.dispose();
            }
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Apply cached texture
     * @param {string} key - Cache key
     */
    applyCachedTexture(key) {
        const cached = this.cache.get(key);
        if (!cached) return;

        // Update LRU order
        const index = this.cacheOrder.indexOf(key);
        if (index > -1) {
            this.cacheOrder.splice(index, 1);
            this.cacheOrder.push(key);
        }

        this.startCrossfade(cached.texture, cached.flowField);
        this.lastGenerationTime = Date.now();

        if (AI_CONFIG.debug.logGenerations) {
            console.log(`[TextureManager] Using cached texture: ${key}`);
        }
    }

    /**
     * Start crossfade to new texture
     * @param {THREE.Texture} texture - Target texture
     * @param {Float32Array} flowField - Flow field data
     */
    startCrossfade(texture, flowField) {
        this.previousTexture = this.currentTexture;
        this.targetTexture = texture;
        this.flowField = flowField;

        this.crossfadeProgress = 0;
        this.crossfadeStartTime = Date.now();
        this.isCrossfading = true;

        this.targetOpacity = this.options.targetOpacity;
    }

    /**
     * Update crossfade progress
     * @param {number} deltaTime - Time since last frame
     */
    updateCrossfade(deltaTime) {
        const elapsed = Date.now() - this.crossfadeStartTime;
        this.crossfadeProgress = Math.min(1, elapsed / AI_CONFIG.timing.crossfadeDuration);

        if (this.crossfadeProgress >= 1) {
            // Crossfade complete
            this.currentTexture = this.targetTexture;
            this.targetTexture = null;
            this.previousTexture = null;
            this.isCrossfading = false;
        }
    }

    /**
     * Update opacity with smooth transition
     * @param {number} deltaTime - Time since last frame
     */
    updateOpacity(deltaTime) {
        const speed = 2.0; // Opacity change per second
        const diff = this.targetOpacity - this.currentOpacity;

        if (Math.abs(diff) > 0.001) {
            this.currentOpacity += Math.sign(diff) * Math.min(Math.abs(diff), speed * deltaTime);
        }
    }

    /**
     * Get hue value from palette
     * @param {Object} palette - Color palette
     * @returns {number} Hue value (0-1)
     */
    getHueFromPalette(palette) {
        if (!palette || !palette.base) return 0.5;

        // Calculate hue from RGB
        const r = palette.base.r;
        const g = palette.base.g;
        const b = palette.base.b;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        if (max === min) return 0;

        let h;
        const d = max - min;

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        return h / 6;
    }

    /**
     * Vary a palette for fallback variety
     * @param {Object} palette - Base palette
     * @param {number} variation - Variation amount (0-1)
     * @returns {Object} Varied palette
     */
    varyPalette(palette, variation) {
        const hueShift = variation * 0.3; // Shift up to 30% of hue range

        return {
            anchor: palette.anchor,
            base: this.shiftHue(palette.base, hueShift),
            accent1: this.shiftHue(palette.accent1, hueShift),
            accent2: this.shiftHue(palette.accent2, hueShift),
        };
    }

    /**
     * Shift hue of a color
     * @param {Object} color - RGB color (0-1)
     * @param {number} amount - Shift amount (0-1)
     * @returns {Object} Shifted color
     */
    shiftHue(color, amount) {
        // Convert to HSL, shift hue, convert back
        const r = color.r, g = color.g, b = color.b;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        h = (h + amount) % 1;

        // Convert back to RGB
        if (s === 0) {
            return { r: l, g: l, b: l };
        }

        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        return {
            r: hue2rgb(p, q, h + 1/3),
            g: hue2rgb(p, q, h),
            b: hue2rgb(p, q, h - 1/3),
        };
    }

    /**
     * Get default palette for fallbacks
     * @returns {Object} Default palette
     */
    getDefaultPalette() {
        return {
            anchor: { r: 0.1, g: 0.1, b: 0.15 },
            base: { r: 0.3, g: 0.4, b: 0.6 },
            accent1: { r: 0.5, g: 0.3, b: 0.5 },
            accent2: { r: 0.2, g: 0.5, b: 0.4 },
        };
    }

    /**
     * Get current texture for shader uniform
     * @returns {THREE.Texture}
     */
    getTexture() {
        return this.currentTexture;
    }

    /**
     * Get current opacity for shader uniform
     * @returns {number}
     */
    getOpacity() {
        // During crossfade, interpolate opacity
        if (this.isCrossfading) {
            return this.currentOpacity * this.crossfadeProgress;
        }
        return this.currentOpacity;
    }

    /**
     * Get crossfade progress
     * @returns {number}
     */
    getCrossfadeProgress() {
        return this.crossfadeProgress;
    }

    /**
     * Get flow field for particle system
     * @returns {Float32Array}
     */
    getFlowField() {
        return this.flowField;
    }

    /**
     * Sample flow field at position
     * @param {number} x - X position (0-1)
     * @param {number} y - Y position (0-1)
     * @param {number} width - Flow field width
     * @param {number} height - Flow field height
     * @returns {Object} Flow vector {x, y}
     */
    sampleFlowField(x, y, width, height) {
        if (!this.flowField) {
            return { x: 0, y: 0 };
        }

        const px = Math.floor(x * (width - 1));
        const py = Math.floor(y * (height - 1));
        const idx = (py * width + px) * 2;

        return {
            x: this.flowField[idx] || 0,
            y: this.flowField[idx + 1] || 0,
        };
    }

    /**
     * Get uniforms for shader integration
     * @returns {Object} Shader uniforms
     */
    getShaderUniforms() {
        return {
            uAiTexture: { value: this.currentTexture },
            uAiOpacity: { value: this.getOpacity() },
            uAiCrossfade: { value: this.crossfadeProgress },
            uAiPreviousTexture: { value: this.previousTexture },
        };
    }

    /**
     * Set API key at runtime
     * @param {string} apiKey - fal.ai API key
     */
    setApiKey(apiKey) {
        this.generator.setApiKey(apiKey);
        this.checkApiAvailability();
    }

    /**
     * Force generation with specific prompt
     * @param {string} prompt - Custom prompt
     * @param {Object} palette - Color palette
     */
    async forceGenerate(prompt, palette) {
        if (this.isGenerating) return;

        this.isGenerating = true;
        this.lastGenerationTime = Date.now();

        try {
            const result = await this.generator.generate(prompt);
            const processed = await this.processor.process(result.imageBitmap, palette);
            const texture = this.createTextureFromCanvas(processed.canvas);
            this.startCrossfade(texture, processed.flowField);
        } catch (error) {
            console.error('[TextureManager] Force generation failed:', error);
            this.useFallbackTexture(palette);
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        for (const [key, data] of this.cache) {
            if (data.texture) {
                data.texture.dispose();
            }
        }
        this.cache.clear();
        this.cacheOrder = [];
    }

    /**
     * Get manager status
     * @returns {Object} Status info
     */
    getStatus() {
        return {
            isGenerating: this.isGenerating,
            isCrossfading: this.isCrossfading,
            crossfadeProgress: this.crossfadeProgress,
            currentOpacity: this.currentOpacity,
            cacheSize: this.cache.size,
            apiAvailable: this.apiAvailable,
            generatorStatus: this.generator.getStatus(),
        };
    }

    /**
     * Cleanup resources
     */
    dispose() {
        this.generator.dispose();
        this.processor.dispose();

        this.clearCache();

        if (this.currentTexture) {
            this.currentTexture.dispose();
        }
        if (this.previousTexture) {
            this.previousTexture.dispose();
        }
        if (this.targetTexture) {
            this.targetTexture.dispose();
        }

        for (const fallback of this.fallbackTextures) {
            if (fallback.texture) {
                fallback.texture.dispose();
            }
        }
    }
}

export default TextureManager;
