/**
 * AudioAnalyzer.js
 * Audio feature extraction for visual system
 *
 * Extracts:
 * - RMS Energy
 * - Spectral Centroid
 * - Spectral Flux
 * - Onset Detection
 * - Chord Root estimation
 */

export class AudioAnalyzer {
    constructor(options = {}) {
        this.options = {
            fftSize: 2048,
            smoothingTimeConstant: 0.8,
            minDecibels: -90,
            maxDecibels: -10,
            ...options
        };

        this.audioContext = null;
        this.analyser = null;
        this.source = null;

        // Buffers for analysis
        this.frequencyData = null;
        this.timeDomainData = null;
        this.previousSpectrum = null;

        // Feature values
        this.features = {
            rmsEnergy: 0,
            spectralCentroid: 0,
            spectralFlux: 0,
            onsetIntensity: 0,
            chordRoot: 0
        };

        // Onset detection state
        this.onsetThreshold = 0.3;
        this.onsetDecay = 0.95;
        this.lastOnsetTime = 0;
        this.spectralFluxHistory = [];
        this.historySize = 10;

        // Chromagram for chord detection
        this.chromagram = new Float32Array(12);

        this.isConnected = false;
    }

    async connect(audioElement) {
        if (this.isConnected) {
            this.disconnect();
        }

        // Create audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Resume context (required for user interaction)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Create analyser node
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = this.options.fftSize;
        this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant;
        this.analyser.minDecibels = this.options.minDecibels;
        this.analyser.maxDecibels = this.options.maxDecibels;

        // Create source from audio element
        if (audioElement instanceof HTMLMediaElement) {
            this.source = this.audioContext.createMediaElementSource(audioElement);
        } else if (audioElement instanceof MediaStream) {
            this.source = this.audioContext.createMediaStreamSource(audioElement);
        } else {
            throw new Error('Invalid audio source');
        }

        // Connect nodes
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        // Initialize buffers
        const bufferLength = this.analyser.frequencyBinCount;
        this.frequencyData = new Uint8Array(bufferLength);
        this.timeDomainData = new Uint8Array(bufferLength);
        this.previousSpectrum = new Float32Array(bufferLength);

        this.isConnected = true;
    }

    disconnect() {
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }

        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.isConnected = false;
    }

    getFeatures() {
        if (!this.isConnected || !this.analyser) {
            return this.features;
        }

        // Get current audio data
        this.analyser.getByteFrequencyData(this.frequencyData);
        this.analyser.getByteTimeDomainData(this.timeDomainData);

        // Calculate features
        this.features.rmsEnergy = this.calculateRMS();
        this.features.spectralCentroid = this.calculateSpectralCentroid();
        this.features.spectralFlux = this.calculateSpectralFlux();
        this.features.onsetIntensity = this.detectOnset();
        this.features.chordRoot = this.estimateChordRoot();

        return { ...this.features };
    }

    calculateRMS() {
        let sum = 0;

        for (let i = 0; i < this.timeDomainData.length; i++) {
            // Convert from 0-255 to -1 to 1
            const sample = (this.timeDomainData[i] - 128) / 128;
            sum += sample * sample;
        }

        const rms = Math.sqrt(sum / this.timeDomainData.length);

        // Normalize to 0-1 range
        return Math.min(rms * 2, 1);
    }

    calculateSpectralCentroid() {
        let weightedSum = 0;
        let sum = 0;

        const sampleRate = this.audioContext.sampleRate;
        const binCount = this.frequencyData.length;
        const nyquist = sampleRate / 2;

        for (let i = 0; i < binCount; i++) {
            const magnitude = this.frequencyData[i];
            const frequency = (i / binCount) * nyquist;

            weightedSum += magnitude * frequency;
            sum += magnitude;
        }

        if (sum === 0) return 0;

        const centroid = weightedSum / sum;

        // Normalize to 0-1 (assuming max frequency of interest is 8000 Hz)
        return Math.min(centroid / 8000, 1);
    }

    calculateSpectralFlux() {
        let flux = 0;

        for (let i = 0; i < this.frequencyData.length; i++) {
            const current = this.frequencyData[i] / 255;
            const previous = this.previousSpectrum[i];

            // Only consider increases (onset-like)
            const diff = current - previous;
            if (diff > 0) {
                flux += diff;
            }

            // Update previous spectrum
            this.previousSpectrum[i] = current;
        }

        // Normalize
        flux /= this.frequencyData.length;

        return Math.min(flux * 10, 1);
    }

    detectOnset() {
        const currentFlux = this.features.spectralFlux;

        // Add to history
        this.spectralFluxHistory.push(currentFlux);
        if (this.spectralFluxHistory.length > this.historySize) {
            this.spectralFluxHistory.shift();
        }

        // Calculate adaptive threshold
        const mean = this.spectralFluxHistory.reduce((a, b) => a + b, 0) /
                     this.spectralFluxHistory.length;
        const threshold = mean * (1 + this.onsetThreshold);

        // Detect onset
        const currentTime = this.audioContext ? this.audioContext.currentTime : 0;
        const timeSinceLastOnset = currentTime - this.lastOnsetTime;

        if (currentFlux > threshold && timeSinceLastOnset > 0.1) {
            this.lastOnsetTime = currentTime;
            return 1;
        }

        // Decay previous onset
        return this.features.onsetIntensity * this.onsetDecay;
    }

    estimateChordRoot() {
        // Build chromagram (12-bin pitch class profile)
        this.chromagram.fill(0);

        const sampleRate = this.audioContext.sampleRate;
        const binCount = this.frequencyData.length;
        const nyquist = sampleRate / 2;

        for (let i = 1; i < binCount; i++) {
            const frequency = (i / binCount) * nyquist;

            // Skip frequencies below 50 Hz or above 5000 Hz
            if (frequency < 50 || frequency > 5000) continue;

            // Convert frequency to MIDI note number
            const midiNote = 69 + 12 * Math.log2(frequency / 440);

            // Get pitch class (0-11)
            const pitchClass = Math.round(midiNote) % 12;
            if (pitchClass >= 0 && pitchClass < 12) {
                this.chromagram[pitchClass] += this.frequencyData[i];
            }
        }

        // Find dominant pitch class
        let maxValue = 0;
        let dominantPitch = 0;

        for (let i = 0; i < 12; i++) {
            if (this.chromagram[i] > maxValue) {
                maxValue = this.chromagram[i];
                dominantPitch = i;
            }
        }

        return dominantPitch;
    }

    // Get frequency spectrum (for visualization)
    getSpectrum() {
        if (!this.frequencyData) return new Uint8Array(0);
        return new Uint8Array(this.frequencyData);
    }

    // Get waveform data
    getWaveform() {
        if (!this.timeDomainData) return new Uint8Array(0);
        return new Uint8Array(this.timeDomainData);
    }

    // Get chromagram
    getChromagram() {
        return new Float32Array(this.chromagram);
    }

    // Set onset detection sensitivity
    setOnsetThreshold(threshold) {
        this.onsetThreshold = Math.max(0, Math.min(1, threshold));
    }

    // Set smoothing
    setSmoothing(value) {
        if (this.analyser) {
            this.analyser.smoothingTimeConstant = Math.max(0, Math.min(1, value));
        }
    }

    // Cleanup
    dispose() {
        this.disconnect();
        this.frequencyData = null;
        this.timeDomainData = null;
        this.previousSpectrum = null;
        this.spectralFluxHistory = [];
    }
}

export default AudioAnalyzer;
