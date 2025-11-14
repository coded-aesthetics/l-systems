/**
 * API Integration Wrapper
 *
 * This module provides a simple wrapper to integrate API functionality
 * with the existing LSystemApp without major refactoring.
 */

import {
    apiClient,
    ApiClient,
    PlantConfig,
    ApiResponse,
} from "./services/ApiClient.js";

export interface SavedPlant {
    name: string;
    timestamp: number;
    // L-System parameters
    axiom: string;
    rules: string;
    iterations: number;
    angle: number;
    angleVariation: number;
    lengthVariation: number;
    lengthTapering: number;
    // Geometry parameters
    length: number;
    thickness: number;
    tapering: number;
    segments: number;
    // Leaf parameters
    leafProbability: number;
    leafThreshold: number;
    leafColor: string;
    // Camera state
    zoom: number;
    rotationSpeed: number;
    manualRotationX: number;
    manualRotationY: number;
    panX: number;
    panY: number;
    autoRotation: number;
}

export class ApiWrapper {
    private apiAvailable: boolean = false;

    /**
     * Initialize API connection and check for migration
     */
    async initialize(): Promise<void> {
        try {
            this.apiAvailable = await apiClient.isAvailable();
            if (this.apiAvailable) {
                console.log("✓ API connected successfully");
                await this.checkForMigration();
            } else {
                console.log("⚠ API unavailable, using localStorage fallback");
            }
        } catch (error) {
            console.warn(
                "API check failed, using localStorage fallback:",
                error,
            );
            this.apiAvailable = false;
        }
    }

    /**
     * Check if there's localStorage data that should be migrated
     */
    private async checkForMigration(): Promise<void> {
        const localStoragePlants = this.getSavedPlantsFromStorage();
        if (localStoragePlants.length === 0) return;

        const migrate = confirm(
            `Found ${localStoragePlants.length} plants in local storage. Would you like to migrate them to the database?`,
        );

        if (!migrate) return;

        try {
            const response = await apiClient.migratePlants(localStoragePlants);
            if (response.error) {
                throw new Error(response.error);
            }

            if (response.data) {
                const { migrated_count, errors } = response.data;
                let message = `Migration completed! ${migrated_count} plants migrated.`;

                if (errors.length > 0) {
                    message += ` ${errors.length} errors occurred.`;
                    console.warn("Migration errors:", errors);
                }

                alert(message);

                // Ask if user wants to clear localStorage
                const clearLocal = confirm(
                    "Migration successful! Would you like to clear the local storage data?",
                );
                if (clearLocal) {
                    localStorage.removeItem("lsystem-saved-plants");
                }
            }
        } catch (error) {
            console.error("Migration failed:", error);
            alert("Migration failed. Please try again later.");
        }
    }

    /**
     * Get saved plants (API or localStorage)
     */
    async getSavedPlants(): Promise<SavedPlant[]> {
        try {
            if (this.apiAvailable) {
                const response = await apiClient.getAllPlants();
                if (!response.error && response.data) {
                    return response.data.map(this.convertApiToSavedPlant);
                }
            }
        } catch (error) {
            console.warn("API error, falling back to localStorage:", error);
        }

        // Fallback to localStorage
        return this.getSavedPlantsFromStorage();
    }

    /**
     * Save a plant (API or localStorage)
     */
    async savePlant(
        savedPlant: SavedPlant,
    ): Promise<{ success: boolean; message: string }> {
        try {
            if (this.apiAvailable) {
                const plantConfig = this.convertSavedPlantToApi(savedPlant);

                // Check if plant already exists
                const existingResponse = await apiClient.getPlantByName(
                    savedPlant.name,
                );
                if (!existingResponse.error && existingResponse.data) {
                    if (
                        !confirm(
                            `A plant named "${savedPlant.name}" already exists. Do you want to overwrite it?`,
                        )
                    ) {
                        return {
                            success: false,
                            message: "Save cancelled by user",
                        };
                    }
                }

                const response = await apiClient.savePlant(plantConfig);
                if (response.error) {
                    throw new Error(response.error);
                }

                return {
                    success: true,
                    message: `Plant "${savedPlant.name}" saved successfully!`,
                };
            } else {
                // Fallback to localStorage
                this.saveToLocalStorage(savedPlant);
                return {
                    success: true,
                    message: `Plant "${savedPlant.name}" saved locally (API unavailable)`,
                };
            }
        } catch (error) {
            console.error("Error saving plant:", error);
            return {
                success: false,
                message: "Failed to save plant. Please try again.",
            };
        }
    }

    /**
     * Delete a plant (API or localStorage)
     */
    async deletePlant(
        plantName: string,
    ): Promise<{ success: boolean; message: string }> {
        try {
            if (this.apiAvailable) {
                const response = await apiClient.deletePlantByName(plantName);
                if (response.error) {
                    throw new Error(response.error);
                }
            } else {
                // Fallback to localStorage
                const savedPlants = this.getSavedPlantsFromStorage();
                const filteredPlants = savedPlants.filter(
                    (p) => p.name !== plantName,
                );

                if (filteredPlants.length === savedPlants.length) {
                    throw new Error("Plant not found");
                }

                localStorage.setItem(
                    "lsystem-saved-plants",
                    JSON.stringify(filteredPlants),
                );
            }

            return {
                success: true,
                message: `Plant "${plantName}" deleted successfully!`,
            };
        } catch (error) {
            console.error("Error deleting plant:", error);
            return {
                success: false,
                message: "Failed to delete plant. Please try again.",
            };
        }
    }

    /**
     * Convert API PlantConfig to SavedPlant format
     */
    private convertApiToSavedPlant(config: PlantConfig): SavedPlant {
        return {
            name: config.name,
            timestamp: config.timestamp,
            axiom: config.axiom,
            rules: config.rules,
            iterations: config.iterations,
            angle: config.angle,
            angleVariation: config.angleVariation || 0,
            lengthVariation: config.lengthVariation || 0,
            lengthTapering: config.lengthTapering || 1.0,
            length: config.length || 1.0,
            thickness: config.thickness || 0.1,
            tapering: config.tapering || 0.8,
            segments: 10, // Default value
            leafProbability: config.leafProbability || 0,
            leafThreshold: config.leafGenerationThreshold || 0,
            leafColor: "#22aa22", // Default leaf color
            // Default camera values (not persisted to API)
            zoom: 5.0,
            rotationSpeed: 0.5,
            manualRotationX: 0,
            manualRotationY: 0,
            panX: 0,
            panY: 0,
            autoRotation: 0,
        };
    }

    /**
     * Convert SavedPlant to API PlantConfig format
     */
    private convertSavedPlantToApi(
        savedPlant: SavedPlant,
    ): Omit<PlantConfig, "id" | "timestamp"> {
        return {
            name: savedPlant.name,
            axiom: savedPlant.axiom,
            rules: savedPlant.rules,
            iterations: savedPlant.iterations,
            angle: savedPlant.angle,
            angleVariation: savedPlant.angleVariation,
            lengthVariation: savedPlant.lengthVariation,
            lengthTapering: savedPlant.lengthTapering,
            leafProbability: savedPlant.leafProbability,
            leafGenerationThreshold: savedPlant.leafThreshold,
            length: savedPlant.length,
            thickness: savedPlant.thickness,
            tapering: savedPlant.tapering,
        };
    }

    /**
     * Save to localStorage (fallback method)
     */
    private saveToLocalStorage(savedPlant: SavedPlant): void {
        const savedPlants = this.getSavedPlantsFromStorage();
        const existingIndex = savedPlants.findIndex(
            (p) => p.name === savedPlant.name,
        );

        if (existingIndex >= 0) {
            savedPlants[existingIndex] = savedPlant;
        } else {
            savedPlants.push(savedPlant);
        }

        localStorage.setItem(
            "lsystem-saved-plants",
            JSON.stringify(savedPlants),
        );
    }

    /**
     * Get saved plants from localStorage
     */
    private getSavedPlantsFromStorage(): SavedPlant[] {
        try {
            const saved = localStorage.getItem("lsystem-saved-plants");
            if (!saved) return [];

            const plants = JSON.parse(saved);
            if (!Array.isArray(plants)) {
                console.warn("Invalid plants data format, resetting");
                localStorage.removeItem("lsystem-saved-plants");
                return [];
            }

            // Basic validation
            const validPlants = plants.filter((plant) => {
                return (
                    plant &&
                    typeof plant.name === "string" &&
                    typeof plant.axiom === "string" &&
                    typeof plant.rules === "string" &&
                    typeof plant.iterations === "number" &&
                    typeof plant.angle === "number"
                );
            });

            // If we filtered out any plants, update localStorage
            if (validPlants.length !== plants.length) {
                console.warn(
                    `Filtered out ${plants.length - validPlants.length} invalid plants`,
                );
                localStorage.setItem(
                    "lsystem-saved-plants",
                    JSON.stringify(validPlants),
                );
            }

            return validPlants;
        } catch (error) {
            console.error("Error reading saved plants:", error);
            localStorage.removeItem("lsystem-saved-plants");
            return [];
        }
    }

    /**
     * Check if API is available
     */
    isApiAvailable(): boolean {
        return this.apiAvailable;
    }
}

// Create singleton instance
export const apiWrapper = new ApiWrapper();
