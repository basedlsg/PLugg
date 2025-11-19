/**
 * AI Image Layer Configuration
 * API keys, timing constants, and generation parameters
 */

export const AI_CONFIG = {
    // API Configuration
    api: {
        // fal.ai endpoint for FLUX.1 schnell
        falEndpoint: 'https://fal.run/fal-ai/flux/schnell',
        // API key (should be set via environment variable in production)
        falApiKey: process.env.FAL_API_KEY || '',
        // Request timeout in milliseconds
        requestTimeout: 30000,
        // Number of retry attempts
        maxRetries: 2,
        // Delay between retries in milliseconds
        retryDelay: 1000,
    },

    // Generation Timing
    timing: {
        // Minimum time between generations (milliseconds)
        minInterval: 10000,
        // Stability time before generation (milliseconds)
        stabilityThreshold: 5000,
        // Crossfade duration (milliseconds)
        crossfadeDuration: 3000,
        // Queue processing interval (milliseconds)
        queueInterval: 100,
        // Maximum queue size
        maxQueueSize: 3,
    },

    // Trigger Thresholds
    triggers: {
        // Semantic shift threshold (0-1)
        semanticShiftThreshold: 0.3,
        // Energy threshold for apex detection
        apexEnergyThreshold: 0.8,
        // Sentiment threshold for apex detection
        apexSentimentThreshold: 0.7,
        // Combined apex threshold
        apexCombinedThreshold: 1.4,
        // Minimum parameter change to trigger regeneration
        parameterChangeThreshold: 0.15,
    },

    // Image Generation
    generation: {
        // Default image dimensions
        width: 1024,
        height: 1024,
        // Number of inference steps
        numInferenceSteps: 4,
        // Guidance scale (CFG)
        guidanceScale: 3.5,
        // Output format
        outputFormat: 'jpeg',
        // JPEG quality (0-100)
        jpegQuality: 85,
    },

    // Image Processing
    processing: {
        // Gaussian blur radius
        blurRadius: 40,
        // Number of blur passes
        blurPasses: 3,
        // Posterize color levels
        posterizeLevels: 8,
        // Color match strength (0-1)
        colorMatchStrength: 0.7,
        // Output resolution multiplier
        outputScale: 1,
    },

    // Texture Display
    display: {
        // Target opacity for AI texture (0-1)
        targetOpacity: 0.25,
        // Minimum opacity
        minOpacity: 0,
        // Maximum opacity
        maxOpacity: 0.35,
        // Flow field influence strength
        flowFieldStrength: 0.5,
        // Particle color sample influence
        particleColorInfluence: 0.3,
    },

    // Cache Configuration
    cache: {
        // Maximum number of cached images
        maxCachedImages: 10,
        // Cache entry TTL (milliseconds)
        cacheTTL: 300000, // 5 minutes
        // Enable persistent cache
        persistentCache: false,
        // Hash function for parameter keys
        hashPrecision: 2, // decimal places
    },

    // Fallback Configuration
    fallback: {
        // Use procedural noise when AI unavailable
        useProceduralNoise: true,
        // Procedural noise scale
        noiseScale: 0.02,
        // Procedural noise octaves
        noiseOctaves: 4,
        // Continue with current image on slow response
        continueOnSlow: true,
        // Slow response threshold (milliseconds)
        slowThreshold: 15000,
        // Preloaded texture count for offline mode
        preloadedTextureCount: 5,
    },

    // Color Palette Names (for prompt construction)
    paletteNames: {
        // Hue ranges mapped to color names (hue in degrees)
        ranges: [
            { min: 0, max: 30, names: ['red', 'crimson', 'scarlet'] },
            { min: 30, max: 60, names: ['orange', 'amber', 'tangerine'] },
            { min: 60, max: 90, names: ['yellow', 'gold', 'lemon'] },
            { min: 90, max: 150, names: ['green', 'lime', 'emerald'] },
            { min: 150, max: 210, names: ['cyan', 'teal', 'aqua'] },
            { min: 210, max: 270, names: ['blue', 'azure', 'cobalt'] },
            { min: 270, max: 330, names: ['purple', 'violet', 'magenta'] },
            { min: 330, max: 360, names: ['red', 'crimson', 'rose'] },
        ],
        // Lightness modifiers
        lightness: {
            dark: ['deep', 'dark', 'rich'],
            medium: ['vivid', 'bright', 'clear'],
            light: ['pale', 'soft', 'pastel'],
        },
        // Saturation modifiers
        saturation: {
            low: ['muted', 'dusty', 'subtle'],
            medium: ['balanced', 'natural', 'true'],
            high: ['vibrant', 'saturated', 'intense'],
        },
    },

    // Debug Options
    debug: {
        // Log generation events
        logGenerations: false,
        // Log processing steps
        logProcessing: false,
        // Show timing information
        showTiming: false,
        // Save generated images to disk
        saveImages: false,
        // Save path for debug images
        savePath: '/tmp/ai-textures/',
    },
};

// Environment variable overrides
if (typeof window !== 'undefined' && window.AI_CONFIG_OVERRIDE) {
    Object.assign(AI_CONFIG, window.AI_CONFIG_OVERRIDE);
}

export default AI_CONFIG;
