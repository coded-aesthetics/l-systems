/**
 * API utilities for the forest generator
 * Handles plant loading, error handling, and API communication
 */

export class ApiUtils {
    static DEFAULT_API_BASE = 'http://localhost:5001/api';
    static REQUEST_TIMEOUT = 10000; // 10 seconds
    static MAX_RETRIES = 3;

    /**
     * Load plants from the API with retry logic and error handling
     */
    static async loadPlants(apiBase = this.DEFAULT_API_BASE) {
        const url = `${apiBase}/plants`;

        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                console.log(`Loading plants from API (attempt ${attempt}/${this.MAX_RETRIES})...`);

                const response = await this.fetchWithTimeout(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }, this.REQUEST_TIMEOUT);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const plants = await response.json();

                if (!Array.isArray(plants)) {
                    throw new Error('API response is not an array');
                }

                console.log(`Successfully loaded ${plants.length} plants from API`);
                return this.validatePlants(plants);

            } catch (error) {
                console.warn(`Plant loading attempt ${attempt} failed:`, error.message);

                if (attempt === this.MAX_RETRIES) {
                    console.error('All plant loading attempts failed');
                    throw new Error(`Failed to load plants after ${this.MAX_RETRIES} attempts: ${error.message}`);
                }

                // Wait before retry
                await this.delay(1000 * attempt);
            }
        }
    }

    /**
     * Save plant configuration to the API
     */
    static async savePlant(plantData, apiBase = this.DEFAULT_API_BASE) {
        const url = `${apiBase}/plants`;

        try {
            const response = await this.fetchWithTimeout(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(plantData)
            }, this.REQUEST_TIMEOUT);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const savedPlant = await response.json();
            console.log('Plant saved successfully:', savedPlant.name);
            return savedPlant;

        } catch (error) {
            console.error('Failed to save plant:', error);
            throw new Error(`Failed to save plant: ${error.message}`);
        }
    }

    /**
     * Update existing plant configuration
     */
    static async updatePlant(plantId, plantData, apiBase = this.DEFAULT_API_BASE) {
        const url = `${apiBase}/plants/${plantId}`;

        try {
            const response = await this.fetchWithTimeout(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(plantData)
            }, this.REQUEST_TIMEOUT);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const updatedPlant = await response.json();
            console.log('Plant updated successfully:', updatedPlant.name);
            return updatedPlant;

        } catch (error) {
            console.error('Failed to update plant:', error);
            throw new Error(`Failed to update plant: ${error.message}`);
        }
    }

    /**
     * Delete plant from the API
     */
    static async deletePlant(plantId, apiBase = this.DEFAULT_API_BASE) {
        const url = `${apiBase}/plants/${plantId}`;

        try {
            const response = await this.fetchWithTimeout(url, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            }, this.REQUEST_TIMEOUT);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log(`Plant ${plantId} deleted successfully`);
            return true;

        } catch (error) {
            console.error('Failed to delete plant:', error);
            throw new Error(`Failed to delete plant: ${error.message}`);
        }
    }

    /**
     * Check API health/availability
     */
    static async checkApiHealth(apiBase = this.DEFAULT_API_BASE) {
        const url = `${apiBase}/health`;

        try {
            const response = await this.fetchWithTimeout(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }, 5000); // Shorter timeout for health check

            return response.ok;

        } catch (error) {
            console.warn('API health check failed:', error.message);
            return false;
        }
    }

    /**
     * Fetch with timeout support
     */
    static async fetchWithTimeout(url, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout}ms`);
            }
            throw error;
        }
    }

    /**
     * Validate plant data structure
     */
    static validatePlants(plants) {
        const validPlants = [];

        for (const plant of plants) {
            try {
                const validatedPlant = this.validateSinglePlant(plant);
                validPlants.push(validatedPlant);
            } catch (error) {
                console.warn(`Invalid plant data for plant ${plant.id || 'unknown'}:`, error.message);
            }
        }

        console.log(`Validated ${validPlants.length} out of ${plants.length} plants`);
        return validPlants;
    }

    /**
     * Validate a single plant configuration
     */
    static validateSinglePlant(plant) {
        const required = ['id', 'name', 'axiom', 'rules', 'iterations', 'angle'];
        const missing = required.filter(field => plant[field] === undefined || plant[field] === null);

        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        // Validate data types and ranges
        if (typeof plant.id !== 'number' && typeof plant.id !== 'string') {
            throw new Error('Plant ID must be a number or string');
        }

        if (typeof plant.name !== 'string' || plant.name.length === 0) {
            throw new Error('Plant name must be a non-empty string');
        }

        if (typeof plant.axiom !== 'string' || plant.axiom.length === 0) {
            throw new Error('Axiom must be a non-empty string');
        }

        if (typeof plant.rules !== 'object' || plant.rules === null) {
            throw new Error('Rules must be an object');
        }

        if (!Number.isInteger(plant.iterations) || plant.iterations < 1 || plant.iterations > 20) {
            throw new Error('Iterations must be an integer between 1 and 20');
        }

        if (typeof plant.angle !== 'number' || plant.angle < 0 || plant.angle > 180) {
            throw new Error('Angle must be a number between 0 and 180');
        }

        // Set default values for optional fields
        return {
            ...plant,
            angleVariation: plant.angleVariation || 0,
            lengthVariation: plant.lengthVariation || 0,
            lengthTapering: plant.lengthTapering || 90,
            leafProbability: plant.leafProbability || 30,
            leafGenerationThreshold: plant.leafGenerationThreshold || 2,
            length: plant.length || 5,
            thickness: plant.thickness || 0.1,
            tapering: plant.tapering || 0.9,
            timestamp: plant.timestamp || Math.floor(Date.now() / 1000)
        };
    }

    /**
     * Create a default plant configuration
     */
    static createDefaultPlant(overrides = {}) {
        const defaults = {
            name: 'New Plant',
            axiom: 'F',
            rules: { F: 'F[+F]F[-F]F' },
            iterations: 4,
            angle: 25.7,
            angleVariation: 5,
            lengthVariation: 20,
            lengthTapering: 90,
            leafProbability: 30,
            leafGenerationThreshold: 2,
            length: 5,
            thickness: 0.1,
            tapering: 0.9,
            timestamp: Math.floor(Date.now() / 1000)
        };

        return { ...defaults, ...overrides };
    }

    /**
     * Export plant configuration to JSON
     */
    static exportPlant(plant) {
        try {
            const exported = {
                ...plant,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
            return JSON.stringify(exported, null, 2);
        } catch (error) {
            throw new Error(`Failed to export plant: ${error.message}`);
        }
    }

    /**
     * Import plant configuration from JSON
     */
    static importPlant(jsonString) {
        try {
            const plant = JSON.parse(jsonString);
            return this.validateSinglePlant(plant);
        } catch (error) {
            throw new Error(`Failed to import plant: ${error.message}`);
        }
    }

    /**
     * Get plant statistics
     */
    static getPlantStats(plants) {
        if (!Array.isArray(plants) || plants.length === 0) {
            return {
                total: 0,
                avgIterations: 0,
                avgAngle: 0,
                mostComplex: null,
                simplest: null
            };
        }

        const totalIterations = plants.reduce((sum, plant) => sum + plant.iterations, 0);
        const totalAngles = plants.reduce((sum, plant) => sum + plant.angle, 0);

        const sortedByComplexity = [...plants].sort((a, b) => {
            const aComplexity = a.iterations * Object.keys(a.rules).length;
            const bComplexity = b.iterations * Object.keys(b.rules).length;
            return bComplexity - aComplexity;
        });

        return {
            total: plants.length,
            avgIterations: Math.round(totalIterations / plants.length * 10) / 10,
            avgAngle: Math.round(totalAngles / plants.length * 10) / 10,
            mostComplex: sortedByComplexity[0],
            simplest: sortedByComplexity[sortedByComplexity.length - 1]
        };
    }

    /**
     * Format API error for user display
     */
    static formatError(error) {
        if (error.message.includes('timeout')) {
            return 'Connection timeout. Please check your internet connection and try again.';
        }

        if (error.message.includes('HTTP 404')) {
            return 'API endpoint not found. Please check if the server is running.';
        }

        if (error.message.includes('HTTP 500')) {
            return 'Server error. Please try again later.';
        }

        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            return 'Network error. Please check if the API server is running.';
        }

        return `Error: ${error.message}`;
    }

    /**
     * Utility function to introduce delays
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate a unique ID for new plants
     */
    static generatePlantId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Batch operations helper
     */
    static async batchOperation(items, operation, batchSize = 5, delay = 100) {
        const results = [];

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchPromises = batch.map(operation);

            try {
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults);

                // Add delay between batches to avoid overwhelming the server
                if (i + batchSize < items.length) {
                    await this.delay(delay);
                }
            } catch (error) {
                console.error(`Batch operation failed for batch starting at index ${i}:`, error);
                throw error;
            }
        }

        return results;
    }
}
