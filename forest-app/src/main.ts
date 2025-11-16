import { ForestGenerator } from "./core/ForestGenerator.ts";

// Global instance
let forestGenerator: ForestGenerator | null = null;

// Initialize the application
async function initApp() {
    try {
        console.log("Initializing Forest Generator...");

        // Create and initialize the forest generator
        forestGenerator = new ForestGenerator();
        await forestGenerator.init();

        // Make forestGenerator available globally for HTML event handlers
        (window as any).forestGenerator = forestGenerator;

        // Set up global keyboard event listeners
        setupGlobalEventListeners();

        console.log("Forest Generator initialized successfully");
    } catch (error) {
        console.error("Failed to initialize Forest Generator:", error);
        showError("Failed to initialize application: " + error.message);
    }
}

function setupGlobalEventListeners(): void {
    // Global keyboard events for player and lighting controls
    document.addEventListener("keydown", (event: KeyboardEvent) => {
        if (forestGenerator) {
            forestGenerator.onKeyDown(event);
        }
    });

    document.addEventListener("keyup", (event: KeyboardEvent) => {
        if (forestGenerator) {
            forestGenerator.onKeyUp(event);
        }
    });

    // Handle tutorial close button
    const tutorialCloseBtn = document.querySelector("#tutorial-popup button");
    if (tutorialCloseBtn) {
        tutorialCloseBtn.addEventListener("click", () => {
            if (forestGenerator && forestGenerator.uiSystem) {
                forestGenerator.uiSystem.hideTutorial();
            }
        });
    }

    // Handle window beforeunload for cleanup
    window.addEventListener("beforeunload", () => {
        if (forestGenerator) {
            forestGenerator.dispose();
        }
    });
}

// Global functions for backward compatibility with inline HTML handlers
// These will be gradually replaced by proper event listeners

(window as any).loadPlants = function (): void {
    if (forestGenerator && forestGenerator.plantSystem) {
        forestGenerator.plantSystem.loadPlants();
    }
};

(window as any).generateForest = function (): void {
    if (forestGenerator && forestGenerator.uiSystem) {
        forestGenerator.uiSystem.handleGenerateForest();
    }
};

(window as any).clearForest = function (): void {
    if (forestGenerator && forestGenerator.uiSystem) {
        forestGenerator.uiSystem.handleClearForest();
    }
};

(window as any).exportForest = function (): void {
    if (forestGenerator && forestGenerator.uiSystem) {
        forestGenerator.uiSystem.handleExportForest();
    }
};

(window as any).updateValueDisplay = function (
    elementId: string,
    value: string,
): void {
    if (forestGenerator && forestGenerator.uiSystem) {
        forestGenerator.uiSystem.updateValueDisplay(elementId, value);
    }
};

// Time control functions
(window as any).updateDayDuration = function (value: string): void {
    if (forestGenerator && forestGenerator.lightingSystem) {
        forestGenerator.lightingSystem.setDayDuration(
            parseFloat(value) * 60000,
        ); // Convert to milliseconds
    }
    (window as any).updateValueDisplay("dayDuration", value + " min");
};

(window as any).updateTimeSpeed = function (value: string): void {
    if (forestGenerator && forestGenerator.lightingSystem) {
        forestGenerator.lightingSystem.setTimeSpeed(parseFloat(value));
    }
    (window as any).updateValueDisplay("timeSpeed", value + "x");
};

(window as any).toggleTimeFreeze = function (paused: boolean): void {
    if (forestGenerator && forestGenerator.lightingSystem) {
        if (paused) {
            forestGenerator.lightingSystem.pauseTime();
        } else {
            forestGenerator.lightingSystem.resumeTime();
        }
    }
};

(window as any).updateFogIntensity = function (value: string): void {
    if (forestGenerator && forestGenerator.lightingSystem) {
        forestGenerator.lightingSystem.setFogIntensity(parseFloat(value));
    }
    (window as any).updateValueDisplay(
        "fogIntensity",
        Math.round(parseFloat(value) * 100) + "%",
    );
};

(window as any).updateFlashlightIntensity = function (value: string): void {
    if (forestGenerator && forestGenerator.lightingSystem) {
        forestGenerator.lightingSystem.setFlashlightIntensity(
            parseFloat(value),
        );
    }
    (window as any).updateValueDisplay("flashlightIntensity", value);
};

// Utility functions
function showError(message: string): void {
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #f44336;
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 10000;
        max-width: 400px;
        text-align: center;
    `;
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}

// Export for debugging
(window as any).forestGenerator = null; // Will be set in initApp after initialization
