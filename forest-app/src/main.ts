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
        // Handle terrain shortcuts first
        if (handleTerrainShortcuts(event)) {
            return; // Prevent default behavior if terrain shortcut was handled
        }

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

    // Update tutorial with terrain shortcuts
    setTimeout(updateTutorialWithTerrainShortcuts, 1000);

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

// Add terrain shortcut help to tutorial
function updateTutorialWithTerrainShortcuts(): void {
    const tutorialContent = document.querySelector("#tutorial-popup div");
    if (
        tutorialContent &&
        !tutorialContent.textContent?.includes("Terrain Shortcuts")
    ) {
        const terrainShortcuts = document.createElement("div");
        terrainShortcuts.innerHTML = `
            <br><strong>Terrain Shortcuts:</strong><br>
            • Shift+1 - Countryside preset<br>
            • Shift+2 - Alpine preset<br>
            • Shift+3 - Forest Floor preset<br>
            • Shift+T - Cycle terrain types<br>
            • Shift+R - Regenerate terrain<br>
        `;
        tutorialContent.appendChild(terrainShortcuts);
    }
}

// Terrain control functions
(window as any).setTerrainType = function (type: string): void {
    if (forestGenerator) {
        forestGenerator.setTerrainType(type);
        // Update terrain stats display
        updateTerrainStatsDisplay();
    }
    console.log(`Terrain type changed to: ${type}`);
};

(window as any).updateTerrainHeight = function (value: string): void {
    if (forestGenerator) {
        forestGenerator.setTerrainHeightVariation(parseFloat(value));
    }
    (window as any).updateValueDisplay("terrainHeight", value);
};

(window as any).updateTerrainHeightVariation = function (value: string): void {
    if (forestGenerator) {
        forestGenerator.setTerrainHeightVariation(parseFloat(value));
        updateTerrainStatsDisplay();
    }
    (window as any).updateValueDisplay("terrainHeightVariation", value);
};

(window as any).updateTerrainColor = function (color: string): void {
    if (forestGenerator) {
        const hexColor = parseInt(color.replace("#", ""), 16);
        forestGenerator.setTerrainColor(hexColor);
    }
    console.log(`Terrain color changed to: ${color}`);
};

(window as any).regenerateTerrain = function (): void {
    if (forestGenerator) {
        forestGenerator.regenerateTerrain();
        updateTerrainStatsDisplay();
    }
    console.log("Terrain regenerated");
};

(window as any).getTerrainStats = function (): any {
    if (forestGenerator) {
        return forestGenerator.getTerrainStats();
    }
    return null;
};

// Terrain preset functions
(window as any).applyTerrainPreset = function (presetName: string): void {
    if (!forestGenerator) return;

    const presets = {
        COUNTRYSIDE: {
            type: "rolling",
            heightVariation: 2,
            color: "#90EE90",
        },
        ALPINE: {
            type: "mountainous",
            heightVariation: 8,
            color: "#8FBC8F",
        },
        FOREST_FLOOR: {
            type: "hilly",
            heightVariation: 3,
            color: "#556B2F",
        },
    };

    const preset = presets[presetName as keyof typeof presets];
    if (preset) {
        // Update UI controls
        const terrainTypeSelect = document.getElementById(
            "terrainType",
        ) as HTMLSelectElement;
        const heightVariationSlider = document.getElementById(
            "terrainHeightVariation",
        ) as HTMLInputElement;
        const colorPicker = document.getElementById(
            "terrainColor",
        ) as HTMLInputElement;

        if (terrainTypeSelect) terrainTypeSelect.value = preset.type;
        if (heightVariationSlider)
            heightVariationSlider.value = preset.heightVariation.toString();
        if (colorPicker) colorPicker.value = preset.color;

        // Apply changes
        forestGenerator.setTerrainType(preset.type);
        forestGenerator.setTerrainHeightVariation(preset.heightVariation);
        forestGenerator.setTerrainColor(
            parseInt(preset.color.replace("#", ""), 16),
        );
        forestGenerator.regenerateTerrain();

        // Update displays
        (window as any).updateValueDisplay(
            "terrainHeightVariation",
            preset.heightVariation.toString(),
        );
        updateTerrainStatsDisplay();

        console.log(`Applied terrain preset: ${presetName}`);
    }
};

// Function to update terrain stats in the UI
function updateTerrainStatsDisplay(): void {
    if (forestGenerator) {
        const stats = forestGenerator.getTerrainStats();
        if (stats) {
            const terrainTypeElement = document.getElementById("terrain-type");
            const terrainTrianglesElement =
                document.getElementById("terrain-triangles");

            if (terrainTypeElement) {
                terrainTypeElement.textContent = stats.terrainType || "Rolling";
            }
            if (terrainTrianglesElement) {
                terrainTrianglesElement.textContent = (
                    stats.triangles || 20000
                ).toLocaleString();
            }
        }
    }
}

// Terrain keyboard shortcuts handler
function handleTerrainShortcuts(event: KeyboardEvent): boolean {
    if (!forestGenerator || event.ctrlKey || event.altKey || event.metaKey) {
        return false;
    }

    switch (event.code) {
        case "Digit1":
            if (!event.shiftKey) return false;
            event.preventDefault();
            (window as any).applyTerrainPreset("COUNTRYSIDE");
            showTerrainMessage("🌄 Switched to Countryside terrain");
            return true;

        case "Digit2":
            if (!event.shiftKey) return false;
            event.preventDefault();
            (window as any).applyTerrainPreset("ALPINE");
            showTerrainMessage("🏔️ Switched to Alpine terrain");
            return true;

        case "Digit3":
            if (!event.shiftKey) return false;
            event.preventDefault();
            (window as any).applyTerrainPreset("FOREST_FLOOR");
            showTerrainMessage("🌲 Switched to Forest Floor terrain");
            return true;

        case "KeyT":
            if (!event.shiftKey) return false;
            event.preventDefault();
            cycleTerrainType();
            return true;

        case "KeyR":
            if (!event.shiftKey) return false;
            event.preventDefault();
            (window as any).regenerateTerrain();
            showTerrainMessage("🔄 Terrain regenerated");
            return true;

        default:
            return false;
    }
}

// Cycle through terrain types
function cycleTerrainType(): void {
    const terrainTypeSelect = document.getElementById(
        "terrainType",
    ) as HTMLSelectElement;
    if (!terrainTypeSelect) return;

    const options = Array.from(terrainTypeSelect.options);
    const currentIndex = terrainTypeSelect.selectedIndex;
    const nextIndex = (currentIndex + 1) % options.length;

    terrainTypeSelect.selectedIndex = nextIndex;
    const newType = options[nextIndex].value;

    (window as any).setTerrainType(newType);
    showTerrainMessage(`🏞️ Switched to ${options[nextIndex].text} terrain`);
}

// Show terrain message notification
function showTerrainMessage(message: string): void {
    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = `
        position: fixed;
        top: 120px;
        left: 20px;
        background: rgba(74, 93, 35, 0.95);
        color: #8fbc8f;
        padding: 10px 15px;
        border-radius: 5px;
        z-index: 2000;
        font-weight: bold;
        border-left: 4px solid #8fbc8f;
        font-family: 'Segoe UI', sans-serif;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 2500);
}

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
