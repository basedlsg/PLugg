/**
 * PromptBuilder.js
 * Parameter-to-prompt conversion for AI image generation
 */

import { AI_CONFIG } from './config.js';

export class PromptBuilder {
    constructor(options = {}) {
        this.options = options;
        this.paletteConfig = AI_CONFIG.paletteNames;

        // Texture descriptors based on complexity
        this.textureDescriptors = {
            minimal: ['minimal', 'simple', 'clean', 'sparse', 'open'],
            moderate: ['balanced', 'organic', 'natural', 'gentle', 'subtle'],
            intricate: ['intricate', 'complex', 'detailed', 'layered', 'rich'],
        };

        // Energy descriptors based on motion
        this.energyDescriptors = {
            serene: ['serene', 'calm', 'peaceful', 'still', 'tranquil'],
            moderate: ['flowing', 'moving', 'drifting', 'shifting', 'breathing'],
            dynamic: ['dynamic', 'energetic', 'vibrant', 'intense', 'swirling'],
        };

        // Warmth descriptors
        this.warmthDescriptors = {
            cool: ['cool', 'cold', 'icy', 'crisp', 'winter'],
            neutral: ['neutral', 'balanced', 'natural', 'earthen', 'muted'],
            warm: ['warm', 'cozy', 'golden', 'sunset', 'amber'],
        };

        // Space descriptors
        this.spaceDescriptors = {
            intimate: ['intimate', 'close', 'near', 'cozy', 'enclosed'],
            moderate: ['balanced', 'natural', 'organic', 'comfortable'],
            expansive: ['expansive', 'vast', 'open', 'spacious', 'infinite'],
        };

        // Base prompt template
        this.baseTemplate = 'abstract {texture} {energy} texture {colors} flowing organic forms painterly blur atmosphere';

        // Negative prompt (things to avoid)
        this.negativePrompt = '--no text faces objects sharp details people animals architecture buildings letters numbers symbols logos brands';
    }

    /**
     * Build a prompt from visual parameters
     * @param {Object} params - Visual parameters
     * @returns {string} Generated prompt
     */
    buildPrompt(params) {
        const colors = this.getColorNames(params.colorHue || 0.5, params.warmth || 0.5);
        const texture = this.getTextureDescriptor(params.complexity || 0.5);
        const energy = this.getEnergyDescriptor(params.motion || 0.5);

        // Build base prompt
        let prompt = this.baseTemplate
            .replace('{texture}', texture)
            .replace('{energy}', energy)
            .replace('{colors}', colors.join(' '));

        // Add warmth context
        const warmthDesc = this.getWarmthDescriptor(params.warmth || 0.5);
        prompt += ` ${warmthDesc}`;

        // Add space context
        const spaceDesc = this.getSpaceDescriptor(params.space || 0.5);
        prompt += ` ${spaceDesc}`;

        // Add semantic context if available
        if (params.semanticCategory) {
            const semanticPrompt = this.getSemanticPrompt(params.semanticCategory);
            if (semanticPrompt) {
                prompt += ` ${semanticPrompt}`;
            }
        }

        // Add sentiment context
        if (params.sentiment !== undefined) {
            const sentimentPrompt = this.getSentimentPrompt(params.sentiment);
            if (sentimentPrompt) {
                prompt += ` ${sentimentPrompt}`;
            }
        }

        // Add negative prompt
        prompt += ` ${this.negativePrompt}`;

        return prompt.trim().replace(/\s+/g, ' ');
    }

    /**
     * Get color names from hue and warmth
     * @param {number} hue - Hue value (0-1)
     * @param {number} warmth - Warmth value (0-1)
     * @returns {Array<string>} Color names
     */
    getColorNames(hue, warmth) {
        // Convert hue to degrees
        const hueDegrees = hue * 360;

        // Find matching color range
        let colorNames = ['blue', 'azure']; // Default

        for (const range of this.paletteConfig.ranges) {
            if (hueDegrees >= range.min && hueDegrees < range.max) {
                colorNames = [...range.names];
                break;
            }
        }

        // Select based on warmth
        const colorIndex = Math.floor(warmth * (colorNames.length - 0.01));

        // Return primary and a variation
        const primary = colorNames[colorIndex];
        const secondary = colorNames[(colorIndex + 1) % colorNames.length];

        return [primary, secondary];
    }

    /**
     * Get OKLAB palette color names
     * @param {Object} palette - OKLAB palette with base, accent1, accent2
     * @returns {Array<string>} Color names
     */
    getOklabPaletteNames(palette) {
        const colorNames = [];

        if (palette.base) {
            colorNames.push(this.oklabToColorName(palette.base));
        }
        if (palette.accent1) {
            colorNames.push(this.oklabToColorName(palette.accent1));
        }
        if (palette.accent2) {
            colorNames.push(this.oklabToColorName(palette.accent2));
        }

        // Remove duplicates
        return [...new Set(colorNames)];
    }

    /**
     * Convert OKLAB color to color name
     * @param {Object} oklab - OKLAB color {l, a, b}
     * @returns {string} Color name
     */
    oklabToColorName(oklab) {
        // Calculate hue from a/b
        const hue = Math.atan2(oklab.b, oklab.a);
        const hueDegrees = ((hue * 180 / Math.PI) + 360) % 360;

        // Calculate chroma
        const chroma = Math.sqrt(oklab.a * oklab.a + oklab.b * oklab.b);

        // Find base color name
        let baseName = 'gray';
        for (const range of this.paletteConfig.ranges) {
            if (hueDegrees >= range.min && hueDegrees < range.max) {
                baseName = range.names[0];
                break;
            }
        }

        // Add lightness modifier
        let lightnessModifier = '';
        if (oklab.l < 0.4) {
            const modifiers = this.paletteConfig.lightness.dark;
            lightnessModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        } else if (oklab.l > 0.7) {
            const modifiers = this.paletteConfig.lightness.light;
            lightnessModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        }

        // Add saturation modifier for low chroma
        if (chroma < 0.05) {
            const modifiers = this.paletteConfig.saturation.low;
            const satMod = modifiers[Math.floor(Math.random() * modifiers.length)];
            return `${satMod} ${baseName}`;
        }

        return lightnessModifier ? `${lightnessModifier} ${baseName}` : baseName;
    }

    /**
     * Get texture descriptor based on complexity
     * @param {number} complexity - Complexity value (0-1)
     * @returns {string} Texture descriptor
     */
    getTextureDescriptor(complexity) {
        if (complexity < 0.35) {
            return this.randomChoice(this.textureDescriptors.minimal);
        } else if (complexity < 0.65) {
            return this.randomChoice(this.textureDescriptors.moderate);
        } else {
            return this.randomChoice(this.textureDescriptors.intricate);
        }
    }

    /**
     * Get energy descriptor based on motion
     * @param {number} motion - Motion value (0-1)
     * @returns {string} Energy descriptor
     */
    getEnergyDescriptor(motion) {
        if (motion < 0.35) {
            return this.randomChoice(this.energyDescriptors.serene);
        } else if (motion < 0.65) {
            return this.randomChoice(this.energyDescriptors.moderate);
        } else {
            return this.randomChoice(this.energyDescriptors.dynamic);
        }
    }

    /**
     * Get warmth descriptor
     * @param {number} warmth - Warmth value (0-1)
     * @returns {string} Warmth descriptor
     */
    getWarmthDescriptor(warmth) {
        if (warmth < 0.35) {
            return this.randomChoice(this.warmthDescriptors.cool);
        } else if (warmth < 0.65) {
            return this.randomChoice(this.warmthDescriptors.neutral);
        } else {
            return this.randomChoice(this.warmthDescriptors.warm);
        }
    }

    /**
     * Get space descriptor
     * @param {number} space - Space value (0-1)
     * @returns {string} Space descriptor
     */
    getSpaceDescriptor(space) {
        if (space < 0.35) {
            return this.randomChoice(this.spaceDescriptors.intimate);
        } else if (space < 0.65) {
            return this.randomChoice(this.spaceDescriptors.moderate);
        } else {
            return this.randomChoice(this.spaceDescriptors.expansive);
        }
    }

    /**
     * Get semantic category prompt enhancement
     * @param {string} category - Semantic category
     * @returns {string} Semantic prompt addition
     */
    getSemanticPrompt(category) {
        const semanticPrompts = {
            water: 'aquatic fluid rippling reflective',
            fire: 'fiery volcanic smoldering smoky',
            earth: 'earthy rocky mineral crystalline',
            light: 'luminous glowing radiant ethereal',
            shadow: 'shadowy mysterious deep nocturnal',
            love: 'soft gentle tender harmonious',
            loss: 'melancholic faded weathered aged',
            air: 'airy misty cloudy vaporous',
            time: 'cyclical spiral repeating eternal',
        };

        return semanticPrompts[category] || '';
    }

    /**
     * Get sentiment prompt enhancement
     * @param {number} sentiment - Sentiment value (-1 to 1)
     * @returns {string} Sentiment prompt addition
     */
    getSentimentPrompt(sentiment) {
        if (sentiment > 0.5) {
            return 'uplifting bright hopeful joyful';
        } else if (sentiment < -0.5) {
            return 'somber melancholic contemplative deep';
        } else if (sentiment < -0.2) {
            return 'subtle muted subdued quiet';
        } else if (sentiment > 0.2) {
            return 'pleasant balanced comfortable gentle';
        }
        return '';
    }

    /**
     * Build a minimal prompt for quick generation
     * @param {Object} params - Visual parameters
     * @returns {string} Minimal prompt
     */
    buildMinimalPrompt(params) {
        const colors = this.getColorNames(params.colorHue || 0.5, params.warmth || 0.5);
        return `abstract painterly texture ${colors[0]} flowing forms blur atmosphere ${this.negativePrompt}`;
    }

    /**
     * Create parameter hash for caching
     * @param {Object} params - Visual parameters
     * @returns {string} Hash string
     */
    createParameterHash(params) {
        const precision = AI_CONFIG.cache.hashPrecision;

        // Round parameters to reduce unique combinations
        const rounded = {
            h: Math.round((params.colorHue || 0) * Math.pow(10, precision)) / Math.pow(10, precision),
            m: Math.round((params.motion || 0) * Math.pow(10, precision)) / Math.pow(10, precision),
            c: Math.round((params.complexity || 0) * Math.pow(10, precision)) / Math.pow(10, precision),
            w: Math.round((params.warmth || 0) * Math.pow(10, precision)) / Math.pow(10, precision),
            s: Math.round((params.space || 0) * Math.pow(10, precision)) / Math.pow(10, precision),
        };

        return `${rounded.h}_${rounded.m}_${rounded.c}_${rounded.w}_${rounded.s}`;
    }

    /**
     * Random choice from array
     * @param {Array} array - Array to choose from
     * @returns {*} Random element
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

export default PromptBuilder;
