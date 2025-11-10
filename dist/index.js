import { LSystem } from "./LSystem.js";
import { Renderer } from "./Renderer.js";
class LSystemApp {
    constructor() {
        this.lSystem = null;
        this.renderer = null;
        // FPS tracking
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
        // Presets
        this.presets = {
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
                rules: "F -> F[&F^F/F\\F][+F-F]F",
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
        this.canvas = document.getElementById("canvas");
        this.loadingElement = document.getElementById("loading");
        this.fpsCounter = document.getElementById("fps-counter");
        this.initializeControls();
        this.setupEventListeners();
        this.initializeRenderer();
        this.loadPreset("tree"); // Load default preset
    }
    initializeControls() {
        this.axiomInput = document.getElementById("axiom");
        this.rulesInput = document.getElementById("rules");
        this.iterationsSlider = document.getElementById("iterations");
        this.angleSlider = document.getElementById("angle");
        this.lengthSlider = document.getElementById("length");
        this.thicknessSlider = document.getElementById("thickness");
        this.taperingSlider = document.getElementById("tapering");
        this.angleVariationSlider = document.getElementById("angleVariation");
        this.segmentsSlider = document.getElementById("segments");
        this.colorModeSelect = document.getElementById("colorMode");
        this.zoomSlider = document.getElementById("zoom");
        this.rotationSpeedSlider = document.getElementById("rotationSpeed");
        this.generateButton = document.getElementById("generate");
        this.resetCameraButton = document.getElementById("resetCamera");
    }
    setupEventListeners() {
        // Update value displays
        this.setupSliderValueDisplay("iterations", "iterations-value");
        this.setupSliderValueDisplay("angle", "angle-value", "°");
        this.setupSliderValueDisplay("length", "length-value");
        this.setupSliderValueDisplay("thickness", "thickness-value");
        this.setupSliderValueDisplay("tapering", "tapering-value");
        this.setupSliderValueDisplay("angleVariation", "angleVariation-value", "°");
        this.setupSliderValueDisplay("segments", "segments-value");
        this.setupSliderValueDisplay("zoom", "zoom-value");
        this.setupSliderValueDisplay("rotationSpeed", "rotationSpeed-value");
        // Generate button
        this.generateButton.addEventListener("click", () => this.generateLSystem());
        // Real-time updates for renderer parameters
        this.colorModeSelect.addEventListener("change", () => {
            if (this.renderer) {
                this.renderer.setColorMode(parseInt(this.colorModeSelect.value));
            }
        });
        this.zoomSlider.addEventListener("input", () => {
            if (this.renderer) {
                this.renderer.setZoom(parseFloat(this.zoomSlider.value));
            }
        });
        this.rotationSpeedSlider.addEventListener("input", () => {
            if (this.renderer) {
                this.renderer.setRotationSpeed(parseFloat(this.rotationSpeedSlider.value));
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
        let debounceTimer = null;
        const debouncedGenerate = () => {
            if (debounceTimer)
                clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(() => this.generateLSystem(), 300);
        };
        [
            this.angleSlider,
            this.lengthSlider,
            this.thicknessSlider,
            this.taperingSlider,
            this.angleVariationSlider,
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
    setupSliderValueDisplay(sliderId, displayId, suffix = "") {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(displayId);
        const updateDisplay = () => {
            let value = parseFloat(slider.value);
            if (sliderId === "iterations" || sliderId === "segments") {
                display.textContent = Math.round(value) + suffix;
            }
            else {
                display.textContent = value.toFixed(1) + suffix;
            }
        };
        updateDisplay(); // Initial update
        slider.addEventListener("input", updateDisplay);
    }
    updateValueDisplay(sliderId, displayId, suffix = "") {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(displayId);
        let value = parseFloat(slider.value);
        if (sliderId === "iterations" || sliderId === "segments") {
            display.textContent = Math.round(value) + suffix;
        }
        else {
            display.textContent = value.toFixed(1) + suffix;
        }
    }
    async initializeRenderer() {
        try {
            this.renderer = new Renderer({
                canvas: this.canvas,
                colorMode: 0,
            });
            this.renderer.startAnimation();
            this.startFPSCounter();
            this.hideLoading();
        }
        catch (error) {
            console.error("Failed to initialize WebGL:", error);
            this.showError("Failed to initialize WebGL. Please check if your browser supports WebGL.");
        }
    }
    generateLSystem() {
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
            const length = parseFloat(this.lengthSlider.value);
            const thickness = parseFloat(this.thicknessSlider.value);
            const tapering = parseFloat(this.taperingSlider.value);
            if (!axiom) {
                throw new Error("Axiom cannot be empty");
            }
            const rules = LSystem.parseRules(rulesText);
            this.lSystem = new LSystem(axiom, rules, angle, angleVariation);
            const lSystemString = this.lSystem.generate(iterations);
            // Check if the generated string is too long
            if (lSystemString.length > 100000) {
                throw new Error(`Generated string is too long (${lSystemString.length} characters). Try reducing iterations.`);
            }
            console.log(`Generated L-system: ${lSystemString.substring(0, 100)}${lSystemString.length > 100 ? "..." : ""}`);
            console.log(`String length: ${lSystemString.length}`);
            const geometry = this.lSystem.interpretToGeometry(lSystemString, length, thickness, tapering);
            console.log(`Generated geometry: ${geometry.vertices.length / 3} vertices, ${geometry.indices.length / 3} triangles`);
            this.renderer.updateGeometry(geometry);
            this.hideError();
            this.hideLoading();
        }
        catch (error) {
            console.error("Error generating L-system:", error);
            this.showError(error instanceof Error
                ? error.message
                : "Unknown error occurred");
            this.hideLoading();
        }
    }
    loadPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset)
            return;
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
    startFPSCounter() {
        const updateFPS = (currentTime) => {
            this.frameCount++;
            if (currentTime - this.fpsUpdateTime >= 1000) {
                // Update every second
                const fps = Math.round(this.frameCount /
                    ((currentTime - this.fpsUpdateTime) / 1000));
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
    showLoading() {
        this.loadingElement.style.display = "block";
    }
    hideLoading() {
        this.loadingElement.style.display = "none";
    }
    showError(message) {
        const errorElement = document.getElementById("rules-error");
        errorElement.textContent = message;
        errorElement.style.display = "block";
    }
    hideError() {
        const errorElement = document.getElementById("rules-error");
        errorElement.style.display = "none";
    }
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}
// Global function for preset buttons
window.loadPreset = (presetName) => {
    if (window.app) {
        window.app.loadPreset(presetName);
    }
};
// Initialize the application when the page loads
document.addEventListener("DOMContentLoaded", () => {
    window.app = new LSystemApp();
});
//# sourceMappingURL=index.js.map