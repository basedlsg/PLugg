/**
 * main.js
 * Main Application Entry Point
 *
 * Integrates:
 * - Audio synthesis (world synth via Strudel)
 * - Visual engine (raymarching WebGL)
 * - Text mapping (fusion system)
 * - React UI
 *
 * Data Flow:
 * User Types -> UI -> TextMapping -> Parameters
 * Parameters -> Audio Synth (continuous morph)
 * Parameters -> Visual Engine (update uniforms)
 * Audio -> AudioAnalyzer -> Visual Engine (audio reactivity)
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

import eventBus, { Events } from './core/EventBus.js';
import { AudioEngine } from './core/AudioEngine.js';
import { ParameterManager } from './core/ParameterManager.js';
import { VisualEngine } from './visual/VisualEngine.js';
import { FusionEngine } from './mapping/fusion.js';
import {
    FirstRunExperience,
    createFirstRunExperience,
    integrateFirstRun
} from './core/FirstRunExperience.js';
import App from './ui/App.jsx';

// =============================================================================
// APPLICATION STATE
// =============================================================================

const state = {
    isInitialized: false,
    hasUserGesture: false,
    audioEngine: null,
    visualEngine: null,
    parameterManager: null,
    fusionEngine: null,
    reactRoot: null,
    firstRunExperience: null
};

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize all systems after user gesture
 */
async function initialize() {
    if (state.isInitialized) return;

    console.log('Initializing application...');

    try {
        // 1. Create AudioEngine
        state.audioEngine = new AudioEngine({
            defaultScale: 'yo',
            bpm: 60
        });

        // 2. Initialize audio (creates AudioContext)
        await state.audioEngine.initialize();
        console.log('Audio engine initialized');

        // 3. Create ParameterManager
        state.parameterManager = new ParameterManager({
            defaultDuration: 400,
            anticipationDuration: 100,
            blendDuration: 300
        });
        console.log('Parameter manager initialized');

        // 4. Create FusionEngine
        state.fusionEngine = new FusionEngine({
            phoneticWeight: 0.25,
            semanticWeight: 0.35,
            sentimentWeight: 0.25,
            contextWeight: 0.15
        });
        console.log('Fusion engine initialized');

        // 5. Initialize VisualEngine
        const canvas = document.getElementById('visual-canvas');
        if (canvas) {
            state.visualEngine = new VisualEngine(canvas, {
                targetFPS: 60,
                maxParticles: 20000
            });

            // Connect audio analyzer
            const outputNode = state.audioEngine.getOutputNode();
            if (outputNode && state.visualEngine.audioAnalyzer) {
                await state.visualEngine.audioAnalyzer.connect(
                    createMediaStreamFromNode(outputNode, state.audioEngine.getAudioContext())
                );
            }

            state.visualEngine.start();
            console.log('Visual engine initialized');

            eventBus.emit(Events.VISUAL_INITIALIZED, {
                visualEngine: state.visualEngine
            });
        }

        // 6. Connect event handlers
        setupEventHandlers();

        // 7. Start the drone
        await state.audioEngine.startDrone();
        console.log('Drone started');

        state.isInitialized = true;
        eventBus.emit(Events.SYSTEM_READY, { state });
        console.log('Application initialized successfully');

    } catch (error) {
        console.error('Initialization failed:', error);
        eventBus.emit(Events.ERROR, {
            source: 'main',
            error: error.message
        });
    }
}

/**
 * Create a MediaStream from an AudioNode for analysis
 */
function createMediaStreamFromNode(node, audioContext) {
    // Create a MediaStreamDestination
    const dest = audioContext.createMediaStreamDestination();
    node.connect(dest);
    return dest.stream;
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Setup all event handlers for cross-system communication
 */
function setupEventHandlers() {
    // Word submission -> Text mapping -> Parameter update
    eventBus.on(Events.WORD_SUBMITTED, handleWordSubmitted);

    // Word anticipation -> Subtle parameter changes
    eventBus.on(Events.WORD_ANTICIPATION, handleWordAnticipation);

    // History selection -> Blend parameters
    eventBus.on(Events.HISTORY_SELECTED, handleHistorySelected);

    // Parameter updates -> Synth and visuals
    eventBus.on(Events.PARAMETERS_UPDATED, handleParametersUpdated);

    // Breathing cycle -> Visual modulation
    eventBus.on(Events.BREATHING_CYCLE, handleBreathingCycle);

    console.log('Event handlers connected');
}

/**
 * Handle word submission
 */
function handleWordSubmitted({ word, position }) {
    if (!state.fusionEngine || !state.parameterManager) return;

    console.log('Word submitted:', word);

    // Process word through fusion engine
    const result = state.fusionEngine.processWord(word);

    // Extract synthesis parameters
    const synthParams = {
        brilliance: result.parameters.brilliance || 0.5,
        motion: result.parameters.motion || 0.3,
        space: result.parameters.space || 0.3,
        warmth: result.parameters.warmth || 0.5,
        drift: result.parameters.driftSpeed || 0.2
    };

    // Morph parameters
    state.parameterManager.morphTo(result.parameters, {
        duration: 400,
        scales: result.scales
    });

    // Update audio engine scale
    if (state.audioEngine && result.scales.length > 0) {
        state.audioEngine.updateScale(result.scales[0]);
    }

    // Emit morph started
    eventBus.emit(Events.MORPH_STARTED, {
        word,
        parameters: result.parameters,
        analysis: result.analysis
    });

    // Add to history
    eventBus.emit(Events.HISTORY_ADDED, {
        word,
        parameters: result.parameters,
        scales: result.scales,
        timestamp: Date.now()
    });
}

/**
 * Handle word anticipation (while typing)
 */
function handleWordAnticipation({ text }) {
    if (!state.fusionEngine || !state.parameterManager) return;

    // Quick analysis without full context
    const result = state.fusionEngine.processWord(text);

    // Apply subtle anticipation
    state.parameterManager.anticipate(result.parameters);
}

/**
 * Handle history node selection
 */
function handleHistorySelected({ node }) {
    if (!state.parameterManager) return;

    console.log('History selected:', node.word);

    // Blend with historical parameters
    state.parameterManager.blendFromHistory(node.parameters, 0.5);

    // Update scale if present
    if (state.audioEngine && node.scales && node.scales.length > 0) {
        state.audioEngine.updateScale(node.scales[0]);
    }
}

/**
 * Handle parameter updates
 */
function handleParametersUpdated({ parameters, scales, source }) {
    // Update audio engine
    if (state.audioEngine) {
        state.audioEngine.updateParameters({
            brilliance: parameters.brilliance,
            motion: parameters.motion,
            space: parameters.space,
            warmth: parameters.warmth,
            drift: parameters.drift || parameters.driftSpeed
        });
    }

    // Update visual engine
    if (state.visualEngine) {
        // Map parameters to visual uniforms
        state.visualEngine.setParameter('rmsEnergy', parameters.motion * 0.5);
        state.visualEngine.setParameter('spectralCentroid', parameters.brilliance);
        state.visualEngine.setParameter('spectralFlux', parameters.complexity || 0.5);
        state.visualEngine.setChordRoot(Math.floor(parameters.warmth * 12));
    }
}

/**
 * Handle breathing cycle
 */
function handleBreathingCycle({ phase, intensity }) {
    // Apply subtle visual modulation from breathing
    if (state.visualEngine) {
        // Breathing affects post-processing
        const bloomIntensity = 0.3 + intensity * 0.1;
        if (state.visualEngine.postQuad) {
            state.visualEngine.postQuad.material.uniforms.uBloomIntensity.value = bloomIntensity;
        }
    }
}

// =============================================================================
// USER GESTURE HANDLING
// =============================================================================

/**
 * Handle first user gesture to unlock audio
 * Now managed by FirstRunExperience for choreographed onboarding
 */
function handleUserGesture() {
    if (state.hasUserGesture) return;

    state.hasUserGesture = true;

    // Initialize everything
    initialize();
}

/**
 * Initialize first run experience
 * Creates the choreographed 10-second onboarding
 */
async function initializeFirstRunExperience() {
    state.firstRunExperience = await createFirstRunExperience({
        skipOnReturn: false, // Always show for now (set true for production)
        onPhaseChange: (phase) => {
            console.log(`First run phase: ${phase}`);
        },
        onComplete: ({ word, duration }) => {
            console.log(`First run complete. Word: ${word}, Duration: ${duration}ms`);
            eventBus.emit('firstrun:finished', { word, duration });
        },
        onWordSelected: (word) => {
            console.log(`Contextual word selected: ${word}`);
        }
    });

    // Listen for gesture from FirstRunExperience
    eventBus.once(Events.USER_GESTURE, handleUserGesture);

    // Integrate first run with systems after initialization
    eventBus.once(Events.SYSTEM_READY, () => {
        integrateFirstRun(state.firstRunExperience, {
            audioEngine: state.audioEngine,
            visualEngine: state.visualEngine,
            parameterManager: state.parameterManager,
            fusionEngine: state.fusionEngine
        });
    });
}

// =============================================================================
// REACT MOUNTING
// =============================================================================

/**
 * Mount the React UI
 */
function mountReactUI() {
    const container = document.getElementById('react-root');
    if (!container) {
        console.error('React root container not found');
        return;
    }

    state.reactRoot = createRoot(container);

    // Create enhanced App with event bus integration
    const EnhancedApp = () => {
        return (
            <App
                eventBus={eventBus}
                onWordSubmit={(word, position) => {
                    eventBus.emit(Events.WORD_SUBMITTED, { word, position });
                }}
                onAnticipation={(text) => {
                    eventBus.emit(Events.WORD_ANTICIPATION, { text });
                }}
                onHistorySelect={(node) => {
                    eventBus.emit(Events.HISTORY_SELECTED, { node });
                }}
            />
        );
    };

    state.reactRoot.render(<EnhancedApp />);
    console.log('React UI mounted');
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get the event bus for external integrations
 */
export function getEventBus() {
    return eventBus;
}

/**
 * Get application state
 */
export function getState() {
    return state;
}

/**
 * Manually trigger a word morph
 */
export function morphToWord(word) {
    eventBus.emit(Events.WORD_SUBMITTED, { word, position: { x: 0, y: 0 } });
}

/**
 * Get current parameters
 */
export function getCurrentParameters() {
    return state.parameterManager?.getCurrent() || {};
}

/**
 * Cleanup application
 */
export function dispose() {
    if (state.firstRunExperience) {
        state.firstRunExperience.dispose();
    }
    if (state.audioEngine) {
        state.audioEngine.dispose();
    }
    if (state.visualEngine) {
        state.visualEngine.dispose();
    }
    if (state.parameterManager) {
        state.parameterManager.dispose();
    }
    if (state.reactRoot) {
        state.reactRoot.unmount();
    }

    eventBus.clear();
    console.log('Application disposed');
}

// =============================================================================
// BOOTSTRAP
// =============================================================================

/**
 * Main entry point
 */
async function main() {
    console.log('Text-Music-Visual Application Starting...');

    // Mount React UI immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountReactUI);
    } else {
        mountReactUI();
    }

    // Initialize first run experience (handles gesture capture)
    await initializeFirstRunExperience();

    // Hide the old gesture overlay since FirstRunExperience handles it
    const gestureOverlay = document.getElementById('gesture-overlay');
    if (gestureOverlay) {
        gestureOverlay.classList.add('hidden');
    }

    // Hide loading overlay - we start with something beautiful immediately
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }

    // Expose debug API
    if (import.meta.env.DEV) {
        window.__TMV = {
            eventBus,
            getState,
            morphToWord,
            getCurrentParameters,
            dispose,
            firstRun: state.firstRunExperience
        };
    }

    // Show welcome message
    console.log(`
    ==========================================
    Text-Music-Visual Interactive Experience
    ==========================================

    The experience begins immediately.
    Click anywhere or press any key to engage.

    Type words to shape sound and visuals.
    Press Tab to view your constellation.

    First Run Experience:
    - 0-2s:  Screen already alive
    - 2-4s:  Sound evolves on its own
    - 4-7s:  Contextual word appears
    - 7-10s: Ready for your input

    Events:
    - word:submitted
    - parameters:updated
    - firstrun:complete

    API:
    - morphToWord(word)
    - getCurrentParameters()
    - getEventBus()
    ==========================================
    `);
}

// Start application
main();

// Export for module usage
export default {
    getEventBus,
    getState,
    morphToWord,
    getCurrentParameters,
    dispose
};
