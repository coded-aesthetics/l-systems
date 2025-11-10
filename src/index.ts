import { LSystem, LSystemRule } from "./LSystem.js";
import { Renderer } from "./Renderer.js";

interface Preset {
    name: string;
    axiom: string;
    rules: string;
    angle: number;
    iterations: number;
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
    private zoomSlider!: HTMLInputElement;
    private rotationSpeedSlider!: HTMLInputElement;
    private generateButton!: HTMLButtonElement;
    private resetCameraButton!: HTMLButtonElement;

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
        coral3d: {
            name: "3D Coral",
            axiom: "F",
            rules: "F -> F[+F-F][-F+F][&F^F][^F&F]F",
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
        ].forEach((slider) => {
            slider.addEventListener("input", debouncedGenerate);
        });

        // Generate on Enter key in text areas
        [this.axiomInput, this.rulesInput].forEach((textarea) => {
            textarea.addEventListener("keydown", (e) => {
                if (e.ctrlKey && e.key === "Enter") {
                    this.generateLSystem();
                }
            });
        });
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
                `Generated geometry: ${geometry.vertices.length / 3} vertices, ${geometry.indices.length / 3} triangles`,
            );

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
