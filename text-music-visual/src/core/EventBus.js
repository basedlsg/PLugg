/**
 * EventBus.js
 * Centralized event system for loose coupling between modules
 *
 * Events:
 * - 'word:submitted' -> { word, position }
 * - 'parameters:updated' -> { parameters, scales, source }
 * - 'history:selected' -> { node }
 * - 'audio:initialized' -> { audioContext }
 * - 'visual:initialized' -> { visualEngine }
 * - 'morph:started' -> { word, parameters }
 * - 'morph:completed' -> { word }
 * - 'breathing:cycle' -> { phase, intensity }
 */

class EventBus {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
        this.history = [];
        this.maxHistory = 100;
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => {
            this.off(event, callback);
        };
    }

    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, new Set());
        }
        this.onceListeners.get(event).add(callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
        if (this.onceListeners.has(event)) {
            this.onceListeners.get(event).delete(callback);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        // Record in history
        this.history.push({
            event,
            data,
            timestamp: performance.now()
        });

        // Trim history
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        // Call regular listeners
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`EventBus error in ${event}:`, error);
                }
            });
        }

        // Call once listeners and remove them
        if (this.onceListeners.has(event)) {
            const callbacks = this.onceListeners.get(event);
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`EventBus once error in ${event}:`, error);
                }
            });
            callbacks.clear();
        }
    }

    /**
     * Wait for an event (Promise-based)
     * @param {string} event - Event name
     * @param {number} timeout - Timeout in ms (0 = no timeout)
     * @returns {Promise} Resolves with event data
     */
    waitFor(event, timeout = 0) {
        return new Promise((resolve, reject) => {
            const timeoutId = timeout > 0
                ? setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeout)
                : null;

            this.once(event, (data) => {
                if (timeoutId) clearTimeout(timeoutId);
                resolve(data);
            });
        });
    }

    /**
     * Create a namespaced event emitter
     * @param {string} namespace - Namespace prefix
     * @returns {Object} Namespaced emitter
     */
    namespace(namespace) {
        return {
            on: (event, callback) => this.on(`${namespace}:${event}`, callback),
            once: (event, callback) => this.once(`${namespace}:${event}`, callback),
            off: (event, callback) => this.off(`${namespace}:${event}`, callback),
            emit: (event, data) => this.emit(`${namespace}:${event}`, data),
            waitFor: (event, timeout) => this.waitFor(`${namespace}:${event}`, timeout)
        };
    }

    /**
     * Get event history
     * @param {string} event - Optional event filter
     * @returns {Array} Event history
     */
    getHistory(event = null) {
        if (event) {
            return this.history.filter(h => h.event === event);
        }
        return [...this.history];
    }

    /**
     * Clear all listeners
     */
    clear() {
        this.listeners.clear();
        this.onceListeners.clear();
        this.history = [];
    }

    /**
     * Get listener count for an event
     * @param {string} event - Event name
     * @returns {number} Listener count
     */
    listenerCount(event) {
        const regular = this.listeners.has(event) ? this.listeners.get(event).size : 0;
        const once = this.onceListeners.has(event) ? this.onceListeners.get(event).size : 0;
        return regular + once;
    }
}

// Singleton instance
const eventBus = new EventBus();

// Event name constants
export const Events = {
    // Word events
    WORD_SUBMITTED: 'word:submitted',
    WORD_ANTICIPATION: 'word:anticipation',

    // Parameter events
    PARAMETERS_UPDATED: 'parameters:updated',
    PARAMETERS_MORPHING: 'parameters:morphing',

    // History events
    HISTORY_SELECTED: 'history:selected',
    HISTORY_ADDED: 'history:added',

    // System events
    AUDIO_INITIALIZED: 'audio:initialized',
    VISUAL_INITIALIZED: 'visual:initialized',
    SYSTEM_READY: 'system:ready',
    USER_GESTURE: 'user:gesture',

    // Morph events
    MORPH_STARTED: 'morph:started',
    MORPH_COMPLETED: 'morph:completed',

    // Breathing events
    BREATHING_CYCLE: 'breathing:cycle',

    // Error events
    ERROR: 'error'
};

export { EventBus };
export default eventBus;
