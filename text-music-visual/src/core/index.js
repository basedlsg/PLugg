/**
 * Core Module Index
 * Re-exports all core functionality for convenient importing
 */

export { default as eventBus, EventBus, Events } from './EventBus.js';
export { AudioEngine, createAudioEngine } from './AudioEngine.js';
export { ParameterManager, createParameterManager } from './ParameterManager.js';
export {
    FirstRunExperience,
    createFirstRunExperience,
    integrateFirstRun,
    shouldShowFirstRun,
    getContextualWord,
    getTimeBasedWord,
    getPoeticWord
} from './FirstRunExperience.js';
