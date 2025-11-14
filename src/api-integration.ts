/**
 * API Integration Patch for L-System Application
 *
 * This file contains the methods needed to integrate the API client
 * into the main LSystemApp class, replacing localStorage functionality.
 */

import {
    apiClient,
    ApiClient,
    PlantConfig,
    ApiResponse,
} from "./services/ApiClient.js";

/**
 * API-related methods to be integrated into LSystemApp
 */
export class ApiIntegration {
    private apiAvailable: boolean = false;

    /**
     * Check API availability and initialize accordingly
     */
    async checkApiAvailability(): Promise<void> {
        try {
            this.apiAvailable = await apiClient.isAvailable();
            if (this.apiAvailable) {
                console.log("✓ API connected successfully");
                // Check for localStorage data to migrate
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
    async checkForMigration(): Promise<void> {
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

                this.showMessage?.(message, "success");

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
            this.showMessage?.(
                "Migration failed. Please try again later.",
                "error",
            );
        }
    }

    /**
     * Save plant using API or localStorage fallback
     */
    async savePlant(
        plantConfig: Omit<PlantConfig, "id" | "timestamp">,
    ): Promise<void> {
        try {
            if (this.apiAvailable) {
                // Check if plant already exists
                const existingResponse = await apiClient.getPlantByName(
                    plantConfig.name,
                );
                if (!existingResponse.error && existingResponse.data) {
                    if (
                        !confirm(
                            `A plant named "${plantConfig.name}" already exists. Do you want to overwrite it?`,
                        )
                    ) {
                        return;
                    }
                }

                // Save to API
                const response = await apiClient.savePlant(plantConfig);

                if (response.error) {
                    throw new Error(response.error);
                }

                this.showMessage?.(
                    `Plant "${plantConfig.name}" saved successfully!`,
                    "success",
                );
            } else {
                // Fallback to localStorage
                this.saveToLocalStorage(plantConfig);
                this.showMessage?.(
                    `Plant "${plantConfig.name}" saved locally (API unavailable)`,
                    "success",
                );
            }
        } catch (error) {
            console.error("Error saving plant:", error);
            this.showMessage?.(
                "Failed to save plant. Please try again.",
                "error",
            );
            throw error;
        }
    }

    /**
     * Load plant using API or localStorage fallback
     */
    async loadPlant(plantName: string): Promise<PlantConfig | null> {
        try {
            let plantConfig: PlantConfig | null = null;

            if (this.apiAvailable) {
                const response = await apiClient.getPlantByName(plantName);
                if (response.error) {
                    throw new Error(response.error);
                }
                plantConfig = response.data!;
            } else {
                // Fallback to localStorage
                const savedPlants = this.getSavedPlantsFromStorage();
                const plant = savedPlants.find((p) => p.name === plantName);
                if (!plant) {
                    throw new Error("Plant not found");
                }
                plantConfig = ApiClient.convertSavedPlantToConfig(plant);
            }

            if (!plantConfig) {
                throw new Error("Plant not found");
            }

            this.showMessage?.(
                `Plant "${plantName}" loaded successfully!`,
                "success",
            );

            return plantConfig;
        } catch (error) {
            console.error("Error loading plant:", error);
            this.showMessage?.(
                "Failed to load plant. Please try again.",
                "error",
            );
            return null;
        }
    }

    /**
     * Delete plant using API or localStorage fallback
     */
    async deletePlant(plantName: string): Promise<void> {
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

            this.showMessage?.(
                `Plant "${plantName}" deleted successfully!`,
                "success",
            );
        } catch (error) {
            console.error("Error deleting plant:", error);
            this.showMessage?.(
                "Failed to delete plant. Please try again.",
                "error",
            );
            throw error;
        }
    }

    /**
     * Get all plants using API or localStorage fallback
     */
    async getAllPlants(): Promise<PlantConfig[]> {
        try {
            if (this.apiAvailable) {
                const response = await apiClient.getAllPlants();
                if (response.error) {
                    console.warn(
                        "API error, falling back to localStorage:",
                        response.error,
                    );
                    // Fall through to localStorage
                } else {
                    return response.data || [];
                }
            }

            // Fallback to localStorage
            const savedPlants = this.getSavedPlantsFromStorage();
            return savedPlants.map((plant) =>
                ApiClient.convertSavedPlantToConfig(plant),
            );
        } catch (error) {
            console.error("Error getting plants:", error);
            return [];
        }
    }

    /**
     * Update load options dropdown
     */
    async updateLoadOptions(
        loadSelect: HTMLSelectElement,
        deleteButton: HTMLButtonElement,
        loadButton: HTMLButtonElement,
    ): Promise<void> {
        const plants = await this.getAllPlants();

        // Clear existing options
        loadSelect.innerHTML = '<option value="">Select a plant...</option>';

        // Sort plants by timestamp (newest first)
        plants.sort((a, b) => b.timestamp - a.timestamp);

        // Add options for each saved plant
        for (const plant of plants) {
            const option = document.createElement("option");
            option.value = plant.name;
            const date = new Date(plant.timestamp).toLocaleString();
            option.textContent = `${plant.name} (${date})`;
            loadSelect.appendChild(option);
        }

        // Update button states
        deleteButton.disabled = true;
        loadButton.disabled = true;
    }

    /**
     * Get current plant configuration in API format
     */
    getCurrentPlantConfig(
        plantNameInput: HTMLInputElement,
        axiomInput: HTMLTextAreaElement,
        rulesInput: HTMLTextAreaElement,
        iterationsSlider: HTMLInputElement,
        angleSlider: HTMLInputElement,
        angleVariationSlider: HTMLInputElement,
        lengthVariationSlider: HTMLInputElement,
        lengthTaperingSlider: HTMLInputElement,
        leafProbabilitySlider: HTMLInputElement,
        leafThresholdSlider: HTMLInputElement,
        lengthSlider: HTMLInputElement,
        thicknessSlider: HTMLInputElement,
        taperingSlider: HTMLInputElement,
    ): Omit<PlantConfig, "id" | "timestamp"> {
        return {
            name: plantNameInput.value.trim() || `Plant ${Date.now()}`,
            axiom: axiomInput.value,
            rules: rulesInput.value,
            iterations: parseInt(iterationsSlider.value),
            angle: parseFloat(angleSlider.value),
            angleVariation: parseFloat(angleVariationSlider.value),
            lengthVariation: parseFloat(lengthVariationSlider.value),
            lengthTapering: parseFloat(lengthTaperingSlider.value),
            leafProbability: parseFloat(leafProbabilitySlider.value),
            leafGenerationThreshold: parseInt(leafThresholdSlider.value),
            length: parseFloat(lengthSlider.value),
            thickness: parseFloat(thicknessSlider.value),
            tapering: parseFloat(taperingSlider.value),
        };
    }

    /**
     * Apply plant configuration to UI
     */
    applyPlantConfig(
        config: PlantConfig,
        axiomInput: HTMLTextAreaElement,
        rulesInput: HTMLTextAreaElement,
        iterationsSlider: HTMLInputElement,
        angleSlider: HTMLInputElement,
        angleVariationSlider: HTMLInputElement,
        lengthVariationSlider: HTMLInputElement,
        lengthTaperingSlider: HTMLInputElement,
        leafProbabilitySlider: HTMLInputElement,
        leafThresholdSlider: HTMLInputElement,
        lengthSlider: HTMLInputElement,
        thicknessSlider: HTMLInputElement,
        taperingSlider: HTMLInputElement,
        updateValueDisplays?: () => void,
    ): void {
        axiomInput.value = config.axiom;
        rulesInput.value = config.rules;
        iterationsSlider.value = config.iterations.toString();
        angleSlider.value = config.angle.toString();
        angleVariationSlider.value = (config.angleVariation || 0).toString();
        lengthVariationSlider.value = (config.lengthVariation || 0).toString();
        lengthTaperingSlider.value = (config.lengthTapering || 1.0).toString();
        leafProbabilitySlider.value = (config.leafProbability || 0).toString();
        leafThresholdSlider.value = (
            config.leafGenerationThreshold || 0
        ).toString();
        lengthSlider.value = (config.length || 1.0).toString();
        thicknessSlider.value = (config.thickness || 0.1).toString();
        taperingSlider.value = (config.tapering || 0.8).toString();

        // Update displays if function provided
        updateValueDisplays?.();
    }

    /**
     * Save to localStorage (fallback method)
     */
    private saveToLocalStorage(
        plantConfig: Omit<PlantConfig, "id" | "timestamp">,
    ): void {
        const savedPlants = this.getSavedPlantsFromStorage();
        const existingIndex = savedPlants.findIndex(
            (p) => p.name === plantConfig.name,
        );

        // Convert to SavedPlant format for localStorage compatibility
        const savedPlant: any = {
            ...plantConfig,
            timestamp: Date.now(),
            segments: 10, // Default value
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
    private getSavedPlantsFromStorage(): any[] {
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

    // Placeholder methods that should be implemented by the main class
    private showMessage?: (
        message: string,
        type: "success" | "error" | "info",
    ) => void;
}
