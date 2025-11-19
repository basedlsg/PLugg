// Post-Processing Fragment Shader
// Layer 3: Bloom, grain, vignette, color grading, feedback trails

precision highp float;

uniform sampler2D uMainTexture;
uniform sampler2D uFeedbackTexture;
uniform sampler2D uBloomTexture;
uniform vec2 uResolution;
uniform float uTime;
uniform float uBloomIntensity;
uniform float uGrainIntensity;
uniform float uVignetteIntensity;
uniform float uFeedbackDecay;
uniform float uRmsEnergy;
uniform float uOnsetIntensity;

// Color grading uniforms
uniform float uSaturation;
uniform float uContrast;
uniform float uBrightness;
uniform vec3 uColorBalance;

varying vec2 vUv;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Random function for grain
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// ============================================================================
// BLOOM
// ============================================================================

vec3 sampleBloom(vec2 uv) {
    vec3 bloom = vec3(0.0);
    float total = 0.0;

    // Multi-pass blur sampling
    const int samples = 8;
    const float radius = 0.01;

    for (int x = -samples; x <= samples; x++) {
        for (int y = -samples; y <= samples; y++) {
            vec2 offset = vec2(float(x), float(y)) * radius;
            float weight = 1.0 / (1.0 + length(vec2(x, y)));
            bloom += texture2D(uBloomTexture, uv + offset).rgb * weight;
            total += weight;
        }
    }

    return bloom / total;
}

// ============================================================================
// COLOR GRADING
// ============================================================================

vec3 adjustSaturation(vec3 color, float saturation) {
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(vec3(luminance), color, saturation);
}

vec3 adjustContrast(vec3 color, float contrast) {
    return (color - 0.5) * contrast + 0.5;
}

vec3 applyColorBalance(vec3 color, vec3 balance) {
    // Simple lift/gamma/gain style color balance
    return color * balance;
}

// ACES Filmic Tone Mapping
vec3 acesFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// ============================================================================
// VIGNETTE
// ============================================================================

float vignette(vec2 uv, float intensity) {
    vec2 centered = uv - 0.5;
    float dist = length(centered);
    float vig = 1.0 - smoothstep(0.3, 0.9, dist * intensity);
    return vig;
}

// ============================================================================
// FILM GRAIN
// ============================================================================

vec3 applyGrain(vec3 color, vec2 uv, float intensity) {
    float grain = random(uv + fract(uTime * 0.1)) * 2.0 - 1.0;

    // Make grain more visible in darker areas
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    float grainMask = 1.0 - luminance * 0.5;

    return color + grain * intensity * grainMask;
}

// ============================================================================
// CHROMATIC ABERRATION
// ============================================================================

vec3 chromaticAberration(sampler2D tex, vec2 uv, float amount) {
    vec2 center = uv - 0.5;
    float dist = length(center);
    vec2 dir = normalize(center + 0.0001);

    float r = texture2D(tex, uv + dir * amount * dist).r;
    float g = texture2D(tex, uv).g;
    float b = texture2D(tex, uv - dir * amount * dist).b;

    return vec3(r, g, b);
}

// ============================================================================
// FEEDBACK / TRAILS
// ============================================================================

vec3 applyFeedback(vec3 current, vec2 uv, float decay) {
    // Slight zoom and rotate for trails
    vec2 feedbackUv = uv - 0.5;
    feedbackUv *= 0.99; // Zoom in slightly
    feedbackUv = vec2(
        feedbackUv.x * cos(0.002) - feedbackUv.y * sin(0.002),
        feedbackUv.x * sin(0.002) + feedbackUv.y * cos(0.002)
    ); // Slight rotation
    feedbackUv += 0.5;

    vec3 feedback = texture2D(uFeedbackTexture, feedbackUv).rgb;

    return mix(current, max(current, feedback), decay);
}

// ============================================================================
// SCANLINES (Optional retro effect)
// ============================================================================

float scanlines(vec2 uv, float intensity) {
    float scanline = sin(uv.y * uResolution.y * 2.0) * 0.5 + 0.5;
    return 1.0 - (1.0 - scanline) * intensity;
}

// ============================================================================
// MAIN
// ============================================================================

void main() {
    vec2 uv = vUv;

    // Sample main texture with chromatic aberration on onsets
    float caAmount = uOnsetIntensity * 0.005;
    vec3 color = chromaticAberration(uMainTexture, uv, caAmount);

    // Apply feedback trails
    color = applyFeedback(color, uv, uFeedbackDecay);

    // Apply bloom
    vec3 bloom = sampleBloom(uv);
    float bloomAmount = uBloomIntensity * (1.0 + uRmsEnergy * 0.5);
    color += bloom * bloomAmount;

    // Color grading
    color = adjustSaturation(color, uSaturation);
    color = adjustContrast(color, uContrast);
    color *= uBrightness;
    color = applyColorBalance(color, uColorBalance);

    // Tone mapping
    color = acesFilm(color);

    // Vignette
    float vig = vignette(uv, uVignetteIntensity);
    color *= vig;

    // Film grain
    color = applyGrain(color, uv, uGrainIntensity);

    // Optional scanlines (subtle)
    // color *= scanlines(uv, 0.02);

    // Gamma correction
    color = pow(color, vec3(1.0 / 2.2));

    // Clamp output
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
}
