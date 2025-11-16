import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { SceneManager } from "./SceneManager.ts";
import { LightingSystem } from "../systems/LightingSystem.ts";
import { PlayerSystem } from "../systems/PlayerSystem.ts";
import { PlantSystem } from "../systems/PlantSystem.ts";
import { UISystem } from "../systems/UISystem.ts";
import { MathUtils } from "../utils/math.ts";

interface ForestStats {
    plants: number;
    triangles: number;
    fps: number;
    stamina: number;
    maxStamina: number;
    timeString: string;
    period: string;
    fogStatus: string;
}

interface PlantPosition {
    x: number;
    z: number;
}

interface FormValues {
    plantCount: number;
    forestSize: number;
    minDistance: number;
    scaleVariation: number;
    terrainHeight: number;
}

declare global {
    interface Window {
        forestGenerator: ForestGenerator | null;
    }
}

export class ForestGenerator {
    public sceneManager: SceneManager | null;
    public lightingSystem: LightingSystem | null;
    public playerSystem: PlayerSystem | null;
    public plantSystem: PlantSystem | null;
    public uiSystem: UISystem | null;

    private animationId: number | null;
    private clock: THREE.Clock;
    private frameCount: number;
    private lastTime: number;
    private lastFPSUpdate: number;

    private stats: ForestStats;

    constructor() {
        this.sceneManager = null;
        this.lightingSystem = null;
        this.playerSystem = null;
        this.plantSystem = null;
        this.uiSystem = null;

        this.animationId = null;
        this.clock = new THREE.Clock();
        this.frameCount = 0;
        this.lastTime = 0;
        this.lastFPSUpdate = 0;

        this.stats = {
            plants: 0,
            triangles: 0,
            fps: 0,
            stamina: 100,
            maxStamina: 100,
            timeString: "12:00",
            period: "Day",
            fogStatus: "Clear",
        };

        // Make this globally accessible for UI callbacks
        window.forestGenerator = this;
    }

    public async init(): Promise<void> {
        console.log("ForestGenerator: Initializing...");

        try {
            // Initialize core scene management
            await this.initializeScene();

            // Initialize all systems
            await this.initializeSystems();

            // Start the main animation loop
            this.animate();

            console.log("ForestGenerator: Initialization complete");
        } catch (error) {
            console.error("ForestGenerator: Initialization failed:", error);
            throw error;
        }
    }

    private async initializeScene(): Promise<void> {
        this.sceneManager = new SceneManager();
        await this.sceneManager.init();
    }

    private async initializeSystems(): Promise<void> {
        // Initialize UI System first (needed for callbacks)
        this.uiSystem = new UISystem();
        this.uiSystem.init(this);

        // Initialize Lighting System
        this.lightingSystem = new LightingSystem(
            this.sceneManager.scene,
            this.sceneManager.renderer,
        );
        await this.lightingSystem.init();

        // Initialize Player System
        this.playerSystem = new PlayerSystem(
            this.sceneManager.scene,
            this.sceneManager.camera,
            this.sceneManager.controls,
            (x: number, z: number) => this.sceneManager.getGroundHeight(x, z),
        );
        await this.playerSystem.init();

        // Initialize Plant System
        this.plantSystem = new PlantSystem(this.sceneManager.scene);
        await this.plantSystem.init(this.sceneManager.forestGroup);

        console.log("All systems initialized successfully");
    }

    public async generateForest(): Promise<void> {
        console.log("=== FOREST GENERATION START ===");

        if (!this.plantSystem || !this.uiSystem) {
            throw new Error("Systems not initialized");
        }

        const selectedPlants = this.plantSystem.getSelectedPlants();
        console.log("Selected plants from plantSystem:", selectedPlants);
        console.log("Selected plants length:", selectedPlants.length);

        if (selectedPlants.length === 0) {
            throw new Error("No plants selected");
        }

        const formValues = this.uiSystem.getFormValues();
        console.log("Form values:", formValues);

        // Clear existing forest
        await this.clearForest();

        // Generate plant positions
        const positions = this.generatePlantPositions(
            formValues.plantCount,
            formValues.forestSize,
            formValues.minDistance,
        );

        console.log(
            `Generated ${positions.length} positions for ${formValues.plantCount} requested plants`,
        );
        console.log("Position sample:", positions.slice(0, 3));

        // Create weighted array for plant selection
        const weightedPlants = this.plantSystem.createWeightedPlantArray();
        console.log("Weighted plants array length:", weightedPlants.length);
        console.log("Weighted plants sample:", weightedPlants.slice(0, 3));

        if (weightedPlants.length === 0) {
            console.error("No weighted plants available!");
            return;
        }

        // Generate plants
        let successCount = 0;
        for (let i = 0; i < positions.length; i++) {
            const position = positions[i];
            const selectedPlant =
                weightedPlants[
                    Math.floor(Math.random() * weightedPlants.length)
                ];

            console.log(`=== PLANT ${i + 1}/${positions.length} ===`);
            console.log("Position:", position);
            console.log("Selected plant:", selectedPlant);

            try {
                const plantMesh = await this.plantSystem.generatePlantMesh(
                    selectedPlant.plant,
                    this.calculatePlantScale(formValues.scaleVariation),
                );

                console.log("Generated plant mesh:", plantMesh);

                if (plantMesh) {
                    // Apply random scale variation
                    const scaleMultiplier = this.calculatePlantScale(
                        formValues.scaleVariation,
                    );
                    plantMesh.scale.setScalar(scaleMultiplier);

                    // Position on terrain
                    const terrainY = this.getGroundHeight(
                        position.x,
                        position.z,
                        formValues.terrainHeight,
                    );
                    plantMesh.position.set(position.x, terrainY, position.z);

                    console.log("Plant positioned at:", plantMesh.position);

                    // Random rotation
                    plantMesh.rotation.y = Math.random() * Math.PI * 2;

                    // Enable shadows
                    plantMesh.traverse((child) => {
                        if ((child as any).isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    // Store mesh group reference for proper disposal
                    if (plantMesh.userData) {
                        plantMesh.userData.plantName = selectedPlant.plant.name;
                    }

                    // Add to forest
                    this.sceneManager.addToForest(plantMesh);
                    successCount++;

                    console.log(`Plant ${i + 1} added to forest successfully`);

                    // Check forest group status
                    const stats = this.sceneManager.getStats();
                    console.log("Current forest stats:", stats);
                } else {
                    console.warn(`Plant ${i + 1} mesh was null`);
                }

                // Update progress occasionally
                if (i % 10 === 0) {
                    await new Promise((resolve) => setTimeout(resolve, 1));
                }
            } catch (error) {
                console.error(
                    `Failed to generate plant at position ${i}:`,
                    error,
                );
            }
        }

        console.log(
            `Forest generation complete: ${successCount}/${positions.length} plants created`,
        );

        this.updateStats();
        console.log("=== FOREST GENERATION END ===");
    }

    private generatePlantPositions(
        count: number,
        size: number,
        minDistance: number,
    ): PlantPosition[] {
        // Use improved Poisson disk sampling for natural distribution
        return MathUtils.generatePoissonPositions(count, size, minDistance);
    }

    private calculatePlantScale(scaleVariation: number): number {
        return 1 + (Math.random() - 0.5) * (scaleVariation / 100) * 2;
    }

    private getGroundHeight(
        x: number,
        z: number,
        terrainHeight: number,
    ): number {
        if (terrainHeight === 0) {
            // Optimization: if no terrain variation, use ground level
            return this.sceneManager.groundLevel;
        } else {
            // Use raycast to get exact terrain height
            return this.sceneManager.getGroundHeight(x, z);
        }
    }

    public async clearForest(): Promise<void> {
        if (this.plantSystem) {
            await this.plantSystem.clearForest();
        }
        if (this.sceneManager) {
            this.sceneManager.clearForest();
        }
        this.updateStats();
    }

    public exportForest(): void {
        if (!this.sceneManager || !this.sceneManager.forestGroup) {
            throw new Error("No forest to export");
        }

        const exporter = new GLTFExporter();

        exporter.parse(
            this.sceneManager.forestGroup,
            (result) => {
                const output = JSON.stringify(result, null, 2);
                this.downloadFile(output, "forest.gltf", "application/json");
            },
            (error) => {
                console.error("Export error:", error);
                throw new Error("Failed to export forest");
            },
        );
    }

    private downloadFile(
        content: string,
        filename: string,
        contentType: string,
    ): void {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    public handleResize(): void {
        if (this.sceneManager) {
            this.sceneManager.handleResize();
        }
    }

    private animate(): void {
        this.animationId = requestAnimationFrame(() => this.animate());

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update all systems
        if (this.playerSystem) {
            this.playerSystem.update(deltaTime);
        }

        if (this.lightingSystem && this.sceneManager) {
            this.lightingSystem.update(this.sceneManager.camera);
        }

        // Update stats periodically
        this.frameCount++;
        if (currentTime - this.lastFPSUpdate > 1000) {
            this.updateStats();
            this.lastFPSUpdate = currentTime;
            this.frameCount = 0;
        }

        // Render the scene
        if (this.sceneManager) {
            this.sceneManager.render();
        }
    }

    private updateStats(): void {
        // Get scene statistics
        const sceneStats = this.sceneManager
            ? this.sceneManager.getStats()
            : { plants: 0, triangles: 0 };

        // Calculate FPS
        const fps = this.frameCount;

        // Get player stats
        const playerStats = this.playerSystem
            ? this.playerSystem.getStats()
            : { stamina: 100, maxStamina: 100 };

        // Get lighting stats
        const lightingStats = this.lightingSystem
            ? this.lightingSystem.getStats()
            : { timeString: "12:00", period: "Day", fogStatus: "Clear" };

        // Update stats object
        this.stats = {
            plants: sceneStats.plants || 0,
            triangles: Math.floor(sceneStats.triangles || 0),
            fps: fps,
            stamina: playerStats.stamina || 100,
            maxStamina: playerStats.maxStamina || 100,
            timeString: lightingStats.timeString || "12:00",
            period: lightingStats.period || "Day",
            fogStatus: lightingStats.fogStatus || "Clear",
        };

        // Update UI
        if (this.uiSystem) {
            this.uiSystem.updateStats(this.stats);
        }
    }

    // Global functions for UI callbacks
    public showTutorial(): void {
        if (this.uiSystem) {
            this.uiSystem.showTutorial();
        }
    }

    public toggleFullscreen(): void {
        if (this.uiSystem) {
            this.uiSystem.toggleFullscreen();
        }
    }

    // Keyboard event handlers for player system
    public onKeyDown(event: KeyboardEvent): void {
        // Handle fullscreen toggle first
        if (event.code === "Tab") {
            event.preventDefault();
            if (this.uiSystem) {
                this.uiSystem.toggleFullscreen();
            }
            return;
        }

        if (
            event.code === "Escape" &&
            this.uiSystem &&
            this.uiSystem.isFullscreen
        ) {
            if (this.uiSystem) {
                this.uiSystem.toggleFullscreen();
            }
            return;
        }

        if (this.playerSystem) {
            this.playerSystem.onKeyDown(event);
        }
        if (this.lightingSystem) {
            this.lightingSystem.onKeyDown(event);
        }
    }

    public onKeyUp(event: KeyboardEvent): void {
        if (this.playerSystem) {
            this.playerSystem.onKeyUp(event);
        }
        if (this.lightingSystem) {
            this.lightingSystem.onKeyUp(event);
        }
    }

    // Terrain management methods for UI integration
    public setTerrainType(type: string): void {
        if (this.sceneManager) {
            // Convert string to TerrainType enum
            const terrainType = type as any; // Type assertion for enum
            this.sceneManager.setTerrainType(terrainType);
        }
    }

    public setTerrainHeightVariation(variation: number): void {
        if (this.sceneManager) {
            this.sceneManager.setTerrainHeightVariation(variation);
        }
    }

    public setTerrainColor(color: number): void {
        if (this.sceneManager) {
            this.sceneManager.setTerrainColor(color);
        }
    }

    public regenerateTerrain(): void {
        if (this.sceneManager) {
            this.sceneManager.regenerateTerrain();
        }
    }

    public getTerrainStats(): any {
        return this.sceneManager ? this.sceneManager.getTerrainStats() : null;
    }

    public getSafeSpawnPosition(): THREE.Vector3 {
        return this.sceneManager
            ? this.sceneManager.getSafeSpawnPosition()
            : new THREE.Vector3(0, -2, 0);
    }

    public dispose(): void {
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Dispose all systems
        if (this.uiSystem) {
            this.uiSystem.dispose();
            this.uiSystem = null;
        }

        if (this.plantSystem) {
            this.plantSystem.dispose();
            this.plantSystem = null;
        }

        if (this.playerSystem) {
            this.playerSystem.dispose();
            this.playerSystem = null;
        }

        if (this.lightingSystem) {
            this.lightingSystem.dispose();
            this.lightingSystem = null;
        }

        if (this.sceneManager) {
            this.sceneManager.dispose();
            this.sceneManager = null;
        }

        // Clear global reference
        if (window.forestGenerator === this) {
            window.forestGenerator = null;
        }

        console.log("ForestGenerator disposed");
    }
}
