// Raymarched SDF Fragment Shader
// Layer 0: Primary visual system (80% of visuals)

precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uRmsEnergy;
uniform float uSpectralCentroid;
uniform float uSpectralFlux;
uniform float uOnsetIntensity;
uniform float uChordRoot;
uniform vec3 uBaseColor;
uniform vec3 uAccentColor1;
uniform vec3 uAccentColor2;
uniform vec3 uAnchorColor;

// Metaball positions (up to 8)
uniform vec3 uMetaballPositions[8];
uniform float uMetaballRadii[8];
uniform int uMetaballCount;

varying vec2 vUv;

// Constants
const int MAX_STEPS = 100;
const float MAX_DIST = 100.0;
const float SURF_DIST = 0.001;
const float PI = 3.14159265359;

// ============================================================================
// NOISE FUNCTIONS
// ============================================================================

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Fractal Brownian Motion
float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}

// ============================================================================
// SDF PRIMITIVES
// ============================================================================

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

// Smooth minimum for organic blending (metaballs)
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// ============================================================================
// SCENE DEFINITION
// ============================================================================

// Noise displacement amount based on audio
float getDisplacement(vec3 p) {
    float noiseScale = 1.5 + uSpectralCentroid * 2.0;
    float noiseAmp = 0.3 + uRmsEnergy * 0.5;

    // Layer multiple noise octaves
    float displacement = fbm(p * noiseScale + uTime * 0.1, 4) * noiseAmp;

    // Add reaction-diffusion-like patterns
    float rd = sin(p.x * 4.0 + uTime) * sin(p.y * 4.0 + uTime * 0.7) * sin(p.z * 4.0 + uTime * 0.3);
    displacement += rd * 0.1 * uSpectralFlux;

    return displacement;
}

float sceneSDF(vec3 p) {
    // Global scale based on RMS energy
    float scale = 1.0 + uRmsEnergy * 0.3;
    vec3 scaledP = p / scale;

    // Initialize with far distance
    float d = MAX_DIST;

    // Metaballs with smooth blending
    float smoothness = 0.8 + uRmsEnergy * 0.4;

    for (int i = 0; i < 8; i++) {
        if (i >= uMetaballCount) break;

        vec3 pos = uMetaballPositions[i];
        float radius = uMetaballRadii[i] * (1.0 + uRmsEnergy * 0.2);

        // Animate metaball positions
        pos.x += sin(uTime * 0.5 + float(i) * 1.3) * 0.5;
        pos.y += cos(uTime * 0.4 + float(i) * 0.9) * 0.3;
        pos.z += sin(uTime * 0.3 + float(i) * 1.7) * 0.4;

        float sphere = sdSphere(scaledP - pos, radius);
        d = smin(d, sphere, smoothness);
    }

    // Central organic form
    vec3 centralP = scaledP;
    centralP.xy *= mat2(cos(uTime * 0.1), sin(uTime * 0.1), -sin(uTime * 0.1), cos(uTime * 0.1));

    float central = sdSphere(centralP, 1.5);

    // Add torus for structure
    vec3 torusP = centralP;
    torusP.xz *= mat2(cos(uTime * 0.15), sin(uTime * 0.15), -sin(uTime * 0.15), cos(uTime * 0.15));
    float torus = sdTorus(torusP, vec2(2.0, 0.3 + uRmsEnergy * 0.2));

    central = smin(central, torus, smoothness);
    d = smin(d, central, smoothness * 1.5);

    // Apply noise displacement
    d += getDisplacement(scaledP);

    // Onset inversion effect
    if (uOnsetIntensity > 0.5) {
        d = -d * uOnsetIntensity;
    }

    return d * scale;
}

// ============================================================================
// RAYMARCHING
// ============================================================================

vec3 getNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        sceneSDF(p + e.xyy) - sceneSDF(p - e.xyy),
        sceneSDF(p + e.yxy) - sceneSDF(p - e.yxy),
        sceneSDF(p + e.yyx) - sceneSDF(p - e.yyx)
    ));
}

float raymarch(vec3 ro, vec3 rd) {
    float d = 0.0;

    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * d;
        float ds = sceneSDF(p);
        d += ds;

        if (ds < SURF_DIST || d > MAX_DIST) break;
    }

    return d;
}

// Ambient occlusion
float calcAO(vec3 p, vec3 n) {
    float occ = 0.0;
    float sca = 1.0;

    for (int i = 0; i < 5; i++) {
        float h = 0.01 + 0.12 * float(i) / 4.0;
        float d = sceneSDF(p + h * n);
        occ += (h - d) * sca;
        sca *= 0.95;
    }

    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}

// Soft shadows
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
    float res = 1.0;
    float t = mint;

    for (int i = 0; i < 32; i++) {
        if (t >= maxt) break;
        float h = sceneSDF(ro + rd * t);
        if (h < 0.001) return 0.0;
        res = min(res, k * h / t);
        t += h;
    }

    return res;
}

// ============================================================================
// LIGHTING & COLOR
// ============================================================================

vec3 palette(float t) {
    // Mix between uniform colors based on chord root
    float hueShift = uChordRoot / 12.0;

    vec3 a = uAnchorColor;
    vec3 b = uBaseColor;
    vec3 c = uAccentColor1;
    vec3 d = uAccentColor2;

    // Smooth transitions
    t = fract(t + hueShift);

    if (t < 0.25) {
        return mix(a, b, t * 4.0);
    } else if (t < 0.5) {
        return mix(b, c, (t - 0.25) * 4.0);
    } else if (t < 0.75) {
        return mix(c, d, (t - 0.5) * 4.0);
    } else {
        return mix(d, a, (t - 0.75) * 4.0);
    }
}

vec3 render(vec3 ro, vec3 rd) {
    float d = raymarch(ro, rd);

    // Background gradient
    vec3 col = mix(
        uAnchorColor * 0.1,
        uBaseColor * 0.2,
        rd.y * 0.5 + 0.5
    );

    if (d < MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 n = getNormal(p);

        // Multiple light setup
        vec3 lightDir1 = normalize(vec3(1.0, 1.0, 1.0));
        vec3 lightDir2 = normalize(vec3(-0.5, 0.5, -0.3));
        vec3 lightCol1 = uAccentColor1;
        vec3 lightCol2 = uAccentColor2;

        // Diffuse lighting
        float diff1 = max(dot(n, lightDir1), 0.0);
        float diff2 = max(dot(n, lightDir2), 0.0);

        // Specular
        vec3 viewDir = normalize(-rd);
        vec3 halfDir1 = normalize(lightDir1 + viewDir);
        vec3 halfDir2 = normalize(lightDir2 + viewDir);
        float spec1 = pow(max(dot(n, halfDir1), 0.0), 32.0);
        float spec2 = pow(max(dot(n, halfDir2), 0.0), 32.0);

        // Fresnel
        float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);

        // Ambient occlusion
        float ao = calcAO(p, n);

        // Soft shadows
        float shadow1 = softShadow(p + n * 0.02, lightDir1, 0.02, 5.0, 16.0);
        float shadow2 = softShadow(p + n * 0.02, lightDir2, 0.02, 5.0, 16.0);

        // Surface color based on position and normals
        vec3 surfaceCol = palette(dot(n, vec3(0.0, 1.0, 0.0)) * 0.5 + p.y * 0.1 + uTime * 0.02);

        // Combine lighting
        col = surfaceCol * 0.1; // Ambient
        col += surfaceCol * diff1 * lightCol1 * shadow1 * 0.6;
        col += surfaceCol * diff2 * lightCol2 * shadow2 * 0.4;
        col += spec1 * lightCol1 * 0.3;
        col += spec2 * lightCol2 * 0.2;
        col += fresnel * uAccentColor1 * 0.3;
        col *= ao;

        // Distance fog
        float fog = 1.0 - exp(-d * 0.05);
        col = mix(col, uAnchorColor * 0.1, fog);
    }

    // Onset flash
    col = mix(col, vec3(1.0), uOnsetIntensity * 0.3);

    return col;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;

    // Camera setup
    float camDist = 8.0 - uRmsEnergy * 2.0;
    vec3 ro = vec3(
        sin(uTime * 0.1) * camDist,
        2.0 + sin(uTime * 0.15) * 1.0,
        cos(uTime * 0.1) * camDist
    );

    vec3 target = vec3(0.0, 0.0, 0.0);
    vec3 forward = normalize(target - ro);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up = cross(forward, right);

    vec3 rd = normalize(forward + uv.x * right + uv.y * up);

    vec3 col = render(ro, rd);

    // Gamma correction
    col = pow(col, vec3(0.4545));

    gl_FragColor = vec4(col, 1.0);
}
