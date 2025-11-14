/**
 * API Client for L-System Plant Configurations
 *
 * This service handles all communication with the Flask API backend,
 * replacing localStorage-based plant configuration storage.
 */

export interface PlantConfig {
    id?: number;
    name: string;
    timestamp: number;
    // L-System parameters
    axiom: string;
    rules: string;
    iterations: number;
    angle: number;
    angleVariation?: number;
    lengthVariation?: number;
    lengthTapering?: number;
    leafProbability?: number;
    leafGenerationThreshold?: number;
    // Geometry parameters
    length?: number;
    thickness?: number;
    tapering?: number;
}

export interface ApiResponse<T> {
    data?: T;
    error?: string;
}

export class ApiClient {
    private baseUrl: string;
    private timeout: number;

    constructor(
        baseUrl: string = "http://localhost:5001",
        timeout: number = 10000,
    ) {
        this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
        this.timeout = timeout;
    }

    /**
     * Make an HTTP request with timeout and error handling
     */
    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {},
    ): Promise<ApiResponse<T>> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers,
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    error:
                        errorData.error ||
                        `HTTP ${response.status}: ${response.statusText}`,
                };
            }

            const data = await response.json();
            return { data };
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    return {
                        error: "Request timeout - please check if the API server is running",
                    };
                }
                return { error: error.message };
            }

            return { error: "Unknown error occurred" };
        }
    }

    /**
     * Test API connectivity
     */
    async healthCheck(): Promise<
        ApiResponse<{ status: string; timestamp: number }>
    > {
        return this.makeRequest("/api/health");
    }

    /**
     * Get all plant configurations
     */
    async getAllPlants(): Promise<ApiResponse<PlantConfig[]>> {
        return this.makeRequest("/api/plants");
    }

    /**
     * Get a plant configuration by ID
     */
    async getPlant(id: number): Promise<ApiResponse<PlantConfig>> {
        return this.makeRequest(`/api/plants/${id}`);
    }

    /**
     * Get a plant configuration by name
     */
    async getPlantByName(name: string): Promise<ApiResponse<PlantConfig>> {
        const encodedName = encodeURIComponent(name);
        return this.makeRequest(`/api/plants/${encodedName}`);
    }

    /**
     * Create a new plant configuration
     */
    async createPlant(
        plant: Omit<PlantConfig, "id" | "timestamp">,
    ): Promise<ApiResponse<PlantConfig>> {
        const plantData: PlantConfig = {
            ...plant,
            timestamp: Date.now(),
        };

        return this.makeRequest("/api/plants", {
            method: "POST",
            body: JSON.stringify(plantData),
        });
    }

    /**
     * Update an existing plant configuration
     */
    async updatePlant(
        id: number,
        updates: Partial<PlantConfig>,
    ): Promise<ApiResponse<PlantConfig>> {
        return this.makeRequest(`/api/plants/${id}`, {
            method: "PUT",
            body: JSON.stringify(updates),
        });
    }

    /**
     * Delete a plant configuration by ID
     */
    async deletePlant(id: number): Promise<ApiResponse<{ message: string }>> {
        return this.makeRequest(`/api/plants/${id}`, {
            method: "DELETE",
        });
    }

    /**
     * Delete a plant configuration by name
     */
    async deletePlantByName(
        name: string,
    ): Promise<ApiResponse<{ message: string }>> {
        const encodedName = encodeURIComponent(name);
        return this.makeRequest(`/api/plants/name/${encodedName}`, {
            method: "DELETE",
        });
    }

    /**
     * Migrate plants from localStorage format
     */
    async migratePlants(plants: any[]): Promise<
        ApiResponse<{
            message: string;
            migrated_count: number;
            errors: string[];
        }>
    > {
        return this.makeRequest("/api/plants/migrate", {
            method: "POST",
            body: JSON.stringify({ plants }),
        });
    }

    /**
     * Check if API is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const response = await this.healthCheck();
            return !response.error;
        } catch {
            return false;
        }
    }

    /**
     * Save or update a plant (convenience method)
     * If plant exists (by name), update it. Otherwise, create new.
     */
    async savePlant(
        plant: Omit<PlantConfig, "id" | "timestamp">,
    ): Promise<ApiResponse<PlantConfig>> {
        // First try to get existing plant by name
        const existingResponse = await this.getPlantByName(plant.name);

        if (!existingResponse.error && existingResponse.data) {
            // Plant exists, update it
            return this.updatePlant(existingResponse.data.id!, plant);
        } else {
            // Plant doesn't exist, create new
            return this.createPlant(plant);
        }
    }

    /**
     * Convert SavedPlant format to PlantConfig format (for migration)
     */
    static convertSavedPlantToConfig(savedPlant: any): PlantConfig {
        return {
            name: savedPlant.name,
            timestamp: savedPlant.timestamp || Date.now(),
            axiom: savedPlant.axiom,
            rules: savedPlant.rules,
            iterations: savedPlant.iterations,
            angle: savedPlant.angle,
            angleVariation: savedPlant.angleVariation || 0,
            lengthVariation: savedPlant.lengthVariation || 0,
            lengthTapering: savedPlant.lengthTapering || 1.0,
            leafProbability: savedPlant.leafProbability || 0,
            leafGenerationThreshold: savedPlant.leafThreshold || 0,
            length: savedPlant.length || 1.0,
            thickness: savedPlant.thickness || 0.1,
            tapering: savedPlant.tapering || 0.8,
        };
    }

    /**
     * Convert PlantConfig format to the format expected by L-system library
     */
    static convertConfigToLSystemParams(config: PlantConfig) {
        return {
            axiom: config.axiom,
            rules: config.rules,
            iterations: config.iterations,
            angle: config.angle,
            angleVariation: config.angleVariation || 0,
            lengthVariation: config.lengthVariation || 0,
            lengthTapering: config.lengthTapering || 1.0,
            leafProbability: config.leafProbability || 0,
            leafGenerationThreshold: config.leafGenerationThreshold || 0,
        };
    }

    /**
     * Convert PlantConfig to geometry parameters
     */
    static convertConfigToGeometryParams(config: PlantConfig) {
        return {
            length: config.length || 1.0,
            thickness: config.thickness || 0.1,
            tapering: config.tapering || 0.8,
        };
    }
}

// Create default instance
export const apiClient = new ApiClient();
