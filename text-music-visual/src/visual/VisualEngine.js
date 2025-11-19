/**
 * VisualEngine.js
 * Main Three.js setup and render loop for raymarched SDF visual system
 *
 * Layer Hierarchy:
 * - Layer 0: Raymarched SDF Background (PRIMARY)
 * - Layer 1: AI Texture (ATMOSPHERIC)
 * - Layer 2: GPU Particles (PUNCTUATION)
 * - Layer 3: Post-Processing
 */

import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { AudioAnalyzer } from './AudioAnalyzer.js';
import { ColorSystem } from './ColorSystem.js';

// Import shaders
import sdfShaderSource from './shaders/sdf.glsl';
import postprocessShaderSource from './shaders/postprocess.glsl';

export class VisualEngine {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.options = {
            targetFPS: 60,
            maxParticles: 20000,
            bloomPasses: 3,
            ...options
        };

        // State
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.elapsedTime = 0;

        // Audio-visual parameters with envelope smoothing
        this.audioParams = {
            rmsEnergy: 0,
            spectralCentroid: 0,
            spectralFlux: 0,
            onsetIntensity: 0,
            chordRoot: 0
        };

        // Envelope settings (in seconds)
        this.envelopes = {
            rmsEnergy: { attack: 0.05, release: 0.5, current: 0 },
            spectralCentroid: { attack: 0.1, release: 1.0, current: 0 },
            spectralFlux: { attack: 0.05, release: 0.8, current: 0 },
            onsetIntensity: { attack: 0.01, release: 0.3, current: 0 },
            chordRoot: { attack: 0.2, release: 2.0, current: 0 }
        };

        // Metaball configuration
        this.metaballs = [];
        this.initMetaballs(6);

        // Initialize systems
        this.init();
    }

    init() {
        this.initRenderer();
        this.initScene();
        this.initCamera();
        this.initRenderTargets();
        this.initSDFMaterial();
        this.initPostProcessing();
        this.initParticleSystem();
        this.initColorSystem();
        this.initAudioAnalyzer();

        // Handle resize
        window.addEventListener('resize', () => this.onResize());
        this.onResize();
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false,
            alpha: false,
            powerPreference: 'high-performance'
        });

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
    }

    initScene() {
        this.scene = new THREE.Scene();

        // Fullscreen quad for SDF rendering
        this.sdfQuad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            null // Material set in initSDFMaterial
        );
        this.sdfQuad.frustumCulled = false;
        this.scene.add(this.sdfQuad);
    }

    initCamera() {
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }

    initRenderTargets() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        const rtOptions = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.HalfFloatType
        };

        // Main render target
        this.mainRT = new THREE.WebGLRenderTarget(width, height, rtOptions);

        // Bloom render targets (ping-pong)
        this.bloomRT1 = new THREE.WebGLRenderTarget(width / 2, height / 2, rtOptions);
        this.bloomRT2 = new THREE.WebGLRenderTarget(width / 2, height / 2, rtOptions);

        // Feedback render targets (ping-pong)
        this.feedbackRT1 = new THREE.WebGLRenderTarget(width, height, rtOptions);
        this.feedbackRT2 = new THREE.WebGLRenderTarget(width, height, rtOptions);
        this.currentFeedbackRT = this.feedbackRT1;
        this.previousFeedbackRT = this.feedbackRT2;
    }

    initSDFMaterial() {
        // Default metaball positions
        const metaballPositions = new Array(8).fill(null).map(() => new THREE.Vector3());
        const metaballRadii = new Array(8).fill(0.5);

        this.sdfMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: sdfShaderSource,
            uniforms: {
                uResolution: { value: new THREE.Vector2() },
                uTime: { value: 0 },
                uRmsEnergy: { value: 0 },
                uSpectralCentroid: { value: 0 },
                uSpectralFlux: { value: 0 },
                uOnsetIntensity: { value: 0 },
                uChordRoot: { value: 0 },
                uBaseColor: { value: new THREE.Color(0.2, 0.5, 0.8) },
                uAccentColor1: { value: new THREE.Color(0.9, 0.3, 0.5) },
                uAccentColor2: { value: new THREE.Color(0.3, 0.8, 0.5) },
                uAnchorColor: { value: new THREE.Color(0.1, 0.1, 0.2) },
                uMetaballPositions: { value: metaballPositions },
                uMetaballRadii: { value: metaballRadii },
                uMetaballCount: { value: 6 }
            }
        });

        this.sdfQuad.material = this.sdfMaterial;
    }

    initPostProcessing() {
        // Post-processing quad
        this.postQuad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            new THREE.ShaderMaterial({
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = vec4(position, 1.0);
                    }
                `,
                fragmentShader: postprocessShaderSource,
                uniforms: {
                    uMainTexture: { value: null },
                    uFeedbackTexture: { value: null },
                    uBloomTexture: { value: null },
                    uResolution: { value: new THREE.Vector2() },
                    uTime: { value: 0 },
                    uBloomIntensity: { value: 0.3 },
                    uGrainIntensity: { value: 0.03 },
                    uVignetteIntensity: { value: 1.2 },
                    uFeedbackDecay: { value: 0.85 },
                    uRmsEnergy: { value: 0 },
                    uOnsetIntensity: { value: 0 },
                    uSaturation: { value: 1.1 },
                    uContrast: { value: 1.05 },
                    uBrightness: { value: 1.0 },
                    uColorBalance: { value: new THREE.Vector3(1, 1, 1) }
                }
            })
        );
        this.postQuad.frustumCulled = false;

        // Separate scene for post-processing
        this.postScene = new THREE.Scene();
        this.postScene.add(this.postQuad);

        // Bloom blur material
        this.bloomBlurMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                uniform sampler2D uTexture;
                uniform vec2 uDirection;
                uniform vec2 uResolution;
                varying vec2 vUv;

                void main() {
                    vec4 sum = vec4(0.0);
                    vec2 texelSize = 1.0 / uResolution;

                    // 9-tap Gaussian blur
                    sum += texture2D(uTexture, vUv - 4.0 * texelSize * uDirection) * 0.0162;
                    sum += texture2D(uTexture, vUv - 3.0 * texelSize * uDirection) * 0.0540;
                    sum += texture2D(uTexture, vUv - 2.0 * texelSize * uDirection) * 0.1216;
                    sum += texture2D(uTexture, vUv - 1.0 * texelSize * uDirection) * 0.1945;
                    sum += texture2D(uTexture, vUv) * 0.2270;
                    sum += texture2D(uTexture, vUv + 1.0 * texelSize * uDirection) * 0.1945;
                    sum += texture2D(uTexture, vUv + 2.0 * texelSize * uDirection) * 0.1216;
                    sum += texture2D(uTexture, vUv + 3.0 * texelSize * uDirection) * 0.0540;
                    sum += texture2D(uTexture, vUv + 4.0 * texelSize * uDirection) * 0.0162;

                    gl_FragColor = sum;
                }
            `,
            uniforms: {
                uTexture: { value: null },
                uDirection: { value: new THREE.Vector2(1, 0) },
                uResolution: { value: new THREE.Vector2() }
            }
        });

        this.bloomQuad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            this.bloomBlurMaterial
        );
        this.bloomQuad.frustumCulled = false;

        this.bloomScene = new THREE.Scene();
        this.bloomScene.add(this.bloomQuad);
    }

    initParticleSystem() {
        // GPU particle system using compute shaders (if supported)
        // Fallback to simpler particle system for compatibility

        const particleCount = this.options.maxParticles;
        const geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const lifetimes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Random initial positions
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

            // Random velocities
            velocities[i * 3] = (Math.random() - 0.5) * 0.1;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

            // Colors (will be updated from ColorSystem)
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;

            // Sizes
            sizes[i] = Math.random() * 2 + 0.5;

            // Lifetimes
            lifetimes[i] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));

        const particleMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                attribute vec3 velocity;
                attribute vec3 color;
                attribute float size;
                attribute float lifetime;

                uniform float uTime;
                uniform float uSpectralFlux;

                varying vec3 vColor;
                varying float vLifetime;

                void main() {
                    vColor = color;
                    vLifetime = lifetime;

                    vec3 pos = position;

                    // Flow field motion
                    float t = uTime * 0.5 + lifetime * 6.28;
                    pos += velocity * sin(t) * (1.0 + uSpectralFlux);

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vLifetime;

                void main() {
                    // Circular particle
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center);
                    if (dist > 0.5) discard;

                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    alpha *= vLifetime;

                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            uniforms: {
                uTime: { value: 0 },
                uSpectralFlux: { value: 0 }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, particleMaterial);
        this.particles.frustumCulled = false;

        // Create separate scene for particles (Layer 2)
        this.particleScene = new THREE.Scene();
        this.particleCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
        this.particleCamera.position.z = 5;
        this.particleScene.add(this.particles);
    }

    initColorSystem() {
        this.colorSystem = new ColorSystem({
            maxActiveHues: 4,
            anchorColor: { l: 0.2, a: 0.0, b: -0.05 } // Dark blue anchor
        });
    }

    initAudioAnalyzer() {
        this.audioAnalyzer = new AudioAnalyzer({
            fftSize: 2048,
            smoothingTimeConstant: 0.8
        });
    }

    initMetaballs(count) {
        for (let i = 0; i < count; i++) {
            this.metaballs.push({
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 4
                ),
                radius: Math.random() * 0.5 + 0.3,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5
                )
            });
        }
    }

    // Connect audio source
    async connectAudio(audioElement) {
        await this.audioAnalyzer.connect(audioElement);
    }

    // Start render loop
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.render();
    }

    // Stop render loop
    stop() {
        this.isRunning = false;
    }

    // Main render loop
    render() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.render());

        // Calculate delta time
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        this.elapsedTime += this.deltaTime;

        // Update systems
        this.updateAudioParams();
        this.updateMetaballs();
        this.updateColors();
        this.updateUniforms();

        // Render passes
        this.renderSDF();
        this.renderParticles();
        this.renderBloom();
        this.renderPostProcess();

        // Swap feedback buffers
        [this.currentFeedbackRT, this.previousFeedbackRT] =
            [this.previousFeedbackRT, this.currentFeedbackRT];
    }

    updateAudioParams() {
        // Get raw audio features
        const features = this.audioAnalyzer.getFeatures();

        // Apply envelope smoothing to each parameter
        for (const [key, envelope] of Object.entries(this.envelopes)) {
            const target = features[key] || 0;
            const current = envelope.current;

            // Determine if attacking or releasing
            const isAttacking = target > current;
            const rate = isAttacking ? envelope.attack : envelope.release;

            // Exponential smoothing
            const alpha = 1 - Math.exp(-this.deltaTime / rate);
            envelope.current = current + (target - current) * alpha;

            this.audioParams[key] = envelope.current;
        }
    }

    updateMetaballs() {
        const bounds = 3;

        for (let i = 0; i < this.metaballs.length; i++) {
            const ball = this.metaballs[i];

            // Update position
            ball.position.add(ball.velocity.clone().multiplyScalar(this.deltaTime));

            // Bounce off bounds
            for (const axis of ['x', 'y', 'z']) {
                if (Math.abs(ball.position[axis]) > bounds) {
                    ball.velocity[axis] *= -1;
                    ball.position[axis] = Math.sign(ball.position[axis]) * bounds;
                }
            }

            // Audio-reactive radius
            ball.currentRadius = ball.radius * (1 + this.audioParams.rmsEnergy * 0.3);
        }

        // Update shader uniforms
        const positions = this.sdfMaterial.uniforms.uMetaballPositions.value;
        const radii = this.sdfMaterial.uniforms.uMetaballRadii.value;

        for (let i = 0; i < this.metaballs.length; i++) {
            positions[i].copy(this.metaballs[i].position);
            radii[i] = this.metaballs[i].currentRadius || this.metaballs[i].radius;
        }
    }

    updateColors() {
        // Update color system based on audio
        this.colorSystem.update(this.deltaTime, {
            chordRoot: this.audioParams.chordRoot,
            energy: this.audioParams.rmsEnergy,
            centroid: this.audioParams.spectralCentroid
        });

        // Get current palette
        const palette = this.colorSystem.getCurrentPalette();

        // Update shader colors
        this.sdfMaterial.uniforms.uBaseColor.value.setRGB(
            palette.base.r, palette.base.g, palette.base.b
        );
        this.sdfMaterial.uniforms.uAccentColor1.value.setRGB(
            palette.accent1.r, palette.accent1.g, palette.accent1.b
        );
        this.sdfMaterial.uniforms.uAccentColor2.value.setRGB(
            palette.accent2.r, palette.accent2.g, palette.accent2.b
        );
        this.sdfMaterial.uniforms.uAnchorColor.value.setRGB(
            palette.anchor.r, palette.anchor.g, palette.anchor.b
        );

        // Update particle colors
        this.updateParticleColors(palette);
    }

    updateParticleColors(palette) {
        const colors = this.particles.geometry.attributes.color.array;
        const particleCount = colors.length / 3;

        for (let i = 0; i < particleCount; i++) {
            // Cycle through palette colors
            const colorIndex = i % 3;
            let color;

            switch (colorIndex) {
                case 0: color = palette.base; break;
                case 1: color = palette.accent1; break;
                case 2: color = palette.accent2; break;
            }

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        this.particles.geometry.attributes.color.needsUpdate = true;
    }

    updateUniforms() {
        const uniforms = this.sdfMaterial.uniforms;

        uniforms.uTime.value = this.elapsedTime;
        uniforms.uRmsEnergy.value = this.audioParams.rmsEnergy;
        uniforms.uSpectralCentroid.value = this.audioParams.spectralCentroid;
        uniforms.uSpectralFlux.value = this.audioParams.spectralFlux;
        uniforms.uOnsetIntensity.value = this.audioParams.onsetIntensity;
        uniforms.uChordRoot.value = this.audioParams.chordRoot;

        // Post-process uniforms
        const postUniforms = this.postQuad.material.uniforms;
        postUniforms.uTime.value = this.elapsedTime;
        postUniforms.uRmsEnergy.value = this.audioParams.rmsEnergy;
        postUniforms.uOnsetIntensity.value = this.audioParams.onsetIntensity;
        postUniforms.uBloomIntensity.value = 0.3 + this.audioParams.rmsEnergy * 0.5;

        // Particle uniforms
        this.particles.material.uniforms.uTime.value = this.elapsedTime;
        this.particles.material.uniforms.uSpectralFlux.value = this.audioParams.spectralFlux;
    }

    renderSDF() {
        // Render SDF to main render target
        this.renderer.setRenderTarget(this.mainRT);
        this.renderer.render(this.scene, this.camera);
    }

    renderParticles() {
        // Composite particles onto main render target
        // (In production, this would use proper compositing)
        this.renderer.setRenderTarget(this.mainRT);
        this.renderer.render(this.particleScene, this.particleCamera);
    }

    renderBloom() {
        const blurMaterial = this.bloomQuad.material;

        // Horizontal blur
        blurMaterial.uniforms.uTexture.value = this.mainRT.texture;
        blurMaterial.uniforms.uDirection.value.set(1, 0);
        blurMaterial.uniforms.uResolution.value.set(
            this.bloomRT1.width, this.bloomRT1.height
        );

        this.renderer.setRenderTarget(this.bloomRT1);
        this.renderer.render(this.bloomScene, this.camera);

        // Vertical blur
        blurMaterial.uniforms.uTexture.value = this.bloomRT1.texture;
        blurMaterial.uniforms.uDirection.value.set(0, 1);

        this.renderer.setRenderTarget(this.bloomRT2);
        this.renderer.render(this.bloomScene, this.camera);
    }

    renderPostProcess() {
        const postUniforms = this.postQuad.material.uniforms;

        postUniforms.uMainTexture.value = this.mainRT.texture;
        postUniforms.uFeedbackTexture.value = this.previousFeedbackRT.texture;
        postUniforms.uBloomTexture.value = this.bloomRT2.texture;
        postUniforms.uResolution.value.set(
            this.canvas.width, this.canvas.height
        );

        // Render to feedback buffer
        this.renderer.setRenderTarget(this.currentFeedbackRT);
        this.renderer.render(this.postScene, this.camera);

        // Render to screen
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.postScene, this.camera);
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.renderer.setSize(width, height);

        // Update render targets
        this.mainRT.setSize(width, height);
        this.feedbackRT1.setSize(width, height);
        this.feedbackRT2.setSize(width, height);
        this.bloomRT1.setSize(width / 2, height / 2);
        this.bloomRT2.setSize(width / 2, height / 2);

        // Update shader uniforms
        this.sdfMaterial.uniforms.uResolution.value.set(width, height);
        this.postQuad.material.uniforms.uResolution.value.set(width, height);

        // Update particle camera
        this.particleCamera.aspect = width / height;
        this.particleCamera.updateProjectionMatrix();
    }

    // Set chord root (0-11 for chromatic scale)
    setChordRoot(root) {
        this.audioParams.chordRoot = root;
    }

    // Manual parameter overrides
    setParameter(name, value) {
        if (name in this.audioParams) {
            this.audioParams[name] = value;
        }
    }

    // Cleanup
    dispose() {
        this.stop();

        this.mainRT.dispose();
        this.bloomRT1.dispose();
        this.bloomRT2.dispose();
        this.feedbackRT1.dispose();
        this.feedbackRT2.dispose();

        this.sdfMaterial.dispose();
        this.postQuad.material.dispose();
        this.bloomBlurMaterial.dispose();
        this.particles.material.dispose();
        this.particles.geometry.dispose();

        this.renderer.dispose();

        if (this.audioAnalyzer) {
            this.audioAnalyzer.dispose();
        }
    }
}

export default VisualEngine;
