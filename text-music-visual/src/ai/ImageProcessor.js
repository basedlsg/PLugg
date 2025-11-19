/**
 * ImageProcessor.js
 * Image processing pipeline: blur, posterize, color match
 */

import { AI_CONFIG } from './config.js';

export class ImageProcessor {
    constructor(options = {}) {
        this.config = { ...AI_CONFIG.processing, ...options };

        // Create offscreen canvas for processing
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', {
            willReadFrequently: true,
        });

        // Secondary canvas for multi-pass operations
        this.tempCanvas = document.createElement('canvas');
        this.tempCtx = this.tempCanvas.getContext('2d', {
            willReadFrequently: true,
        });
    }

    /**
     * Process an image through the full pipeline
     * @param {ImageBitmap|HTMLImageElement|HTMLCanvasElement} source - Source image
     * @param {Object} palette - Current color palette (RGB values 0-1)
     * @param {Object} options - Processing options
     * @returns {Object} Processed result with canvas and image data
     */
    async process(source, palette, options = {}) {
        const config = { ...this.config, ...options };

        const startTime = performance.now();

        // Set canvas size
        const width = options.targetWidth || source.width;
        const height = options.targetHeight || source.height;

        this.canvas.width = width;
        this.canvas.height = height;
        this.tempCanvas.width = width;
        this.tempCanvas.height = height;

        // Draw source image
        this.ctx.drawImage(source, 0, 0, width, height);

        // Step 1: Heavy Gaussian blur
        if (AI_CONFIG.debug.logProcessing) {
            console.log('[ImageProcessor] Applying Gaussian blur...');
        }
        await this.applyGaussianBlur(config.blurRadius, config.blurPasses);

        // Step 2: Posterize
        if (AI_CONFIG.debug.logProcessing) {
            console.log('[ImageProcessor] Applying posterization...');
        }
        this.applyPosterize(config.posterizeLevels);

        // Step 3: Color match to palette
        if (palette && AI_CONFIG.debug.logProcessing) {
            console.log('[ImageProcessor] Applying color matching...');
        }
        if (palette) {
            this.applyColorMatch(palette, config.colorMatchStrength);
        }

        // Get final image data
        const imageData = this.ctx.getImageData(0, 0, width, height);

        // Generate flow field from luminance
        const flowField = this.generateFlowField(imageData);

        // Extract dominant colors
        const dominantColors = this.extractDominantColors(imageData, 5);

        const elapsedTime = performance.now() - startTime;

        if (AI_CONFIG.debug.showTiming) {
            console.log(`[ImageProcessor] Processing completed in ${elapsedTime.toFixed(2)}ms`);
        }

        return {
            canvas: this.canvas,
            imageData,
            flowField,
            dominantColors,
            width,
            height,
            elapsedTime,
        };
    }

    /**
     * Apply Gaussian blur using box blur approximation
     * @param {number} radius - Blur radius
     * @param {number} passes - Number of passes (more = better approximation)
     */
    async applyGaussianBlur(radius, passes = 3) {
        // Box blur approximation of Gaussian blur
        // Multiple passes converge to Gaussian
        const boxRadius = Math.ceil(radius / passes);

        for (let i = 0; i < passes; i++) {
            await this.boxBlurHorizontal(boxRadius);
            await this.boxBlurVertical(boxRadius);
        }
    }

    /**
     * Horizontal box blur pass
     * @param {number} radius - Blur radius
     */
    async boxBlurHorizontal(radius) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = imageData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;

        const output = new Uint8ClampedArray(pixels.length);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0;
                let count = 0;

                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = Math.max(0, Math.min(width - 1, x + dx));
                    const idx = (y * width + nx) * 4;
                    r += pixels[idx];
                    g += pixels[idx + 1];
                    b += pixels[idx + 2];
                    a += pixels[idx + 3];
                    count++;
                }

                const outIdx = (y * width + x) * 4;
                output[outIdx] = r / count;
                output[outIdx + 1] = g / count;
                output[outIdx + 2] = b / count;
                output[outIdx + 3] = a / count;
            }
        }

        imageData.data.set(output);
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Vertical box blur pass
     * @param {number} radius - Blur radius
     */
    async boxBlurVertical(radius) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = imageData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;

        const output = new Uint8ClampedArray(pixels.length);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0;
                let count = 0;

                for (let dy = -radius; dy <= radius; dy++) {
                    const ny = Math.max(0, Math.min(height - 1, y + dy));
                    const idx = (ny * width + x) * 4;
                    r += pixels[idx];
                    g += pixels[idx + 1];
                    b += pixels[idx + 2];
                    a += pixels[idx + 3];
                    count++;
                }

                const outIdx = (y * width + x) * 4;
                output[outIdx] = r / count;
                output[outIdx + 1] = g / count;
                output[outIdx + 2] = b / count;
                output[outIdx + 3] = a / count;
            }
        }

        imageData.data.set(output);
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Apply posterization (reduce color levels)
     * @param {number} levels - Number of color levels per channel
     */
    applyPosterize(levels) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = imageData.data;

        const step = 255 / (levels - 1);

        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = Math.round(pixels[i] / step) * step;
            pixels[i + 1] = Math.round(pixels[i + 1] / step) * step;
            pixels[i + 2] = Math.round(pixels[i + 2] / step) * step;
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Apply color matching to current palette
     * @param {Object} palette - Color palette with base, accent1, accent2, anchor
     * @param {number} strength - Matching strength (0-1)
     */
    applyColorMatch(palette, strength) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = imageData.data;

        // Convert palette to array of RGB colors (0-255)
        const paletteColors = [
            palette.anchor,
            palette.base,
            palette.accent1,
            palette.accent2,
        ].map(c => ({
            r: Math.round(c.r * 255),
            g: Math.round(c.g * 255),
            b: Math.round(c.b * 255),
        }));

        for (let i = 0; i < pixels.length; i += 4) {
            const pixelColor = {
                r: pixels[i],
                g: pixels[i + 1],
                b: pixels[i + 2],
            };

            // Find closest palette color
            let closestColor = paletteColors[0];
            let closestDistance = this.colorDistance(pixelColor, closestColor);

            for (let j = 1; j < paletteColors.length; j++) {
                const distance = this.colorDistance(pixelColor, paletteColors[j]);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestColor = paletteColors[j];
                }
            }

            // Blend original with matched color based on strength
            pixels[i] = this.lerp(pixels[i], closestColor.r, strength);
            pixels[i + 1] = this.lerp(pixels[i + 1], closestColor.g, strength);
            pixels[i + 2] = this.lerp(pixels[i + 2], closestColor.b, strength);
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate flow field from image luminance
     * @param {ImageData} imageData - Source image data
     * @returns {Float32Array} Flow field as angle data
     */
    generateFlowField(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const pixels = imageData.data;

        // Calculate luminance for each pixel
        const luminance = new Float32Array(width * height);
        for (let i = 0; i < luminance.length; i++) {
            const idx = i * 4;
            luminance[i] = (
                pixels[idx] * 0.299 +
                pixels[idx + 1] * 0.587 +
                pixels[idx + 2] * 0.114
            ) / 255;
        }

        // Calculate gradients for flow field
        const flowField = new Float32Array(width * height * 2);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;

                // Sobel operator for gradient
                let gx = 0, gy = 0;

                if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                    gx = (
                        luminance[(y - 1) * width + (x + 1)] -
                        luminance[(y - 1) * width + (x - 1)] +
                        2 * luminance[y * width + (x + 1)] -
                        2 * luminance[y * width + (x - 1)] +
                        luminance[(y + 1) * width + (x + 1)] -
                        luminance[(y + 1) * width + (x - 1)]
                    );

                    gy = (
                        luminance[(y + 1) * width + (x - 1)] -
                        luminance[(y - 1) * width + (x - 1)] +
                        2 * luminance[(y + 1) * width + x] -
                        2 * luminance[(y - 1) * width + x] +
                        luminance[(y + 1) * width + (x + 1)] -
                        luminance[(y - 1) * width + (x + 1)]
                    );
                }

                // Store flow direction (perpendicular to gradient)
                flowField[idx * 2] = -gy;
                flowField[idx * 2 + 1] = gx;
            }
        }

        return flowField;
    }

    /**
     * Extract dominant colors from image
     * @param {ImageData} imageData - Source image data
     * @param {number} count - Number of colors to extract
     * @returns {Array} Array of dominant colors
     */
    extractDominantColors(imageData, count = 5) {
        const pixels = imageData.data;
        const colorCounts = new Map();

        // Quantize colors and count occurrences
        for (let i = 0; i < pixels.length; i += 4) {
            // Quantize to reduce unique colors
            const r = Math.round(pixels[i] / 32) * 32;
            const g = Math.round(pixels[i + 1] / 32) * 32;
            const b = Math.round(pixels[i + 2] / 32) * 32;

            const key = `${r},${g},${b}`;
            colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
        }

        // Sort by frequency
        const sorted = [...colorCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, count);

        return sorted.map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            return {
                r: r / 255,
                g: g / 255,
                b: b / 255,
            };
        });
    }

    /**
     * Calculate distance between two colors
     * @param {Object} c1 - First color
     * @param {Object} c2 - Second color
     * @returns {number} Distance
     */
    colorDistance(c1, c2) {
        // Weighted Euclidean distance (approximates perceptual difference)
        const rDiff = c1.r - c2.r;
        const gDiff = c1.g - c2.g;
        const bDiff = c1.b - c2.b;

        return Math.sqrt(
            2 * rDiff * rDiff +
            4 * gDiff * gDiff +
            3 * bDiff * bDiff
        );
    }

    /**
     * Linear interpolation
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Get the processed canvas
     * @returns {HTMLCanvasElement}
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * Create procedural noise texture (fallback)
     * @param {number} width - Texture width
     * @param {number} height - Texture height
     * @param {Object} palette - Color palette
     * @returns {Object} Generated texture data
     */
    createProceduralNoise(width, height, palette) {
        this.canvas.width = width;
        this.canvas.height = height;

        const imageData = this.ctx.createImageData(width, height);
        const pixels = imageData.data;

        const scale = AI_CONFIG.fallback.noiseScale;
        const octaves = AI_CONFIG.fallback.noiseOctaves;

        // Convert palette to array
        const paletteColors = palette ? [
            palette.anchor,
            palette.base,
            palette.accent1,
            palette.accent2,
        ].map(c => ({
            r: Math.round(c.r * 255),
            g: Math.round(c.g * 255),
            b: Math.round(c.b * 255),
        })) : [
            { r: 50, g: 50, b: 80 },
            { r: 100, g: 120, b: 180 },
            { r: 150, g: 100, b: 130 },
            { r: 80, g: 160, b: 140 },
        ];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;

                // Generate multi-octave noise
                let noise = 0;
                let amplitude = 1;
                let frequency = scale;
                let maxValue = 0;

                for (let o = 0; o < octaves; o++) {
                    noise += this.simplex2D(x * frequency, y * frequency) * amplitude;
                    maxValue += amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }

                noise = (noise / maxValue + 1) / 2; // Normalize to 0-1

                // Map noise to palette color
                const colorIdx = Math.floor(noise * paletteColors.length);
                const color = paletteColors[Math.min(colorIdx, paletteColors.length - 1)];

                pixels[idx] = color.r;
                pixels[idx + 1] = color.g;
                pixels[idx + 2] = color.b;
                pixels[idx + 3] = 255;
            }
        }

        this.ctx.putImageData(imageData, 0, 0);

        // Apply blur to smooth the noise
        this.applyGaussianBlur(20, 2);

        return {
            canvas: this.canvas,
            imageData: this.ctx.getImageData(0, 0, width, height),
            flowField: this.generateFlowField(this.ctx.getImageData(0, 0, width, height)),
            dominantColors: paletteColors.map(c => ({
                r: c.r / 255,
                g: c.g / 255,
                b: c.b / 255,
            })),
            width,
            height,
            isProcedural: true,
        };
    }

    /**
     * Simple 2D simplex noise approximation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} Noise value (-1 to 1)
     */
    simplex2D(x, y) {
        // Simple hash-based noise (not true simplex, but fast)
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }

    /**
     * Cleanup resources
     */
    dispose() {
        // Clear canvas references
        this.canvas = null;
        this.ctx = null;
        this.tempCanvas = null;
        this.tempCtx = null;
    }
}

export default ImageProcessor;
