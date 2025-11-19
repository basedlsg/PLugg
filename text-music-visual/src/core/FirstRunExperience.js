/**
 * FirstRunExperience.js
 * The First Impression Designer
 *
 * Choreographs the first 10 seconds to create immediate wonder.
 *
 * Timeline:
 * 0-2s:  Screen already alive (ambient drone, gentle visuals)
 * 2-4s:  Sound evolves on its own (parameters drift)
 * 4-7s:  Contextual word appears and absorbs
 * 7-10s: Ready for user (input indicator appears)
 */

import eventBus, { Events } from './EventBus.js';

// =============================================================================
// CHOREOGRAPHY TIMELINE
// =============================================================================

const TIMELINE = {
    ALIVE: { start: 0, end: 2000 },           // Screen already alive
    EVOLVING: { start: 2000, end: 4000 },     // Sound evolves
    WORD_FADE_IN: { start: 4000, end: 5500 }, // Word fades in
    WORD_ABSORB: { start: 5500, end: 7000 },  // Word absorbs
    READY: { start: 7000, end: 10000 }        // Ready for user
};

// =============================================================================
// CONTEXTUAL WORD SELECTION
// =============================================================================

/**
 * Get a contextual word based on time of day
 * Creates an immediate personal connection
 */
function getTimeBasedWord() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'light';
    if (hour >= 17 && hour < 20) return 'dusk';
    if (hour >= 20 || hour < 5) return 'night';

    return 'stillness';
}

/**
 * Get a random poetic word as fallback
 */
function getPoeticWord() {
    const words = [
        'stillness', 'breath', 'wonder', 'drift', 'pulse',
        'shimmer', 'haze', 'glow', 'whisper', 'bloom',
        'tide', 'mist', 'aurora', 'eclipse', 'resonance'
    ];
    return words[Math.floor(Math.random() * words.length)];
}

/**
 * Main contextual word selector
 * Tries weather API first, falls back to time-based
 */
async function getContextualWord() {
    // Try to get weather-based word (with timeout)
    try {
        const weatherWord = await Promise.race([
            getWeatherBasedWord(),
            new Promise((_, reject) => setTimeout(() => reject('timeout'), 1000))
        ]);
        if (weatherWord) return weatherWord;
    } catch {
        // Silently fall back to time-based
    }

    // Time-based word as primary fallback
    return getTimeBasedWord();
}

/**
 * Get word based on weather conditions (optional enhancement)
 */
async function getWeatherBasedWord() {
    // Only attempt if navigator.geolocation is available
    if (!navigator.geolocation) return null;

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    // This would require a weather API key
                    // For now, return null to use time-based
                    resolve(null);
                } catch {
                    resolve(null);
                }
            },
            () => resolve(null),
            { timeout: 500 }
        );
    });
}

// =============================================================================
// FIRST RUN EXPERIENCE CLASS
// =============================================================================

export class FirstRunExperience {
    constructor(options = {}) {
        this.options = {
            skipOnReturn: true,        // Skip if user has visited before
            storageKey: 'tmv-first-run',
            enableWeatherWord: false,   // Weather API disabled by default
            ...options
        };

        // State
        this.isRunning = false;
        this.isComplete = false;
        this.hasUserGesture = false;
        this.startTime = 0;
        this.animationFrame = null;

        // DOM elements
        this.container = null;
        this.wordElement = null;
        this.cursorElement = null;
        this.anticipationOverlay = null;

        // Callbacks
        this.onPhaseChange = options.onPhaseChange || null;
        this.onComplete = options.onComplete || null;
        this.onWordSelected = options.onWordSelected || null;

        // Current phase
        this.currentPhase = 'waiting';
        this.contextWord = null;

        // Bind methods
        this.handleGesture = this.handleGesture.bind(this);
        this.update = this.update.bind(this);
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    /**
     * Check if this is a first-time visitor
     */
    isFirstRun() {
        if (!this.options.skipOnReturn) return true;

        try {
            return !localStorage.getItem(this.options.storageKey);
        } catch {
            return true;
        }
    }

    /**
     * Mark first run as complete
     */
    markComplete() {
        try {
            localStorage.setItem(this.options.storageKey, Date.now().toString());
        } catch {
            // Storage not available
        }
    }

    /**
     * Initialize the first run experience
     * Creates minimal DOM, sets up gesture capture
     */
    async initialize() {
        // Create invisible gesture capture layer
        this.createGestureCapture();

        // Pre-select contextual word
        this.contextWord = await getContextualWord();

        if (this.onWordSelected) {
            this.onWordSelected(this.contextWord);
        }

        // Emit ready event
        eventBus.emit('firstrun:initialized', {
            word: this.contextWord,
            isFirstRun: this.isFirstRun()
        });

        return this;
    }

    /**
     * Create invisible gesture capture layer
     * Captures first interaction to unlock audio without visible UI
     */
    createGestureCapture() {
        // Invisible full-screen capture layer
        this.anticipationOverlay = document.createElement('div');
        this.anticipationOverlay.id = 'first-run-gesture-capture';
        this.anticipationOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            cursor: default;
            background: transparent;
        `;

        document.body.appendChild(this.anticipationOverlay);

        // Add gesture listeners
        const events = ['click', 'touchstart', 'keydown'];
        events.forEach(event => {
            this.anticipationOverlay.addEventListener(event, this.handleGesture, { once: true });
        });
    }

    /**
     * Handle first user gesture
     * This unlocks audio context and starts the choreography
     */
    handleGesture(event) {
        if (this.hasUserGesture) return;

        // Prevent default for touch to avoid scroll
        if (event.type === 'touchstart') {
            event.preventDefault();
        }

        this.hasUserGesture = true;

        // Remove capture layer
        if (this.anticipationOverlay) {
            this.anticipationOverlay.remove();
            this.anticipationOverlay = null;
        }

        // Emit gesture event
        eventBus.emit(Events.USER_GESTURE, { event });
        eventBus.emit('firstrun:gesture', { type: event.type });

        // Start choreography
        this.start();
    }

    // =========================================================================
    // CHOREOGRAPHY
    // =========================================================================

    /**
     * Start the choreographed first 10 seconds
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startTime = performance.now();
        this.currentPhase = 'alive';

        // Create word display element
        this.createWordElement();

        // Create cursor/anticipation indicator
        this.createCursorElement();

        // Emit phase change
        this.emitPhaseChange('alive');

        // Start update loop
        this.animationFrame = requestAnimationFrame(this.update);

        console.log('First run experience started');
    }

    /**
     * Create the word display element
     */
    createWordElement() {
        this.wordElement = document.createElement('div');
        this.wordElement.id = 'first-run-word';
        this.wordElement.textContent = this.contextWord;
        this.wordElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 3rem;
            font-weight: 200;
            letter-spacing: 0.3em;
            color: rgba(255, 255, 255, 0);
            text-transform: lowercase;
            pointer-events: none;
            z-index: 100;
            transition: none;
            will-change: transform, opacity, color, filter;
        `;

        document.body.appendChild(this.wordElement);
    }

    /**
     * Create cursor/input anticipation indicator
     */
    createCursorElement() {
        this.cursorElement = document.createElement('div');
        this.cursorElement.id = 'first-run-cursor';
        this.cursorElement.style.cssText = `
            position: fixed;
            bottom: 15%;
            left: 50%;
            transform: translateX(-50%);
            width: 2px;
            height: 24px;
            background: rgba(255, 255, 255, 0);
            pointer-events: none;
            z-index: 100;
            will-change: opacity, background;
        `;

        document.body.appendChild(this.cursorElement);
    }

    /**
     * Main update loop - orchestrates the timeline
     */
    update(timestamp) {
        if (!this.isRunning) return;

        const elapsed = timestamp - this.startTime;

        // Determine current phase
        let newPhase = this.currentPhase;

        if (elapsed < TIMELINE.ALIVE.end) {
            newPhase = 'alive';
            this.updateAlivePhase(elapsed);
        } else if (elapsed < TIMELINE.EVOLVING.end) {
            newPhase = 'evolving';
            this.updateEvolvingPhase(elapsed - TIMELINE.EVOLVING.start);
        } else if (elapsed < TIMELINE.WORD_FADE_IN.end) {
            newPhase = 'word_fade_in';
            this.updateWordFadeInPhase(elapsed - TIMELINE.WORD_FADE_IN.start);
        } else if (elapsed < TIMELINE.WORD_ABSORB.end) {
            newPhase = 'word_absorb';
            this.updateWordAbsorbPhase(elapsed - TIMELINE.WORD_ABSORB.start);
        } else if (elapsed < TIMELINE.READY.end) {
            newPhase = 'ready';
            this.updateReadyPhase(elapsed - TIMELINE.READY.start);
        } else {
            // Choreography complete
            this.complete();
            return;
        }

        // Emit phase change if needed
        if (newPhase !== this.currentPhase) {
            this.currentPhase = newPhase;
            this.emitPhaseChange(newPhase);
        }

        // Continue loop
        this.animationFrame = requestAnimationFrame(this.update);
    }

    // =========================================================================
    // PHASE UPDATES
    // =========================================================================

    /**
     * Phase 0-2s: Screen already alive
     * Ambient drone playing, gentle visual movement
     */
    updateAlivePhase(elapsed) {
        const progress = elapsed / TIMELINE.ALIVE.end;

        // Emit parameter drift for subtle initial movement
        eventBus.emit('firstrun:drift', {
            phase: 'alive',
            progress,
            parameters: {
                space: 0.4 + Math.sin(elapsed * 0.001) * 0.05,
                warmth: 0.5 + Math.cos(elapsed * 0.0008) * 0.03,
                drift: 0.3
            }
        });
    }

    /**
     * Phase 2-4s: Sound evolves on its own
     * Parameters drift slightly, colors shift subtly
     */
    updateEvolvingPhase(elapsed) {
        const progress = elapsed / (TIMELINE.EVOLVING.end - TIMELINE.EVOLVING.start);

        // More active parameter drift
        const drift = {
            brilliance: 0.4 + Math.sin(elapsed * 0.002) * 0.1,
            motion: 0.3 + Math.cos(elapsed * 0.0015) * 0.1,
            space: 0.45 + Math.sin(elapsed * 0.001) * 0.08,
            warmth: 0.5 + Math.cos(elapsed * 0.0012) * 0.08
        };

        eventBus.emit('firstrun:drift', {
            phase: 'evolving',
            progress,
            parameters: drift
        });

        // Emit visual hint - system is alive
        eventBus.emit('firstrun:alive', { intensity: 0.3 + progress * 0.2 });
    }

    /**
     * Phase 4-7s: Word fades in
     * Contextual word appears, hovers
     */
    updateWordFadeInPhase(elapsed) {
        const duration = TIMELINE.WORD_FADE_IN.end - TIMELINE.WORD_FADE_IN.start;
        const progress = elapsed / duration;

        if (this.wordElement) {
            // Smooth fade in with slight float
            const opacity = this.easeOutCubic(progress);
            const floatY = Math.sin(elapsed * 0.003) * 3;

            this.wordElement.style.color = `rgba(255, 255, 255, ${opacity * 0.9})`;
            this.wordElement.style.transform = `translate(-50%, calc(-50% + ${floatY}px))`;
            this.wordElement.style.textShadow = `0 0 ${20 * opacity}px rgba(255, 255, 255, ${opacity * 0.3})`;
        }

        eventBus.emit('firstrun:word', {
            phase: 'fade_in',
            progress,
            word: this.contextWord
        });
    }

    /**
     * Phase 5.5-7s: Word absorbs into visual
     * Particle dissolve effect, demonstrates the mechanic
     */
    updateWordAbsorbPhase(elapsed) {
        const duration = TIMELINE.WORD_ABSORB.end - TIMELINE.WORD_ABSORB.start;
        const progress = elapsed / duration;

        if (this.wordElement) {
            // Absorb animation
            const scale = 1 + progress * 0.3;
            const opacity = 1 - this.easeInQuad(progress);
            const blur = progress * 10;
            const spread = progress * 50;

            this.wordElement.style.color = `rgba(255, 255, 255, ${opacity * 0.9})`;
            this.wordElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
            this.wordElement.style.filter = `blur(${blur}px)`;
            this.wordElement.style.letterSpacing = `${0.3 + spread * 0.02}em`;

            // Hide at end
            if (progress > 0.9) {
                this.wordElement.style.display = 'none';
            }
        }

        // Emit morph event at start of absorb
        if (progress < 0.1) {
            eventBus.emit('firstrun:morph', {
                word: this.contextWord,
                position: {
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2
                }
            });
        }

        eventBus.emit('firstrun:word', {
            phase: 'absorb',
            progress,
            word: this.contextWord
        });
    }

    /**
     * Phase 7-10s: Ready for user
     * Visual "leans toward" user, cursor appears
     */
    updateReadyPhase(elapsed) {
        const duration = TIMELINE.READY.end - TIMELINE.READY.start;
        const progress = elapsed / duration;

        // Show cursor with breathing animation
        if (this.cursorElement) {
            const cursorOpacity = this.easeOutCubic(Math.min(1, progress * 2));
            const pulse = 0.5 + Math.sin(elapsed * 0.004) * 0.5;

            this.cursorElement.style.background = `rgba(255, 255, 255, ${cursorOpacity * pulse * 0.7})`;
        }

        // Emit anticipation - system is ready
        eventBus.emit('firstrun:ready', {
            progress,
            anticipation: 0.2 + progress * 0.3
        });

        // Visual "leans toward" user
        eventBus.emit('firstrun:anticipate', {
            intensity: progress * 0.15,
            direction: { x: 0, y: 0.1 }
        });
    }

    // =========================================================================
    // COMPLETION
    // =========================================================================

    /**
     * Complete the first run experience
     */
    complete() {
        this.isRunning = false;
        this.isComplete = true;

        // Remove elements
        if (this.wordElement) {
            this.wordElement.remove();
            this.wordElement = null;
        }

        // Keep cursor for transition
        if (this.cursorElement) {
            // Fade out cursor
            this.cursorElement.style.transition = 'opacity 0.5s ease-out';
            this.cursorElement.style.opacity = '0';
            setTimeout(() => {
                if (this.cursorElement) {
                    this.cursorElement.remove();
                    this.cursorElement = null;
                }
            }, 500);
        }

        // Mark as complete in storage
        this.markComplete();

        // Emit completion
        eventBus.emit('firstrun:complete', {
            word: this.contextWord,
            duration: performance.now() - this.startTime
        });

        // Callback
        if (this.onComplete) {
            this.onComplete({
                word: this.contextWord,
                duration: performance.now() - this.startTime
            });
        }

        console.log('First run experience complete');
    }

    /**
     * Skip the first run experience
     */
    skip() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.complete();
    }

    // =========================================================================
    // UTILITIES
    // =========================================================================

    /**
     * Emit phase change event
     */
    emitPhaseChange(phase) {
        eventBus.emit('firstrun:phase', { phase });

        if (this.onPhaseChange) {
            this.onPhaseChange(phase);
        }

        console.log(`First run phase: ${phase}`);
    }

    /**
     * Easing functions
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeInQuad(t) {
        return t * t;
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Get current state
     */
    getState() {
        return {
            isRunning: this.isRunning,
            isComplete: this.isComplete,
            hasUserGesture: this.hasUserGesture,
            currentPhase: this.currentPhase,
            contextWord: this.contextWord,
            elapsed: this.isRunning ? performance.now() - this.startTime : 0
        };
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        if (this.wordElement) {
            this.wordElement.remove();
        }

        if (this.cursorElement) {
            this.cursorElement.remove();
        }

        if (this.anticipationOverlay) {
            this.anticipationOverlay.remove();
        }
    }
}

// =============================================================================
// FACTORY & HELPERS
// =============================================================================

/**
 * Create and initialize a first run experience
 */
export async function createFirstRunExperience(options = {}) {
    const experience = new FirstRunExperience(options);
    await experience.initialize();
    return experience;
}

/**
 * Quick check if first run should be shown
 */
export function shouldShowFirstRun(storageKey = 'tmv-first-run') {
    try {
        return !localStorage.getItem(storageKey);
    } catch {
        return true;
    }
}

/**
 * Get contextual word without full experience
 */
export { getContextualWord, getTimeBasedWord, getPoeticWord };

// =============================================================================
// EVENT INTEGRATIONS
// =============================================================================

/**
 * Integration helper for main.js
 * Connects first run events to system
 */
export function integrateFirstRun(experience, systems) {
    const { audioEngine, visualEngine, parameterManager, fusionEngine } = systems;

    // Handle drift events - update parameters during choreography
    eventBus.on('firstrun:drift', ({ parameters }) => {
        if (parameterManager) {
            // Apply subtle anticipation during first run
            // Use setAnticipation if available, otherwise setTargets
            if (parameterManager.setAnticipation) {
                parameterManager.setAnticipation(parameters, 0.1);
            } else if (parameterManager.setTargets) {
                parameterManager.setTargets(parameters);
            }
        }

        if (audioEngine && audioEngine.isReady && audioEngine.isReady()) {
            audioEngine.updateParameters(parameters);
        }
    });

    // Handle morph event - process the demo word
    eventBus.on('firstrun:morph', ({ word, position }) => {
        if (fusionEngine && parameterManager) {
            const result = fusionEngine.processWord(word);

            // Use setTargets for parameter morphing
            if (parameterManager.setTargets) {
                parameterManager.setTargets(result.parameters);
            }

            if (audioEngine && audioEngine.updateScale && result.scales && result.scales.length > 0) {
                audioEngine.updateScale(result.scales[0]);
            }
        }

        // Emit standard word event for visual particles
        eventBus.emit(Events.WORD_SUBMITTED, { word, position });
    });

    // Handle ready event - visual anticipation
    eventBus.on('firstrun:ready', ({ progress, anticipation }) => {
        if (visualEngine) {
            // Subtle visual lean toward user
            visualEngine.setParameter?.('onsetIntensity', anticipation * 0.3);
        }
    });

    // Handle completion - transition to normal operation
    eventBus.on('firstrun:complete', ({ word }) => {
        // Ensure system is in stable state
        if (parameterManager && parameterManager.clearAnticipation) {
            parameterManager.clearAnticipation();
        }

        console.log(`First run complete. Demo word: ${word}`);
    });

    return experience;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default FirstRunExperience;
