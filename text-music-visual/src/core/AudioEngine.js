/**
 * AudioEngine.js
 * Wraps Strudel and the world synth for continuous playback
 *
 * Features:
 * - Strudel pattern management
 * - World synth registration
 * - Continuous drone with parameter morphing
 * - Audio analysis output for visual reactivity
 */

import eventBus, { Events } from './EventBus.js';

export class AudioEngine {
    constructor(options = {}) {
        this.options = {
            defaultScale: 'yo',
            bpm: 60,
            ...options
        };

        // Audio context
        this.audioContext = null;
        this.isInitialized = false;

        // Strudel reference
        this.strudel = null;
        this.repl = null;
        this.hap = null;

        // Current state
        this.currentParameters = {
            brilliance: 0.5,
            motion: 0.3,
            space: 0.3,
            warmth: 0.5,
            drift: 0.2
        };
        this.currentScale = this.options.defaultScale;
        this.isPlaying = false;

        // Audio output for analysis
        this.outputNode = null;
        this.analyserSource = null;
    }

    /**
     * Initialize audio engine
     * Requires user gesture to be called first
     * @returns {Promise} Resolves when initialized
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Create AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Resume if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Create output node for analysis
            this.outputNode = this.audioContext.createGain();
            this.outputNode.connect(this.audioContext.destination);

            // Load Strudel
            await this.loadStrudel();

            // Register world synth
            await this.registerWorldSynth();

            this.isInitialized = true;

            eventBus.emit(Events.AUDIO_INITIALIZED, {
                audioContext: this.audioContext,
                outputNode: this.outputNode
            });

            return this.audioContext;

        } catch (error) {
            console.error('AudioEngine initialization failed:', error);
            eventBus.emit(Events.ERROR, {
                source: 'AudioEngine',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Load Strudel library
     */
    async loadStrudel() {
        try {
            // Import Strudel modules
            const [
                { controls },
                { evaluate, getAudioContext, setAudioContext },
                { registerSynthSounds, registerSynth }
            ] = await Promise.all([
                import('@strudel/core'),
                import('@strudel/mini'),
                import('@strudel/webaudio')
            ]);

            // Set our audio context
            setAudioContext(this.audioContext);

            // Store references
            this.strudel = { controls, evaluate, registerSynth };

            // Register standard synth sounds
            registerSynthSounds();

            console.log('Strudel loaded successfully');

        } catch (error) {
            console.error('Failed to load Strudel:', error);
            throw error;
        }
    }

    /**
     * Register world instrument synths
     */
    async registerWorldSynth() {
        try {
            // Import world synth registration
            const worldModule = await import('@strudel/world-instruments');

            if (worldModule.registerWorldSynths) {
                worldModule.registerWorldSynths();
                console.log('World synths registered');
            } else {
                console.warn('registerWorldSynths not found, using fallback');
                this.registerFallbackSynth();
            }

        } catch (error) {
            console.warn('Using fallback synth:', error.message);
            this.registerFallbackSynth();
        }
    }

    /**
     * Fallback synth registration if world-instruments not available
     */
    registerFallbackSynth() {
        if (!this.strudel) return;

        // Register a simple pad synth as fallback
        this.strudel.registerSynth?.('world', (t, value, onended) => {
            const ctx = this.audioContext;
            const {
                note = 60,
                duration = 1,
                brilliance = 0.5,
                motion = 0.3,
                space = 0.3,
                warmth = 0.5,
                drift = 0.2
            } = value;

            const freq = 440 * Math.pow(2, (note - 69) / 12);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.value = freq;

            filter.type = 'lowpass';
            filter.frequency.value = 400 + brilliance * 8000;
            filter.Q.value = warmth * 5;

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
            gain.gain.setValueAtTime(0.3, t + duration);
            gain.gain.linearRampToValueAtTime(0, t + duration + 0.3);

            osc.connect(filter);
            filter.connect(gain);

            osc.start(t);
            osc.stop(t + duration + 0.5);
            osc.onended = onended;

            return {
                node: gain,
                stop: (time) => osc.stop(time)
            };
        });
    }

    /**
     * Get the audio output node for analysis
     * @returns {AudioNode} Output node
     */
    getOutputNode() {
        return this.outputNode;
    }

    /**
     * Start the continuous drone
     */
    async startDrone() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.isPlaying) return;

        try {
            // Create the drone pattern
            const pattern = this.createDronePattern();

            // Evaluate the pattern
            if (this.strudel && this.strudel.evaluate) {
                this.repl = await this.strudel.evaluate(pattern);
            }

            this.isPlaying = true;
            console.log('Drone started');

        } catch (error) {
            console.error('Failed to start drone:', error);
            eventBus.emit(Events.ERROR, {
                source: 'AudioEngine',
                error: 'Failed to start drone: ' + error.message
            });
        }
    }

    /**
     * Create the drone pattern
     * @returns {string} Strudel pattern code
     */
    createDronePattern() {
        const { brilliance, motion, space, warmth, drift } = this.currentParameters;
        const scale = this.currentScale;

        // Create a continuous, evolving drone pattern
        return `
            // Root drone - always present
            note("c2 g2".slow(8))
                .s("world")
                .scale("${scale}")
                .brilliance(${brilliance.toFixed(3)})
                .motion(${motion.toFixed(3)})
                .space(${space.toFixed(3)})
                .warmth(${warmth.toFixed(3)})
                .drift(${drift.toFixed(3)})
                .release(2)
                .gain(0.4)

            // Melodic layer - sparse notes
            .add(
                note("c3 e3 g3 a3".slow(16))
                    .s("world")
                    .scale("${scale}")
                    .brilliance(${(brilliance * 1.2).toFixed(3)})
                    .motion(${(motion * 0.8).toFixed(3)})
                    .space(${(space * 1.1).toFixed(3)})
                    .warmth(${warmth.toFixed(3)})
                    .drift(${drift.toFixed(3)})
                    .release(1.5)
                    .gain(0.25)
            )
        `;
    }

    /**
     * Update synth parameters (triggers morph)
     * @param {Object} params - New parameters
     */
    updateParameters(params) {
        this.currentParameters = {
            ...this.currentParameters,
            ...params
        };

        // Restart pattern with new parameters
        if (this.isPlaying) {
            this.refreshPattern();
        }
    }

    /**
     * Update scale
     * @param {string|Array} scale - Scale name or array of scale names
     */
    updateScale(scale) {
        this.currentScale = Array.isArray(scale) ? scale[0] : scale;

        if (this.isPlaying) {
            this.refreshPattern();
        }
    }

    /**
     * Refresh the playing pattern with current parameters
     */
    async refreshPattern() {
        if (!this.strudel || !this.strudel.evaluate) return;

        try {
            const pattern = this.createDronePattern();
            this.repl = await this.strudel.evaluate(pattern);
        } catch (error) {
            console.error('Failed to refresh pattern:', error);
        }
    }

    /**
     * Stop the drone
     */
    stopDrone() {
        if (this.repl && this.repl.stop) {
            this.repl.stop();
        }
        this.isPlaying = false;
        console.log('Drone stopped');
    }

    /**
     * Trigger a one-shot note
     * @param {Object} noteConfig - Note configuration
     */
    async playNote(noteConfig) {
        if (!this.strudel || !this.strudel.evaluate) return;

        const {
            note = 'c3',
            duration = 0.5,
            ...params
        } = noteConfig;

        const synthParams = { ...this.currentParameters, ...params };

        const pattern = `
            note("${note}")
                .s("world")
                .scale("${this.currentScale}")
                .brilliance(${synthParams.brilliance.toFixed(3)})
                .motion(${synthParams.motion.toFixed(3)})
                .space(${synthParams.space.toFixed(3)})
                .warmth(${synthParams.warmth.toFixed(3)})
                .drift(${synthParams.drift.toFixed(3)})
                .release(${duration})
                .gain(0.35)
        `;

        try {
            await this.strudel.evaluate(pattern);
        } catch (error) {
            console.error('Failed to play note:', error);
        }
    }

    /**
     * Get current parameters
     * @returns {Object} Current synth parameters
     */
    getParameters() {
        return { ...this.currentParameters };
    }

    /**
     * Get audio context
     * @returns {AudioContext} The audio context
     */
    getAudioContext() {
        return this.audioContext;
    }

    /**
     * Check if initialized
     * @returns {boolean} Initialization state
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Cleanup
     */
    dispose() {
        this.stopDrone();

        if (this.outputNode) {
            this.outputNode.disconnect();
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        this.isInitialized = false;
    }
}

// Factory function
export function createAudioEngine(options = {}) {
    return new AudioEngine(options);
}

export default AudioEngine;
