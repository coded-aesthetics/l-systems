import * as THREE from "three";

interface PlantData {
    id: number;
    name: string;
    axiom: string;
    rules: Record<string, string>;
    iterations: number;
    angle: number;
    angleVariation?: number;
    lengthVariation?: number;
    lengthTapering?: number;
    leafProbability?: number;
    leafGenerationThreshold?: number;
    length: number;
    thickness: number;
    tapering: number;
    timestamp: number;
}

interface SelectedPlant {
    plant: PlantData;
    weight: number;
}

interface WeightedPlant {
    plant: PlantData;
}

export class PlantSystem {
    private scene: THREE.Scene;
    private availablePlants: PlantData[];
    private selectedPlants: Map<number, SelectedPlant>;
    private loadingElement: HTMLElement | null;
    private forestGroup: THREE.Group | null;
    private barkTexture: THREE.Texture | null;

    // L-Systems integration - will be loaded dynamically
    private LSystemsLibrary: any;
    private ThreeJSAdapter: any;
    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.availablePlants = [];
        this.selectedPlants = new Map();
        this.loadingElement = null;
        this.forestGroup = null;
        this.barkTexture = null;

        // L-Systems integration - will be loaded dynamically
        this.LSystemsLibrary = null;
        this.ThreeJSAdapter = null;

        // Load bark texture
        this.loadBarkTexture();
    }

    public async init(forestGroup: THREE.Group): Promise<void> {
        this.forestGroup = forestGroup;
        this.setupUI();
        await this.loadLSystemsLibrary();
        await this.loadPlants();
    }

    private async loadLSystemsLibrary(): Promise<void> {
        try {
            // Dynamic import of L-Systems library components from main library
            const { LSystemsLibrary } = await import(
                "../../../dist/lib/LSystemsLibrary.js"
            );
            const { ThreeJSAdapter } = await import(
                "../../../dist/lib/adapters/ThreeJSAdapter.js"
            );

            this.LSystemsLibrary = LSystemsLibrary;
            this.ThreeJSAdapter = ThreeJSAdapter;

            console.log("L-Systems library loaded successfully");
        } catch (error) {
            console.warn("Failed to load L-Systems library:", error);
            console.log("Plant generation will fall back to simple geometry");
        }
    }

    private setupUI(): void {
        this.loadingElement = document.getElementById("plants-list");
    }

    public async loadPlants(): Promise<void> {
        console.log("PlantSystem: Loading plants...");

        if (this.loadingElement) {
            this.loadingElement.innerHTML =
                '<div class="loading">Loading plants...</div>';
        }

        try {
            // Try to load plants from API first
            const response = await fetch("http://localhost:5001/api/plants");

            if (!response.ok) {
                throw new Error("API not available");
            }

            this.availablePlants = await response.json();

            if (this.availablePlants.length === 0) {
                this.loadingElement.innerHTML =
                    '<div class="no-plants-message">No plants found in database</div>';
                return;
            }

            this.renderPlantsList();
        } catch (error) {
            console.warn("Failed to load plants from API:", error);

            // Fallback to default plant configurations
            this.loadDefaultPlants();
            this.renderPlantsList();
        }
    }

    private loadDefaultPlants(): void {
        // Default plant configurations when API is not available
        this.availablePlants = [
            {
                id: 1,
                name: "Simple Tree",
                axiom: "F",
                rules: { F: "F[+F]F[-F]F" },
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
                timestamp: Math.floor(Date.now() / 1000),
            },
            {
                id: 2,
                name: "Bushy Plant",
                axiom: "F",
                rules: { F: "FF+[+F-F-F]-[-F+F+F]" },
                iterations: 3,
                angle: 22.5,
                angleVariation: 10,
                lengthVariation: 30,
                lengthTapering: 85,
                leafProbability: 50,
                leafGenerationThreshold: 1,
                length: 3,
                thickness: 0.08,
                tapering: 0.8,
                timestamp: Math.floor(Date.now() / 1000),
            },
            {
                id: 3,
                name: "Tall Tree",
                axiom: "F",
                rules: { F: "F[+F]F[-F][F]" },
                iterations: 5,
                angle: 20,
                angleVariation: 8,
                lengthVariation: 15,
                lengthTapering: 95,
                leafProbability: 25,
                leafGenerationThreshold: 3,
                length: 8,
                thickness: 0.15,
                tapering: 0.95,
                timestamp: Math.floor(Date.now() / 1000),
            },
        ];
    }

    private renderPlantsList(): void {
        if (!this.loadingElement || this.availablePlants.length === 0) {
            if (this.loadingElement) {
                this.loadingElement.innerHTML =
                    '<div class="no-plants-message">No plants available</div>';
            }
            return;
        }

        this.loadingElement.innerHTML = "";

        this.availablePlants.forEach((plant) => {
            const plantItem = document.createElement("div");
            plantItem.className = "plant-item";

            const isSelected = this.selectedPlants.has(plant.id);
            if (isSelected) {
                plantItem.classList.add("selected");
            }

            plantItem.innerHTML = `
                <div>
                    <input type="checkbox" class="plant-checkbox" id="plant-${plant.id}"
                           ${isSelected ? "checked" : ""}
                           onchange="window.forestGenerator?.plantSystem?.togglePlant(${plant.id}, this.checked)">
                    <div class="plant-name">${plant.name}</div>
                    <div class="plant-info">
                        Iterations: ${plant.iterations} | Angle: ${plant.angle}° |
                        Created: ${new Date(plant.timestamp * 1000).toLocaleDateString()}
                    </div>
                    <div class="weight-control">
                        <label>Weight:</label>
                        <input type="range" min="1" max="100" value="50"
                               id="weight-${plant.id}"
                               onchange="window.forestGenerator?.plantSystem?.updatePlantWeight(${plant.id}, this.value)"
                               ${isSelected ? "" : "disabled"}>
                        <span class="weight-value" id="weight-value-${plant.id}">50</span>
                    </div>
                </div>
            `;

            this.loadingElement.appendChild(plantItem);
        });
    }

    public togglePlant(plantId: number, selected: boolean): void {
        console.log(
            `togglePlant called: plantId=${plantId}, selected=${selected}`,
        );
        console.log(`Current selectedPlants size:`, this.selectedPlants.size);

        const plantItem = document
            .querySelector(`#plant-${plantId}`)
            ?.closest(".plant-item");
        const weightSlider = document.getElementById(
            `weight-${plantId}`,
        ) as HTMLInputElement;

        if (selected) {
            const plant = this.availablePlants.find((p) => p.id === plantId);
            console.log("Found plant for selection:", plant);
            if (plant) {
                this.selectedPlants.set(plantId, {
                    plant: plant,
                    weight: parseInt(weightSlider?.value || "50"),
                });
                plantItem?.classList.add("selected");
                if (weightSlider) {
                    weightSlider.disabled = false;
                }
                console.log(
                    `Plant ${plant.name} added to selection. Total selected: ${this.selectedPlants.size}`,
                );
            } else {
                console.error(
                    `Plant with id ${plantId} not found in availablePlants`,
                );
            }
        } else {
            this.selectedPlants.delete(plantId);
            plantItem?.classList.remove("selected");
            if (weightSlider) {
                weightSlider.disabled = true;
            }
            console.log(
                `Plant ${plantId} removed from selection. Total selected: ${this.selectedPlants.size}`,
            );
        }
    }

    public updatePlantWeight(plantId: number, weight: string): void {
        const valueEl = document.getElementById(`weight-value-${plantId}`);
        if (valueEl) {
            valueEl.textContent = weight;
        }

        if (this.selectedPlants.has(plantId)) {
            const plantData = this.selectedPlants.get(plantId);
            if (plantData) {
                plantData.weight = parseInt(weight);
            }
            console.log(`Updated plant ${plantId} weight to ${weight}`);
        }
    }

    public getSelectedPlants(): SelectedPlant[] {
        const selected = Array.from(this.selectedPlants.values());
        console.log(
            "PlantSystem.getSelectedPlants():",
            selected.length,
            "plants selected",
        );
        console.log("Selected plants:", selected);
        return selected;
    }

    public createWeightedPlantArray(): WeightedPlant[] {
        const weightedPlants = [];
        this.selectedPlants.forEach((plantData) => {
            const { plant, weight } = plantData;
            for (let i = 0; i < weight; i++) {
                weightedPlants.push({ plant });
            }
        });
        return weightedPlants;
    }

    private generatePlantPositions(
        count: number,
        size: number,
        minDistance: number,
    ): { x: number; z: number }[] {
        const positions = [];
        const maxAttempts = count * 10;
        let attempts = 0;

        while (positions.length < count && attempts < maxAttempts) {
            const x = (Math.random() - 0.5) * size;
            const z = (Math.random() - 0.5) * size;
            const y = 0;

            const newPos = new THREE.Vector3(x, y, z);
            let validPosition = true;

            // Check minimum distance to existing plants
            for (const existingPos of positions) {
                if (newPos.distanceTo(existingPos) < minDistance) {
                    validPosition = false;
                    break;
                }
            }

            if (validPosition) {
                positions.push(newPos);
            }

            attempts++;
        }

        return positions;
    }

    public async generatePlantMesh(
        plantConfig: PlantData,
        scale: number = 1,
    ): Promise<THREE.Group | null> {
        console.log(
            "PlantSystem.generatePlantMesh called for:",
            plantConfig.name,
        );
        console.log("ThreeJSAdapter available:", !!this.ThreeJSAdapter);

        try {
            if (this.ThreeJSAdapter) {
                console.log("Using L-System generation");
                return await this.generateLSystemMesh(plantConfig, scale);
            } else {
                console.log(
                    "Using simple plant generation (no ThreeJSAdapter)",
                );
                return this.generateSimplePlantMesh(plantConfig, scale);
            }
        } catch (error) {
            console.warn(
                `Failed to generate plant mesh for ${plantConfig.name}:`,
                error,
            );
            console.log("Falling back to simple plant generation");
            return this.generateSimplePlantMesh(plantConfig, scale);
        }
    }

    private async generateLSystemMesh(
        plantConfig: PlantData,
        scale: number = 1,
    ): Promise<THREE.Group> {
        console.log("Generating L-system mesh for plant:", plantConfig.name);

        // Create L-System configuration for the adapter
        const config = {
            axiom: plantConfig.axiom,
            rules: plantConfig.rules,
            iterations: plantConfig.iterations,
            angle: plantConfig.angle,
            angleVariation: plantConfig.angleVariation || 0,
            lengthVariation: Math.min(
                100,
                Math.max(0, plantConfig.lengthVariation || 0),
            ),
            lengthTapering: Math.min(
                1,
                Math.max(0, (plantConfig.lengthTapering || 90) / 100),
            ),
            leafProbability: Math.min(
                1,
                Math.max(0, (plantConfig.leafProbability || 30) / 100),
            ),
            leafGenerationThreshold:
                Math.floor(plantConfig.leafGenerationThreshold) || 1,
        };

        // Create geometry parameters
        const geometryParams = {
            length: (plantConfig.length || 5) * scale,
            thickness: (plantConfig.thickness || 0.1) * scale,
            tapering: plantConfig.tapering || 0.9,
            leafColor: [
                0.2 + Math.random() * 0.3,
                0.4 + Math.random() * 0.4,
                0.1 + Math.random() * 0.2,
            ],
        };

        console.log("L-system config:", config);
        console.log("Geometry params:", geometryParams);

        try {
            // Generate mesh using ThreeJS adapter
            const meshGroup = this.ThreeJSAdapter.createMeshFromLSystem(
                config,
                geometryParams,
                {
                    materialType: "standard",
                    castShadow: true,
                    receiveShadow: true,
                },
            );

            // Apply bark texture to all branch/trunk materials
            this.applyBarkTextureToMesh(meshGroup);

            if (meshGroup && meshGroup.group) {
                const group = meshGroup.group;

                // Don't set position here - it will be set by forest generator
                // Don't set rotation here either - it will be set by forest generator

                // Store mesh group reference for proper disposal
                group.userData.meshGroup = meshGroup;
                group.userData.plantName = plantConfig.name;

                console.log("Successfully created L-system mesh:", group);
                return group;
            } else {
                throw new Error("No mesh group returned from adapter");
            }
        } catch (error) {
            console.error("Failed to generate L-system with adapter:", error);
            throw error;
        }
    }

    private generateSimplePlantMesh(
        plantConfig: PlantData,
        scale: number = 1,
    ): THREE.Group {
        console.log("Generating simple plant mesh for:", plantConfig.name);
        console.log("Plant config:", plantConfig);
        console.log("Scale:", scale);

        try {
            // Fallback: create a simple tree-like structure
            const group = new THREE.Group();

            // Trunk - make larger for visibility
            const trunkHeight = (plantConfig.length || 5) * scale * 2;
            const trunkRadius = (plantConfig.thickness || 0.2) * scale * 2;

            console.log("Creating trunk geometry...");
            const trunkGeometry = new THREE.CylinderGeometry(
                trunkRadius * 0.5,
                trunkRadius,
                trunkHeight,
                8,
                1,
            );

            console.log("Creating trunk material...");
            const trunkMaterial = this.createBarkMaterial();

            console.log("Creating trunk mesh...");
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = trunkHeight / 2;
            trunk.castShadow = false; // Disable shadows to avoid geometry issues
            trunk.receiveShadow = false;
            group.add(trunk);

            console.log("Creating foliage geometry...");
            // Foliage - size based on plant parameters, make larger
            const foliageRadius = Math.max(1.5, trunkHeight * 0.5) * scale;
            const foliageGeometry = new THREE.SphereGeometry(
                foliageRadius,
                16,
                12,
            );

            console.log("Creating foliage material...");
            const foliageMaterial = new THREE.MeshStandardMaterial({
                color: 0x228b22,
                roughness: 0.8,
                metalness: 0.0,
            });

            console.log("Creating foliage mesh...");
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = trunkHeight * 0.8;
            foliage.castShadow = false; // Disable shadows to avoid geometry issues
            foliage.receiveShadow = false;
            group.add(foliage);

            // Store plant info
            group.userData.plantName = plantConfig.name;

            console.log("Simple plant mesh created successfully");
            console.log("Plant group children count:", group.children.length);

            return group;
        } catch (error) {
            console.error("Error in generateSimplePlantMesh:", error);
            throw error;
        }
    }

    public async clearForest(): Promise<void> {
        if (!this.forestGroup) return;

        // Remove all plants from the forest group
        while (this.forestGroup.children.length > 0) {
            const child = this.forestGroup.children[0];
            this.forestGroup.remove(child);

            // Properly dispose of ThreeJS adapter created objects
            if (
                child.userData &&
                child.userData.meshGroup &&
                this.ThreeJSAdapter
            ) {
                try {
                    this.ThreeJSAdapter.dispose(child.userData.meshGroup);
                } catch (error) {
                    console.warn("Failed to dispose mesh group:", error);
                }
            } else {
                // Fallback disposal
                child.traverse((obj) => {
                    const mesh = obj as any;
                    if (mesh.geometry) mesh.geometry.dispose();
                    if (mesh.material) {
                        if (Array.isArray(mesh.material)) {
                            mesh.material.forEach((material: any) => {
                                if (
                                    material.map &&
                                    material.map !== this.barkTexture
                                ) {
                                    material.map.dispose();
                                }
                                material.dispose();
                            });
                        } else {
                            if (
                                mesh.material.map &&
                                mesh.material.map !== this.barkTexture
                            ) {
                                mesh.material.map.dispose();
                            }
                            mesh.material.dispose();
                        }
                    }
                });
            }
        }

        console.log("Forest cleared");
    }

    public getPlantCount(): number {
        return this.forestGroup ? this.forestGroup.children.length : 0;
    }

    public getTriangleCount(): number {
        let triangles = 0;
        if (this.forestGroup) {
            this.forestGroup.traverse((child) => {
                const mesh = child as any;
                if (mesh.geometry && mesh.geometry.index) {
                    triangles += mesh.geometry.index.count / 3;
                }
            });
        }
        return Math.floor(triangles);
    }

    private loadBarkTexture(): void {
        const textureLoader = new THREE.TextureLoader();
        this.barkTexture = textureLoader.load("/bark_willow_02_diff_2k.jpg");

        // Configure bark texture settings
        this.barkTexture.wrapS = THREE.RepeatWrapping;
        this.barkTexture.wrapT = THREE.RepeatWrapping;
        this.barkTexture.generateMipmaps = true;
        this.barkTexture.minFilter = THREE.LinearMipmapLinearFilter;
        this.barkTexture.magFilter = THREE.LinearFilter;
    }

    private createBarkMaterial(): THREE.MeshStandardMaterial {
        const material = new THREE.MeshStandardMaterial({
            map: this.barkTexture,
            color: 0xffffff, // Use white to show texture colors naturally
            roughness: 0.9,
            metalness: 0.0,
        });

        return material;
    }

    private applyBarkTextureToMesh(meshGroup: any): void {
        // Handle different adapter return structures
        let targetGroup: THREE.Group | null = null;

        console.log("Attempting to apply bark texture to:", meshGroup);

        if (meshGroup && typeof meshGroup.traverse === "function") {
            // Direct THREE.Group
            targetGroup = meshGroup;
        } else if (
            meshGroup &&
            meshGroup.group &&
            typeof meshGroup.group.traverse === "function"
        ) {
            // Wrapped in object with .group property
            targetGroup = meshGroup.group;
        } else if (
            meshGroup &&
            meshGroup.mesh &&
            typeof meshGroup.mesh.traverse === "function"
        ) {
            // Wrapped in object with .mesh property
            targetGroup = meshGroup.mesh;
        } else if (meshGroup instanceof THREE.Object3D) {
            // Try as THREE.Object3D
            targetGroup = meshGroup as THREE.Group;
        }

        if (!targetGroup) {
            console.warn(
                "Unable to traverse meshGroup for bark texture application. Type:",
                typeof meshGroup,
                "Properties:",
                Object.keys(meshGroup || {}),
            );
            return;
        }

        console.log("Traversing target group:", targetGroup);

        let textureApplied = false;
        targetGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const material = child.material;
                console.log("Found mesh with material:", material);

                // Handle both standard and array materials
                const materials = Array.isArray(material)
                    ? material
                    : [material];

                materials.forEach((mat) => {
                    if (
                        mat instanceof THREE.MeshStandardMaterial ||
                        mat instanceof THREE.MeshLambertMaterial
                    ) {
                        const color = mat.color;
                        const r = color.r;
                        const g = color.g;
                        const b = color.b;

                        // More lenient brown detection - if it's darker and not bright green
                        const isWood =
                            r > 0.2 && g > 0.1 && b > 0.05 && !(g > r && g > b);

                        if (isWood) {
                            console.log(
                                "Applying bark texture to wood material",
                            );

                            // Convert to standard material if needed
                            if (mat instanceof THREE.MeshLambertMaterial) {
                                const standardMat =
                                    new THREE.MeshStandardMaterial({
                                        map: this.barkTexture,
                                        color: 0xffffff,
                                        roughness: 0.9,
                                        metalness: 0.0,
                                    });
                                child.material = standardMat;
                            } else {
                                mat.map = this.barkTexture;
                                mat.color.setHex(0xffffff);
                                mat.roughness = 0.9;
                                mat.metalness = 0.0;
                                mat.needsUpdate = true;
                            }
                            textureApplied = true;
                        }
                    }
                });
            }
        });

        console.log(
            "Bark texture application completed. Applied:",
            textureApplied,
        );
    }

    public dispose(): void {
        this.clearForest();
        this.selectedPlants.clear();
        this.availablePlants = [];

        // Dispose bark texture
        if (this.barkTexture) {
            this.barkTexture.dispose();
            this.barkTexture = null;
        }

        if (this.loadingElement) {
            this.loadingElement.innerHTML = "";
        }

        console.log("PlantSystem disposed");
    }
}
