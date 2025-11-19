/**
 * ImageGenerator.js
 * fal.ai FLUX.1 schnell integration with request queue management
 */

import { AI_CONFIG } from './config.js';

export class ImageGenerator {
    constructor(options = {}) {
        this.config = { ...AI_CONFIG.api, ...AI_CONFIG.generation, ...options };

        // Request queue
        this.queue = [];
        this.isProcessing = false;
        this.lastGenerationTime = 0;

        // State tracking
        this.currentRequest = null;
        this.abortController = null;

        // Callbacks
        this.onGenerated = null;
        this.onError = null;
        this.onProgress = null;

        // Statistics
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTime: 0,
            averageTime: 0,
        };

        // Start queue processor
        this.queueInterval = setInterval(
            () => this.processQueue(),
            AI_CONFIG.timing.queueInterval
        );
    }

    /**
     * Queue a new image generation request
     * @param {string} prompt - The generation prompt
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Generation result
     */
    async generate(prompt, options = {}) {
        return new Promise((resolve, reject) => {
            const request = {
                id: this.generateRequestId(),
                prompt,
                options,
                resolve,
                reject,
                timestamp: Date.now(),
                retries: 0,
            };

            // Manage queue size
            if (this.queue.length >= AI_CONFIG.timing.maxQueueSize) {
                // Remove oldest non-priority request
                const oldRequest = this.queue.shift();
                oldRequest.reject(new Error('Request superseded by newer request'));
            }

            this.queue.push(request);

            if (AI_CONFIG.debug.logGenerations) {
                console.log(`[ImageGenerator] Queued request ${request.id}`);
            }
        });
    }

    /**
     * Process the request queue
     */
    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        // Check minimum interval
        const timeSinceLastGeneration = Date.now() - this.lastGenerationTime;
        if (timeSinceLastGeneration < AI_CONFIG.timing.minInterval) {
            return;
        }

        this.isProcessing = true;
        const request = this.queue.shift();
        this.currentRequest = request;

        try {
            const result = await this.executeRequest(request);
            request.resolve(result);

            if (this.onGenerated) {
                this.onGenerated(result);
            }
        } catch (error) {
            // Retry logic
            if (request.retries < this.config.maxRetries) {
                request.retries++;
                this.queue.unshift(request); // Re-add to front of queue

                if (AI_CONFIG.debug.logGenerations) {
                    console.log(`[ImageGenerator] Retrying request ${request.id} (attempt ${request.retries + 1})`);
                }

                // Wait before retry
                await this.sleep(this.config.retryDelay);
            } else {
                request.reject(error);

                if (this.onError) {
                    this.onError(error);
                }

                this.stats.failedRequests++;
            }
        } finally {
            this.isProcessing = false;
            this.currentRequest = null;
        }
    }

    /**
     * Execute a single generation request
     * @param {Object} request - The request object
     * @returns {Promise<Object>} Generation result
     */
    async executeRequest(request) {
        const startTime = Date.now();
        this.stats.totalRequests++;

        // Create abort controller for timeout
        this.abortController = new AbortController();
        const timeoutId = setTimeout(
            () => this.abortController.abort(),
            this.config.requestTimeout
        );

        try {
            const payload = this.buildPayload(request.prompt, request.options);

            if (AI_CONFIG.debug.logGenerations) {
                console.log(`[ImageGenerator] Executing request ${request.id}:`, payload);
            }

            const response = await fetch(this.config.falEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Key ${this.config.falApiKey}`,
                },
                body: JSON.stringify(payload),
                signal: this.abortController.signal,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            // Extract image URL from response
            const imageUrl = this.extractImageUrl(data);

            // Load image as blob
            const imageBlob = await this.fetchImage(imageUrl);

            // Create image bitmap
            const imageBitmap = await createImageBitmap(imageBlob);

            const elapsedTime = Date.now() - startTime;
            this.lastGenerationTime = Date.now();

            // Update statistics
            this.stats.successfulRequests++;
            this.stats.totalTime += elapsedTime;
            this.stats.averageTime = this.stats.totalTime / this.stats.successfulRequests;

            if (AI_CONFIG.debug.showTiming) {
                console.log(`[ImageGenerator] Request ${request.id} completed in ${elapsedTime}ms`);
            }

            return {
                id: request.id,
                prompt: request.prompt,
                imageUrl,
                imageBlob,
                imageBitmap,
                width: imageBitmap.width,
                height: imageBitmap.height,
                elapsedTime,
                timestamp: Date.now(),
            };
        } finally {
            clearTimeout(timeoutId);
            this.abortController = null;
        }
    }

    /**
     * Build the API payload
     * @param {string} prompt - The generation prompt
     * @param {Object} options - Additional options
     * @returns {Object} API payload
     */
    buildPayload(prompt, options = {}) {
        return {
            prompt,
            image_size: {
                width: options.width || this.config.width,
                height: options.height || this.config.height,
            },
            num_inference_steps: options.numInferenceSteps || this.config.numInferenceSteps,
            guidance_scale: options.guidanceScale || this.config.guidanceScale,
            num_images: 1,
            enable_safety_checker: false,
            output_format: this.config.outputFormat,
        };
    }

    /**
     * Extract image URL from API response
     * @param {Object} data - API response
     * @returns {string} Image URL
     */
    extractImageUrl(data) {
        // Handle different response formats
        if (data.images && data.images.length > 0) {
            return data.images[0].url || data.images[0];
        }
        if (data.image) {
            return data.image.url || data.image;
        }
        if (data.output && data.output.length > 0) {
            return data.output[0];
        }
        throw new Error('Could not extract image URL from response');
    }

    /**
     * Fetch image as blob
     * @param {string} url - Image URL
     * @returns {Promise<Blob>} Image blob
     */
    async fetchImage(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }
        return response.blob();
    }

    /**
     * Cancel the current request
     */
    cancelCurrent() {
        if (this.abortController) {
            this.abortController.abort();
        }

        if (this.currentRequest) {
            this.currentRequest.reject(new Error('Request cancelled'));
            this.currentRequest = null;
        }
    }

    /**
     * Clear the request queue
     */
    clearQueue() {
        while (this.queue.length > 0) {
            const request = this.queue.shift();
            request.reject(new Error('Queue cleared'));
        }
    }

    /**
     * Check if the generator is available
     * @returns {Promise<boolean>} Whether the API is available
     */
    async checkAvailability() {
        if (!this.config.falApiKey) {
            return false;
        }

        try {
            // Simple health check - just verify the endpoint is reachable
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(this.config.falEndpoint, {
                method: 'OPTIONS',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return response.ok || response.status === 405; // 405 = method not allowed, but endpoint exists
        } catch (error) {
            return false;
        }
    }

    /**
     * Get queue status
     * @returns {Object} Queue status
     */
    getStatus() {
        return {
            queueLength: this.queue.length,
            isProcessing: this.isProcessing,
            timeSinceLastGeneration: Date.now() - this.lastGenerationTime,
            canGenerate: Date.now() - this.lastGenerationTime >= AI_CONFIG.timing.minInterval,
            stats: { ...this.stats },
        };
    }

    /**
     * Set API key at runtime
     * @param {string} apiKey - The API key
     */
    setApiKey(apiKey) {
        this.config.falApiKey = apiKey;
    }

    /**
     * Generate a unique request ID
     * @returns {string} Request ID
     */
    generateRequestId() {
        return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Cleanup resources
     */
    dispose() {
        if (this.queueInterval) {
            clearInterval(this.queueInterval);
        }

        this.cancelCurrent();
        this.clearQueue();
    }
}

export default ImageGenerator;
