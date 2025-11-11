import { LSystem, LSystemRule } from "./LSystem.js";
import { Renderer, GeometryData } from "./Renderer.js";

interface Preset {
    name: string;
    axiom: string;
    rules: string;
    angle: number;
    iterations: number;
}

interface SavedPlant {
    name: string;
    timestamp: number;
    // L-System parameters
    axiom: string;
    rules: string;
    iterations: number;
    angle: number;
    angleVariation: number;
    lengthVariation: number;
    // Geometry parameters
    length: number;
    thickness: number;
    tapering: number;
    segments: number;
    // Leaf parameters
    leafProbability: number;
    leafThreshold: number;
    leafColor: string;
    // Rendering options
    colorMode: number;
    // Camera state
    zoom: number;
    rotationSpeed: number;
    manualRotationX: number;
    manualRotationY: number;
    panX: number;
    panY: number;
    autoRotation: number;
}

class LSystemApp {
    private lSystem: LSystem | null = null;
    private renderer: Renderer | null = null;
    private canvas: HTMLCanvasElement;
    private loadingElement: HTMLElement;
    private fpsCounter: HTMLElement;

    // Control elements
    private axiomInput!: HTMLTextAreaElement;
    private rulesInput!: HTMLTextAreaElement;
    private iterationsSlider!: HTMLInputElement;
    private angleSlider!: HTMLInputElement;
    private lengthSlider!: HTMLInputElement;
    private thicknessSlider!: HTMLInputElement;
    private taperingSlider!: HTMLInputElement;
    private angleVariationSlider!: HTMLInputElement;
    private lengthVariationSlider!: HTMLInputElement;
    private segmentsSlider!: HTMLInputElement;
    private colorModeSelect!: HTMLSelectElement;
    private leafProbabilitySlider!: HTMLInputElement;
    private leafThresholdSlider!: HTMLInputElement;
    private leafColorPicker!: HTMLInputElement;
    private zoomSlider!: HTMLInputElement;
    private rotationSpeedSlider!: HTMLInputElement;
    private generateButton!: HTMLButtonElement;
    private resetCameraButton!: HTMLButtonElement;

    // Save/Load controls
    private saveButton!: HTMLButtonElement;
    private loadSelect!: HTMLSelectElement;
    private loadButton!: HTMLButtonElement;
    private deleteButton!: HTMLButtonElement;
    private exportButton!: HTMLButtonElement;
    private importButton!: HTMLButtonElement;
    private importFileInput!: HTMLInputElement;
    private plantNameInput!: HTMLInputElement;

    // FPS tracking
    private lastFrameTime: number = 0;
    private frameCount: number = 0;
    private fpsUpdateTime: number = 0;

    // Presets
    private presets: { [key: string]: Preset } = {
        tree: {
            name: "Tree",
            axiom: "F",
            rules: "F -> F[+F]F[-F]F",
            angle: 25,
            iterations: 4,
        },
        fern: {
            name: "Fern",
            axiom: "X",
            rules: "X -> F[+X]F[-X]+X\nF -> FF",
            angle: 25,
            iterations: 5,
        },
        dragon: {
            name: "Dragon Curve",
            axiom: "F",
            rules: "F -> F+F--F+F",
            angle: 60,
            iterations: 6,
        },
        plant: {
            name: "Plant",
            axiom: "X",
            rules: "X -> F-[[X]+X]+F[+FX]-X\nF -> FF",
            angle: 22.5,
            iterations: 5,
        },
        tree3d: {
            name: "3D Tree",
            axiom: "F",
            rules: "F -> F[&F^F][/F\\F][+F-F]",
            angle: 30,
            iterations: 4,
        },
        bush3d: {
            name: "3D Bush",
            axiom: "A",
            rules: "A -> F[&+A][&-A][^+A][^-A]\nF -> FF",
            angle: 25,
            iterations: 4,
        },
        bushWithLeaves: {
            name: "Bush with Leaves",
            axiom: "A",
            rules: "A -> F[&+A][&-A][^+A][^-A]\nA -> F[&+L][&-L][^+L][^-L]\nF -> FF\nL -> L",
            angle: 25,
            iterations: 4,
        },
        treeWithLeaves: {
            name: "Tree with Leaves",
            axiom: "T",
            rules: "T -> F[&+T][&-T][^+T][^-T]\nT -> F[&+L][&-L][^+L][^-L]\nF -> FF\nL -> LL[+L][-L]",
            angle: 28,
            iterations: 4,
        },
        leafyBranch: {
            name: "Leafy Branch",
            axiom: "F",
            rules: "F -> F[+FL][-FL][&FL][^FL]\nL -> L",
            angle: 30,
            iterations: 3,
        },
        simpleLeafTest: {
            name: "Simple Leaf Test",
            axiom: "FL",
            rules: "L -> L",
            angle: 45,
            iterations: 0,
        },
        minimalLeaf: {
            name: "Minimal Leaf",
            axiom: "L",
            rules: "L -> L",
            angle: 0,
            iterations: 0,
        },
        sphereLeaves: {
            name: "Sphere Leaves",
            axiom: "F",
            rules: "F -> F[+FL][-FL][&FL][^FL]\nL -> L",
            angle: 35,
            iterations: 2,
        },
        autumnTree: {
            name: "Autumn Tree",
            axiom: "T",
            rules: "T -> F[&+T][&-T][^+T][^-T]\nT -> F[&+L][&-L][^+L][^-L]\nF -> FF\nL -> L",
            angle: 30,
            iterations: 3,
        },
        windyLeaves: {
            name: "Windy Leaves",
            axiom: "F",
            rules: "F -> F[+FL][-FL][&FL][^FL][/FL][\\FL]\nL -> L",
            angle: 25,
            iterations: 2,
        },
        coral3d: {
            name: "3D Coral",
            axiom: "F",
            rules: "F -> F[+FL-F][-F+FL][&F^F][^F&F]F",
            angle: 22,
            iterations: 4,
        },
        spiral3d: {
            name: "3D Spiral",
            axiom: "A",
            rules: "A -> F[&A][/A][\\A][^A]\nF -> FF",
            angle: 45,
            iterations: 5,
        },
    };

    constructor() {
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.loadingElement = document.getElementById("loading") as HTMLElement;
        this.fpsCounter = document.getElementById("fps-counter") as HTMLElement;

        this.initializeControls();
        this.setupEventListeners();
        this.initializeRenderer();
        this.loadPreset("tree"); // Load default preset
    }

    private initializeControls(): void {
        this.axiomInput = document.getElementById(
            "axiom",
        ) as HTMLTextAreaElement;
        this.rulesInput = document.getElementById(
            "rules",
        ) as HTMLTextAreaElement;
        this.iterationsSlider = document.getElementById(
            "iterations",
        ) as HTMLInputElement;
        this.angleSlider = document.getElementById("angle") as HTMLInputElement;
        this.lengthSlider = document.getElementById(
            "length",
        ) as HTMLInputElement;
        this.thicknessSlider = document.getElementById(
            "thickness",
        ) as HTMLInputElement;
        this.taperingSlider = document.getElementById(
            "tapering",
        ) as HTMLInputElement;
        this.angleVariationSlider = document.getElementById(
            "angleVariation",
        ) as HTMLInputElement;
        this.lengthVariationSlider = document.getElementById(
            "lengthVariation",
        ) as HTMLInputElement;
        this.segmentsSlider = document.getElementById(
            "segments",
        ) as HTMLInputElement;
        this.colorModeSelect = document.getElementById(
            "colorMode",
        ) as HTMLSelectElement;
        this.leafProbabilitySlider = document.getElementById(
            "leafProbability",
        ) as HTMLInputElement;
        this.leafThresholdSlider = document.getElementById(
            "leafThreshold",
        ) as HTMLInputElement;
        this.leafColorPicker = document.getElementById(
            "leafColor",
        ) as HTMLInputElement;
        this.zoomSlider = document.getElementById("zoom") as HTMLInputElement;
        this.rotationSpeedSlider = document.getElementById(
            "rotationSpeed",
        ) as HTMLInputElement;
        this.generateButton = document.getElementById(
            "generate",
        ) as HTMLButtonElement;
        this.resetCameraButton = document.getElementById(
            "resetCamera",
        ) as HTMLButtonElement;

        // Save/Load controls
        this.plantNameInput = document.getElementById(
            "plantName",
        ) as HTMLInputElement;
        this.saveButton = document.getElementById(
            "saveButton",
        ) as HTMLButtonElement;
        this.loadSelect = document.getElementById(
            "loadSelect",
        ) as HTMLSelectElement;
        this.loadButton = document.getElementById(
            "loadButton",
        ) as HTMLButtonElement;
        this.deleteButton = document.getElementById(
            "deleteButton",
        ) as HTMLButtonElement;
        this.exportButton = document.getElementById(
            "exportButton",
        ) as HTMLButtonElement;
        this.importButton = document.getElementById(
            "importButton",
        ) as HTMLButtonElement;
        this.importFileInput = document.getElementById(
            "importFile",
        ) as HTMLInputElement;

        // Initialize load options
        this.updateLoadOptions();
    }

    private setupEventListeners(): void {
        // Update value displays
        this.setupSliderValueDisplay("iterations", "iterations-value");
        this.setupSliderValueDisplay("angle", "angle-value", "°");
        this.setupSliderValueDisplay("length", "length-value");
        this.setupSliderValueDisplay("thickness", "thickness-value");
        this.setupSliderValueDisplay("tapering", "tapering-value");
        this.setupSliderValueDisplay(
            "angleVariation",
            "angleVariation-value",
            "°",
        );
        this.setupSliderValueDisplay(
            "lengthVariation",
            "lengthVariation-value",
            "%",
        );
        this.setupSliderValueDisplay("segments", "segments-value");
        this.setupSliderValueDisplay("zoom", "zoom-value");
        this.setupSliderValueDisplay("rotationSpeed", "rotationSpeed-value");
        this.setupSliderValueDisplay(
            "leafProbability",
            "leafProbability-value",
            "%",
        );
        this.setupSliderValueDisplay("leafThreshold", "leafThreshold-value");

        // Generate button
        this.generateButton.addEventListener("click", () =>
            this.generateLSystem(),
        );

        // Real-time updates for renderer parameters
        this.colorModeSelect.addEventListener("change", () => {
            if (this.renderer) {
                this.renderer.setColorMode(
                    parseInt(this.colorModeSelect.value),
                );
            }
        });

        this.leafColorPicker.addEventListener("change", () => {
            if (this.renderer) {
                const color = this.hexToRgb(this.leafColorPicker.value);
                this.renderer.setLeafColor(color);
            }
        });

        this.zoomSlider.addEventListener("input", () => {
            if (this.renderer) {
                this.renderer.setZoom(parseFloat(this.zoomSlider.value));
            }
        });

        this.rotationSpeedSlider.addEventListener("input", () => {
            if (this.renderer) {
                this.renderer.setRotationSpeed(
                    parseFloat(this.rotationSpeedSlider.value),
                );
            }
        });

        // Reset camera button
        this.resetCameraButton.addEventListener("click", () => {
            if (this.renderer) {
                this.renderer.resetCamera();
                this.zoomSlider.value = "5.0";
                this.updateValueDisplay("zoom", "zoom-value");
            }
        });

        // Auto-generate on parameter changes (with debounce)
        let debounceTimer: number | null = null;
        const debouncedGenerate = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(
                () => this.generateLSystem(),
                300,
            );
        };

        [
            this.angleSlider,
            this.lengthSlider,
            this.thicknessSlider,
            this.taperingSlider,
            this.angleVariationSlider,
            this.lengthVariationSlider,
            this.segmentsSlider,
            this.leafProbabilitySlider,
            this.leafThresholdSlider,
        ].forEach((slider) => {
            slider.addEventListener("input", debouncedGenerate);
        });

        // Also regenerate on color change
        this.leafColorPicker.addEventListener("input", debouncedGenerate);

        // Generate on Enter key in text areas
        [this.axiomInput, this.rulesInput].forEach((textarea) => {
            textarea.addEventListener("keydown", (e) => {
                if (e.ctrlKey && e.key === "Enter") {
                    this.generateLSystem();
                }
            });
        });

        // Save/Load event listeners
        this.saveButton.addEventListener("click", () => this.savePlant());
        this.loadButton.addEventListener("click", () => this.loadPlant());
        this.deleteButton.addEventListener("click", () => this.deletePlant());
        this.exportButton.addEventListener("click", () => this.exportPlants());
        this.importButton.addEventListener("click", () =>
            this.importFileInput.click(),
        );
        this.importFileInput.addEventListener("change", (e) =>
            this.importPlants(e),
        );

        // Update button states when selection changes
        this.loadSelect.addEventListener("change", () => {
            const hasSelection = this.loadSelect.value !== "";
            this.loadButton.disabled = !hasSelection;
            this.deleteButton.disabled = !hasSelection;
        });

        // Allow Enter key in plant name input to save
        this.plantNameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                this.savePlant();
            }
        });

        // Global keyboard shortcuts
        document.addEventListener("keydown", (e) => {
            // Ctrl+S to save plant
            if (e.ctrlKey && e.key === "s") {
                e.preventDefault();
                if (this.plantNameInput.value.trim()) {
                    this.savePlant();
                } else {
                    this.plantNameInput.focus();
                    this.showMessage("Enter a plant name to save", "info");
                }
            }

            // Ctrl+O to open load dropdown
            if (e.ctrlKey && e.key === "o") {
                e.preventDefault();
                this.loadSelect.focus();
                if (this.loadSelect.options.length > 1) {
                    this.loadSelect.selectedIndex = 1; // Select first plant
                    this.loadSelect.dispatchEvent(new Event("change"));
                }
            }

            // Ctrl+E to export
            if (e.ctrlKey && e.key === "e") {
                e.preventDefault();
                this.exportPlants();
            }

            // Escape to clear plant name input or close dropdowns
            if (e.key === "Escape") {
                if (document.activeElement === this.plantNameInput) {
                    this.plantNameInput.value = "";
                    this.plantNameInput.blur();
                } else if (document.activeElement === this.loadSelect) {
                    this.loadSelect.selectedIndex = 0;
                    this.loadSelect.dispatchEvent(new Event("change"));
                    this.loadSelect.blur();
                }
            }
        });
    }

    private hexToRgb(hex: string): [number, number, number] {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? [
                  parseInt(result[1], 16) / 255,
                  parseInt(result[2], 16) / 255,
                  parseInt(result[3], 16) / 255,
              ]
            : [0.18, 0.8, 0.13]; // Default green
    }

    private setupSliderValueDisplay(
        sliderId: string,
        displayId: string,
        suffix: string = "",
    ): void {
        const slider = document.getElementById(sliderId) as HTMLInputElement;
        const display = document.getElementById(displayId) as HTMLElement;

        const updateDisplay = () => {
            let value = parseFloat(slider.value);
            if (sliderId === "iterations" || sliderId === "segments") {
                display.textContent = Math.round(value) + suffix;
            } else {
                display.textContent = value.toFixed(1) + suffix;
            }
        };

        updateDisplay(); // Initial update
        slider.addEventListener("input", updateDisplay);
    }

    private updateValueDisplay(
        sliderId: string,
        displayId: string,
        suffix: string = "",
    ): void {
        const slider = document.getElementById(sliderId) as HTMLInputElement;
        const display = document.getElementById(displayId) as HTMLElement;

        let value = parseFloat(slider.value);
        if (sliderId === "iterations" || sliderId === "segments") {
            display.textContent = Math.round(value) + suffix;
        } else {
            display.textContent = value.toFixed(1) + suffix;
        }
    }

    private async initializeRenderer(): Promise<void> {
        try {
            this.renderer = new Renderer({
                canvas: this.canvas,
                colorMode: 0,
            });

            this.renderer.startAnimation();
            this.startFPSCounter();

            // Initialize leaf color
            const initialColor = this.hexToRgb(this.leafColorPicker.value);
            this.renderer.setLeafColor(initialColor);

            this.hideLoading();
        } catch (error) {
            console.error("Failed to initialize WebGL:", error);
            this.showError(
                "Failed to initialize WebGL. Please check if your browser supports WebGL.",
            );
        }
    }

    private generateLSystem(): void {
        if (!this.renderer) {
            this.showError("Renderer not initialized");
            return;
        }

        try {
            this.showLoading();

            const axiom = this.axiomInput.value.trim();
            const rulesText = this.rulesInput.value.trim();
            const iterations = parseInt(this.iterationsSlider.value);
            const angle = parseFloat(this.angleSlider.value);
            const angleVariation = parseFloat(this.angleVariationSlider.value);
            const lengthVariation = parseFloat(
                this.lengthVariationSlider.value,
            );
            const length = parseFloat(this.lengthSlider.value);
            const thickness = parseFloat(this.thicknessSlider.value);
            const tapering = parseFloat(this.taperingSlider.value);
            const leafProbability =
                parseFloat(this.leafProbabilitySlider.value) / 100;
            const leafThreshold = parseInt(this.leafThresholdSlider.value);

            if (!axiom) {
                throw new Error("Axiom cannot be empty");
            }

            const rules = LSystem.parseRules(rulesText);
            this.lSystem = new LSystem(
                axiom,
                rules,
                angle,
                angleVariation,
                lengthVariation,
                leafProbability,
                leafThreshold,
            );

            const lSystemString = this.lSystem.generate(iterations);

            // Check if the generated string is too long
            if (lSystemString.length > 100000) {
                throw new Error(
                    `Generated string is too long (${lSystemString.length} characters). Try reducing iterations.`,
                );
            }

            console.log(
                `Generated L-system: ${lSystemString.substring(0, 100)}${lSystemString.length > 100 ? "..." : ""}`,
            );
            console.log(`String length: ${lSystemString.length}`);

            const geometry = this.lSystem.interpretToGeometry(
                lSystemString,
                length,
                thickness,
                tapering,
            );

            console.log(
                `Generated geometry: ${geometry.vertices.length / 3} vertices, ${geometry.indices.length / 3} triangles, ${geometry.leafVertices.length / 3} leaf vertices, ${geometry.leafIndices.length / 3} leaf triangles`,
            );
            console.log(
                `Leaf probability: ${leafProbability}, Leaf threshold: ${leafThreshold}`,
            );
            console.log(
                `L-System string contains ${(lSystemString.match(/L/g) || []).length} L symbols`,
            );

            if (geometry.leafVertices.length > 0) {
                console.log(
                    `First few leaf vertices:`,
                    geometry.leafVertices.slice(0, 12),
                );
                console.log(
                    `First few leaf indices:`,
                    geometry.leafIndices.slice(0, 12),
                );
            } else {
                console.log("No leaf geometry generated!");
            }

            this.renderer.updateGeometry(geometry);
            this.hideError();
            this.hideLoading();
        } catch (error) {
            console.error("Error generating L-system:", error);
            this.showError(
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
            );
            this.hideLoading();
        }
    }

    public loadPreset(presetName: string): void {
        const preset = this.presets[presetName];
        if (!preset) return;

        this.axiomInput.value = preset.axiom;
        this.rulesInput.value = preset.rules;
        this.angleSlider.value = preset.angle.toString();
        this.iterationsSlider.value = preset.iterations.toString();

        // Update value displays
        this.updateValueDisplay("angle", "angle-value", "°");
        this.updateValueDisplay("iterations", "iterations-value");

        // Generate the L-system
        setTimeout(() => this.generateLSystem(), 100);
    }

    private startFPSCounter(): void {
        const updateFPS = (currentTime: number) => {
            this.frameCount++;

            if (currentTime - this.fpsUpdateTime >= 1000) {
                // Update every second
                const fps = Math.round(
                    this.frameCount /
                        ((currentTime - this.fpsUpdateTime) / 1000),
                );
                this.fpsCounter.textContent = `FPS: ${fps}`;
                this.frameCount = 0;
                this.fpsUpdateTime = currentTime;
            }

            this.lastFrameTime = currentTime;
            requestAnimationFrame(updateFPS);
        };

        this.fpsUpdateTime = performance.now();
        requestAnimationFrame(updateFPS);
    }

    private showLoading(): void {
        this.loadingElement.style.display = "block";
    }

    private hideLoading(): void {
        this.loadingElement.style.display = "none";
    }

    private showError(message: string): void {
        const errorElement = document.getElementById(
            "rules-error",
        ) as HTMLElement;
        errorElement.textContent = message;
        errorElement.style.display = "block";
    }

    private hideError(): void {
        const errorElement = document.getElementById(
            "rules-error",
        ) as HTMLElement;
        errorElement.style.display = "none";
    }

    private getCurrentState(): SavedPlant {
        const cameraState = this.renderer?.getCameraState() || {
            zoom: 5.0,
            rotationSpeed: 0.5,
            manualRotationX: 0,
            manualRotationY: 0,
            panX: 0,
            panY: 0,
            autoRotation: 0,
        };

        return {
            name: this.plantNameInput.value || `Plant ${Date.now()}`,
            timestamp: Date.now(),
            axiom: this.axiomInput.value,
            rules: this.rulesInput.value,
            iterations: parseInt(this.iterationsSlider.value),
            angle: parseFloat(this.angleSlider.value),
            angleVariation: parseFloat(this.angleVariationSlider.value),
            lengthVariation: parseFloat(this.lengthVariationSlider.value),
            length: parseFloat(this.lengthSlider.value),
            thickness: parseFloat(this.thicknessSlider.value),
            tapering: parseFloat(this.taperingSlider.value),
            segments: parseInt(this.segmentsSlider.value),
            leafProbability: parseInt(this.leafProbabilitySlider.value),
            leafThreshold: parseInt(this.leafThresholdSlider.value),
            leafColor: this.leafColorPicker.value,
            colorMode: parseInt(this.colorModeSelect.value),
            zoom: cameraState.zoom,
            rotationSpeed: cameraState.rotationSpeed,
            manualRotationX: cameraState.manualRotationX,
            manualRotationY: cameraState.manualRotationY,
            panX: cameraState.panX,
            panY: cameraState.panY,
            autoRotation: cameraState.autoRotation,
        };
    }

    private applyState(state: SavedPlant): void {
        // Apply L-System parameters
        this.axiomInput.value = state.axiom;
        this.rulesInput.value = state.rules;
        this.iterationsSlider.value = state.iterations.toString();
        this.angleSlider.value = state.angle.toString();
        this.angleVariationSlider.value = state.angleVariation.toString();
        this.lengthVariationSlider.value = state.lengthVariation.toString();

        // Apply geometry parameters
        this.lengthSlider.value = state.length.toString();
        this.thicknessSlider.value = state.thickness.toString();
        this.taperingSlider.value = state.tapering.toString();
        this.segmentsSlider.value = state.segments.toString();

        // Apply leaf parameters
        this.leafProbabilitySlider.value = state.leafProbability.toString();
        this.leafThresholdSlider.value = state.leafThreshold.toString();
        this.leafColorPicker.value = state.leafColor;

        // Apply rendering options
        this.colorModeSelect.value = state.colorMode.toString();

        // Apply camera state
        this.zoomSlider.value = state.zoom.toString();
        this.rotationSpeedSlider.value = state.rotationSpeed.toString();

        if (this.renderer) {
            this.renderer.setCameraState({
                zoom: state.zoom,
                rotationSpeed: state.rotationSpeed,
                manualRotationX: state.manualRotationX,
                manualRotationY: state.manualRotationY,
                panX: state.panX,
                panY: state.panY,
                autoRotation: state.autoRotation,
            });
        }

        // Update all value displays
        this.updateAllValueDisplays();

        // Set plant name
        this.plantNameInput.value = state.name;
    }

    private updateAllValueDisplays(): void {
        this.updateValueDisplay("iterations", "iterations-value");
        this.updateValueDisplay("angle", "angle-value", "°");
        this.updateValueDisplay("angleVariation", "angleVariation-value", "°");
        this.updateValueDisplay(
            "lengthVariation",
            "lengthVariation-value",
            "%",
        );
        this.updateValueDisplay("length", "length-value");
        this.updateValueDisplay("thickness", "thickness-value");
        this.updateValueDisplay("tapering", "tapering-value");
        this.updateValueDisplay("segments", "segments-value");
        this.updateValueDisplay(
            "leafProbability",
            "leafProbability-value",
            "%",
        );
        this.updateValueDisplay("leafThreshold", "leafThreshold-value");
        this.updateValueDisplay("zoom", "zoom-value");
        this.updateValueDisplay("rotationSpeed", "rotationSpeed-value");
    }

    private savePlant(): void {
        const plantName = this.plantNameInput.value.trim();
        if (!plantName) {
            this.showMessage("Please enter a name for your plant", "error");
            return;
        }

        if (plantName.length > 50) {
            this.showMessage(
                "Plant name must be 50 characters or less",
                "error",
            );
            return;
        }

        // Validate that we have valid L-System data
        if (!this.axiomInput.value.trim()) {
            this.showMessage("Cannot save plant without an axiom", "error");
            return;
        }

        try {
            const state = this.getCurrentState();
            const savedPlants = this.getSavedPlants();

            // Check if name already exists
            const existingPlant = savedPlants.find((p) => p.name === plantName);
            if (existingPlant) {
                if (
                    !confirm(
                        `A plant named "${plantName}" already exists. Do you want to overwrite it?`,
                    )
                ) {
                    return;
                }
            }

            // Remove existing plant with same name and add new one
            const filteredPlants = savedPlants.filter(
                (p) => p.name !== plantName,
            );
            filteredPlants.push(state);

            // Check localStorage space
            const dataString = JSON.stringify(filteredPlants);
            if (dataString.length > 5000000) {
                // ~5MB limit
                this.showMessage(
                    "Too many saved plants. Please export and delete some.",
                    "error",
                );
                return;
            }

            localStorage.setItem("lsystem-saved-plants", dataString);
            this.updateLoadOptions();

            // Show success message
            this.showMessage(
                `Plant "${plantName}" saved successfully!`,
                "success",
            );

            // Clear the name input for next save
            this.plantNameInput.value = "";
        } catch (error) {
            console.error("Error saving plant:", error);
            this.showMessage(
                "Failed to save plant. Please try again.",
                "error",
            );
        }
    }

    private loadPlant(): void {
        const selectedName = this.loadSelect.value;
        if (!selectedName) {
            this.showMessage("Please select a plant to load", "error");
            return;
        }

        try {
            const savedPlants = this.getSavedPlants();
            const plant = savedPlants.find((p) => p.name === selectedName);

            if (!plant) {
                this.showMessage("Selected plant not found", "error");
                this.updateLoadOptions(); // Refresh the list
                return;
            }

            // Validate plant data before applying
            if (!this.isValidPlantData(plant)) {
                this.showMessage("Plant data is corrupted", "error");
                return;
            }

            this.applyState(plant);
            this.generateLSystem();
            this.showMessage(
                `Plant "${selectedName}" loaded successfully!`,
                "success",
            );
        } catch (error) {
            console.error("Error loading plant:", error);
            this.showMessage(
                "Failed to load plant. Data may be corrupted.",
                "error",
            );
        }
    }

    private deletePlant(): void {
        const selectedName = this.loadSelect.value;
        if (!selectedName) {
            this.showMessage("Please select a plant to delete", "error");
            return;
        }

        if (
            !confirm(
                `Are you sure you want to delete "${selectedName}"? This cannot be undone.`,
            )
        ) {
            return;
        }

        try {
            const savedPlants = this.getSavedPlants();
            const filteredPlants = savedPlants.filter(
                (p) => p.name !== selectedName,
            );

            if (filteredPlants.length === savedPlants.length) {
                this.showMessage("Plant not found", "error");
                return;
            }

            localStorage.setItem(
                "lsystem-saved-plants",
                JSON.stringify(filteredPlants),
            );
            this.updateLoadOptions();
            this.showMessage(
                `Plant "${selectedName}" deleted successfully!`,
                "success",
            );
        } catch (error) {
            console.error("Error deleting plant:", error);
            this.showMessage("Failed to delete plant", "error");
        }
    }

    private exportPlants(): void {
        try {
            const savedPlants = this.getSavedPlants();
            if (savedPlants.length === 0) {
                this.showMessage("No plants to export", "error");
                return;
            }

            // Add metadata to the export
            const exportData = {
                version: "1.0",
                exportDate: new Date().toISOString(),
                plantsCount: savedPlants.length,
                plants: savedPlants,
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });

            const link = document.createElement("a");
            link.href = URL.createObjectURL(dataBlob);
            link.download = `lsystem-plants-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(link.href);
            this.showMessage(
                `Exported ${savedPlants.length} plants successfully!`,
                "success",
            );
        } catch (error) {
            console.error("Error exporting plants:", error);
            this.showMessage("Failed to export plants", "error");
        }
    }

    private importPlants(event: Event): void {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            // 10MB limit
            this.showMessage("File too large. Maximum size is 10MB.", "error");
            target.value = "";
            return;
        }

        if (!file.name.toLowerCase().endsWith(".json")) {
            this.showMessage("Please select a JSON file", "error");
            target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result as string;
                if (!result) {
                    throw new Error("Could not read file");
                }

                const importData = JSON.parse(result);

                // Handle both old format (direct array) and new format (with metadata)
                let importedPlants: SavedPlant[];
                if (Array.isArray(importData)) {
                    // Old format - direct array
                    importedPlants = importData;
                } else if (
                    importData.plants &&
                    Array.isArray(importData.plants)
                ) {
                    // New format - with metadata
                    importedPlants = importData.plants;
                } else {
                    throw new Error(
                        "Invalid file format - expected plant data array",
                    );
                }

                if (importedPlants.length === 0) {
                    this.showMessage("No plants found in file", "error");
                    return;
                }

                // Validate imported plants
                const validPlants: SavedPlant[] = [];
                let invalidCount = 0;

                for (const plant of importedPlants) {
                    if (this.isValidPlantData(plant)) {
                        // Ensure the plant has a valid name
                        if (!plant.name || plant.name.trim().length === 0) {
                            plant.name = `Imported Plant ${Date.now()}`;
                        }
                        validPlants.push(plant);
                    } else {
                        invalidCount++;
                        console.warn("Skipping invalid plant data:", plant);
                    }
                }

                if (validPlants.length === 0) {
                    this.showMessage("No valid plants found in file", "error");
                    return;
                }

                const existingPlants = this.getSavedPlants();
                let importCount = 0;
                let skipCount = 0;
                let overwriteCount = 0;

                for (const plant of validPlants) {
                    const existingIndex = existingPlants.findIndex(
                        (p) => p.name === plant.name,
                    );

                    if (existingIndex >= 0) {
                        const overwrite = confirm(
                            `Plant "${plant.name}" already exists. Overwrite?`,
                        );
                        if (overwrite) {
                            existingPlants[existingIndex] = plant;
                            overwriteCount++;
                            importCount++;
                        } else {
                            skipCount++;
                        }
                    } else {
                        existingPlants.push(plant);
                        importCount++;
                    }
                }

                localStorage.setItem(
                    "lsystem-saved-plants",
                    JSON.stringify(existingPlants),
                );
                this.updateLoadOptions();

                let message = `Imported ${importCount} plants successfully!`;
                if (overwriteCount > 0) {
                    message += ` (${overwriteCount} overwritten)`;
                }
                if (skipCount > 0) {
                    message += ` (${skipCount} skipped)`;
                }
                if (invalidCount > 0) {
                    message += ` (${invalidCount} invalid plants ignored)`;
                }
                this.showMessage(message, "success");
            } catch (error) {
                console.error("Import error:", error);
                this.showMessage(
                    "Error importing plants: " + (error as Error).message,
                    "error",
                );
            }
        };

        reader.onerror = () => {
            this.showMessage("Error reading file", "error");
        };

        reader.readAsText(file);
        // Reset the file input
        target.value = "";
    }

    private isValidPlantData(plant: any): plant is SavedPlant {
        return (
            typeof plant === "object" &&
            plant !== null &&
            typeof plant.name === "string" &&
            typeof plant.axiom === "string" &&
            typeof plant.rules === "string" &&
            typeof plant.iterations === "number" &&
            typeof plant.angle === "number" &&
            typeof plant.length === "number" &&
            typeof plant.thickness === "number" &&
            typeof plant.leafColor === "string" &&
            plant.iterations >= 1 &&
            plant.iterations <= 10 &&
            plant.angle >= 0 &&
            plant.angle <= 180 &&
            plant.length > 0 &&
            plant.thickness > 0
        );
    }

    private getSavedPlants(): SavedPlant[] {
        try {
            const saved = localStorage.getItem("lsystem-saved-plants");
            if (!saved) return [];

            const plants = JSON.parse(saved);
            if (!Array.isArray(plants)) {
                console.warn("Invalid plants data format, resetting");
                localStorage.removeItem("lsystem-saved-plants");
                return [];
            }

            // Filter out any corrupted plant data
            const validPlants = plants.filter((plant) =>
                this.isValidPlantData(plant),
            );

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

    private updateLoadOptions(): void {
        const savedPlants = this.getSavedPlants();

        // Clear existing options
        this.loadSelect.innerHTML =
            '<option value="">Select a plant...</option>';

        // Sort plants by timestamp (newest first)
        savedPlants.sort((a, b) => b.timestamp - a.timestamp);

        // Add options for each saved plant
        for (const plant of savedPlants) {
            const option = document.createElement("option");
            option.value = plant.name;
            const date = new Date(plant.timestamp).toLocaleString();
            option.textContent = `${plant.name} (${date})`;
            this.loadSelect.appendChild(option);
        }

        // Update button states
        this.deleteButton.disabled = true;
        this.loadButton.disabled = true;
    }

    private showMessage(
        message: string,
        type: "success" | "error" | "info" = "info",
    ): void {
        // Remove any existing messages
        const existingMessages = document.querySelectorAll(".status-message");
        existingMessages.forEach((msg) => msg.remove());

        const messageEl = document.createElement("div");
        messageEl.className = "status-message";
        messageEl.textContent = message;

        const backgroundColor = {
            success: "#4CAF50",
            error: "#f44336",
            info: "#2196f3",
        }[type];

        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 1000;
            font-family: Arial, sans-serif;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // Add animation keyframes if not already added
        if (!document.querySelector("#message-animations")) {
            const style = document.createElement("style");
            style.id = "message-animations";
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(messageEl);

        // Remove after delay (longer for errors)
        const delay = type === "error" ? 5000 : 3000;
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.animation = "slideIn 0.3s ease-out reverse";
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.parentNode.removeChild(messageEl);
                    }
                }, 300);
            }
        }, delay);
    }

    private showKeyboardShortcuts(): void {
        const shortcuts = [
            "Ctrl+S: Save current plant",
            "Ctrl+O: Quick load first saved plant",
            "Ctrl+E: Export all plants",
            "Ctrl+Enter: Generate L-System (in text areas)",
            "Escape: Clear inputs/close dropdowns",
            "Mouse wheel: Zoom in/out",
            "Alt+Drag: Pan camera",
            "Drag: Rotate camera",
        ];

        const shortcutMessage = "Keyboard Shortcuts:\n" + shortcuts.join("\n");
        console.log(shortcutMessage);

        // Show as an alert for now, could be improved with a modal
        alert(shortcutMessage);
    }

    public dispose(): void {
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Global function for preset buttons
(window as any).loadPreset = (presetName: string) => {
    if ((window as any).app) {
        (window as any).app.loadPreset(presetName);
    }
};

// Initialize the application when the page loads
document.addEventListener("DOMContentLoaded", () => {
    (window as any).app = new LSystemApp();
});
