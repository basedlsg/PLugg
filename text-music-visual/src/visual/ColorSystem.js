/**
 * ColorSystem.js
 * OKLAB color space management with smooth transitions
 *
 * Features:
 * - OKLAB color space for perceptually uniform transitions
 * - Maximum 4 active hues
 * - Constant anchor color
 * - Audio-reactive palette shifts
 */

export class ColorSystem {
    constructor(options = {}) {
        this.options = {
            maxActiveHues: 4,
            transitionSpeed: 0.5,
            anchorColor: { l: 0.2, a: 0.0, b: -0.05 },
            ...options
        };

        // Current palette in OKLAB space
        this.palette = {
            anchor: { ...this.options.anchorColor },
            base: { l: 0.6, a: 0.1, b: 0.2 },
            accent1: { l: 0.7, a: -0.1, b: 0.15 },
            accent2: { l: 0.65, a: 0.15, b: -0.1 }
        };

        // Target palette for smooth transitions
        this.targetPalette = this.clonePalette(this.palette);

        // Color history for generating harmonious palettes
        this.colorHistory = [];
        this.maxHistory = 10;

        // Hue offset based on chord root
        this.hueOffset = 0;
        this.targetHueOffset = 0;

        // Precomputed harmony angles (in OKLAB a/b plane)
        this.harmonyAngles = {
            complementary: Math.PI,
            triadic: [2 * Math.PI / 3, 4 * Math.PI / 3],
            analogous: [Math.PI / 6, -Math.PI / 6],
            splitComplementary: [5 * Math.PI / 6, 7 * Math.PI / 6]
        };
    }

    update(deltaTime, audioParams = {}) {
        // Update hue offset based on chord root
        if (audioParams.chordRoot !== undefined) {
            this.targetHueOffset = (audioParams.chordRoot / 12) * Math.PI * 2;
        }

        // Smooth hue offset transition
        const hueSpeed = this.options.transitionSpeed * deltaTime;
        this.hueOffset = this.lerpAngle(this.hueOffset, this.targetHueOffset, hueSpeed);

        // Generate new target palette based on audio
        if (audioParams.energy !== undefined || audioParams.centroid !== undefined) {
            this.generateTargetPalette(audioParams);
        }

        // Smooth transition to target palette
        const speed = this.options.transitionSpeed * deltaTime;
        this.transitionPalette(speed);
    }

    generateTargetPalette(audioParams) {
        const energy = audioParams.energy || 0;
        const centroid = audioParams.centroid || 0.5;

        // Base color: affected by centroid (warm to cool)
        const baseAngle = this.hueOffset + centroid * Math.PI;
        const baseChroma = 0.1 + energy * 0.1;
        this.targetPalette.base = {
            l: 0.5 + energy * 0.2,
            a: Math.cos(baseAngle) * baseChroma,
            b: Math.sin(baseAngle) * baseChroma
        };

        // Accent 1: analogous color
        const accent1Angle = baseAngle + this.harmonyAngles.analogous[0];
        const accent1Chroma = baseChroma * 1.2;
        this.targetPalette.accent1 = {
            l: 0.6 + energy * 0.15,
            a: Math.cos(accent1Angle) * accent1Chroma,
            b: Math.sin(accent1Angle) * accent1Chroma
        };

        // Accent 2: split complementary
        const accent2Angle = baseAngle + this.harmonyAngles.splitComplementary[0];
        const accent2Chroma = baseChroma * 0.8;
        this.targetPalette.accent2 = {
            l: 0.55 + energy * 0.1,
            a: Math.cos(accent2Angle) * accent2Chroma,
            b: Math.sin(accent2Angle) * accent2Chroma
        };
    }

    transitionPalette(speed) {
        for (const key of ['base', 'accent1', 'accent2']) {
            this.palette[key].l = this.lerp(
                this.palette[key].l, this.targetPalette[key].l, speed
            );
            this.palette[key].a = this.lerp(
                this.palette[key].a, this.targetPalette[key].a, speed
            );
            this.palette[key].b = this.lerp(
                this.palette[key].b, this.targetPalette[key].b, speed
            );
        }
    }

    getCurrentPalette() {
        // Convert OKLAB palette to RGB
        return {
            anchor: this.oklabToRgb(this.palette.anchor),
            base: this.oklabToRgb(this.palette.base),
            accent1: this.oklabToRgb(this.palette.accent1),
            accent2: this.oklabToRgb(this.palette.accent2)
        };
    }

    // Set a specific color in the palette
    setColor(name, oklabColor) {
        if (name in this.targetPalette && name !== 'anchor') {
            this.targetPalette[name] = { ...oklabColor };
        }
    }

    // Set anchor color (constant background)
    setAnchorColor(oklabColor) {
        this.palette.anchor = { ...oklabColor };
        this.options.anchorColor = { ...oklabColor };
    }

    // Get interpolated color between palette colors
    getInterpolatedColor(t) {
        t = Math.max(0, Math.min(1, t));

        const colors = [
            this.palette.anchor,
            this.palette.base,
            this.palette.accent1,
            this.palette.accent2
        ];

        const segment = t * (colors.length - 1);
        const index = Math.floor(segment);
        const fraction = segment - index;

        if (index >= colors.length - 1) {
            return this.oklabToRgb(colors[colors.length - 1]);
        }

        const c1 = colors[index];
        const c2 = colors[index + 1];

        const interpolated = {
            l: this.lerp(c1.l, c2.l, fraction),
            a: this.lerp(c1.a, c2.a, fraction),
            b: this.lerp(c1.b, c2.b, fraction)
        };

        return this.oklabToRgb(interpolated);
    }

    // ========================================================================
    // OKLAB <-> RGB CONVERSION
    // ========================================================================

    oklabToRgb(oklab) {
        // OKLAB to linear sRGB
        const l_ = oklab.l + 0.3963377774 * oklab.a + 0.2158037573 * oklab.b;
        const m_ = oklab.l - 0.1055613458 * oklab.a - 0.0638541728 * oklab.b;
        const s_ = oklab.l - 0.0894841775 * oklab.a - 1.2914855480 * oklab.b;

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        // Linear sRGB
        let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        let b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

        // Apply sRGB gamma
        r = this.linearToSrgb(r);
        g = this.linearToSrgb(g);
        b = this.linearToSrgb(b);

        // Clamp
        return {
            r: Math.max(0, Math.min(1, r)),
            g: Math.max(0, Math.min(1, g)),
            b: Math.max(0, Math.min(1, b))
        };
    }

    rgbToOklab(rgb) {
        // sRGB to linear
        const r = this.srgbToLinear(rgb.r);
        const g = this.srgbToLinear(rgb.g);
        const b = this.srgbToLinear(rgb.b);

        const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
        const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
        const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

        const l_ = Math.cbrt(l);
        const m_ = Math.cbrt(m);
        const s_ = Math.cbrt(s);

        return {
            l: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
            a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
            b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
        };
    }

    linearToSrgb(x) {
        if (x <= 0.0031308) {
            return x * 12.92;
        }
        return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    }

    srgbToLinear(x) {
        if (x <= 0.04045) {
            return x / 12.92;
        }
        return Math.pow((x + 0.055) / 1.055, 2.4);
    }

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================

    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    lerpAngle(a, b, t) {
        // Handle angle wrapping
        let diff = b - a;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return a + diff * t;
    }

    clonePalette(palette) {
        return {
            anchor: { ...palette.anchor },
            base: { ...palette.base },
            accent1: { ...palette.accent1 },
            accent2: { ...palette.accent2 }
        };
    }

    // Get color as hex string
    rgbToHex(rgb) {
        const r = Math.round(rgb.r * 255);
        const g = Math.round(rgb.g * 255);
        const b = Math.round(rgb.b * 255);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // Create color from hex string
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return { r: 0, g: 0, b: 0 };

        return {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        };
    }

    // Generate complementary color
    getComplementary(oklabColor) {
        return {
            l: oklabColor.l,
            a: -oklabColor.a,
            b: -oklabColor.b
        };
    }

    // Generate triadic colors
    getTriadic(oklabColor) {
        const angle = Math.atan2(oklabColor.b, oklabColor.a);
        const chroma = Math.sqrt(oklabColor.a * oklabColor.a + oklabColor.b * oklabColor.b);

        return this.harmonyAngles.triadic.map(offset => ({
            l: oklabColor.l,
            a: Math.cos(angle + offset) * chroma,
            b: Math.sin(angle + offset) * chroma
        }));
    }

    // Get color temperature (warm vs cool)
    getTemperature(oklabColor) {
        // Positive b is warm, negative is cool
        return oklabColor.b;
    }

    // Adjust saturation (chroma in OKLAB)
    adjustChroma(oklabColor, factor) {
        return {
            l: oklabColor.l,
            a: oklabColor.a * factor,
            b: oklabColor.b * factor
        };
    }

    // Adjust lightness
    adjustLightness(oklabColor, delta) {
        return {
            l: Math.max(0, Math.min(1, oklabColor.l + delta)),
            a: oklabColor.a,
            b: oklabColor.b
        };
    }

    // Reset palette to defaults
    reset() {
        this.palette = {
            anchor: { ...this.options.anchorColor },
            base: { l: 0.6, a: 0.1, b: 0.2 },
            accent1: { l: 0.7, a: -0.1, b: 0.15 },
            accent2: { l: 0.65, a: 0.15, b: -0.1 }
        };
        this.targetPalette = this.clonePalette(this.palette);
        this.hueOffset = 0;
        this.targetHueOffset = 0;
    }
}

export default ColorSystem;
