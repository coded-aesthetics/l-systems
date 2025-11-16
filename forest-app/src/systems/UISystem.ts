export class UISystem {
    constructor() {
        this.sliderHandlers = new Map();
        this.forestGenerator = null;
        this.isFullscreen = false;
    }

    init(forestGenerator) {
        this.forestGenerator = forestGenerator;
        this.setupSliders();
        this.setupButtons();
        this.setupEventListeners();
        this.initializeValueDisplays();
        this.hideFullscreenIndicator();
    }

    setupSliders() {
        // Plant Count Slider
        this.setupSlider("plantCount", (value) => {
            this.updateValueDisplay("plantCount", value);
        });

        // Forest Size Slider
        this.setupSlider("forestSize", (value) => {
            this.updateValueDisplay("forestSize", value);
        });

        // Min Distance Slider
        this.setupSlider("minDistance", (value) => {
            this.updateValueDisplay("minDistance", value);
        });

        // Scale Variation Slider
        this.setupSlider("scaleVariation", (value) => {
            this.updateValueDisplay("scaleVariation", value + "%");
        });

        // Terrain Height Slider
        this.setupSlider("terrainHeight", (value) => {
            this.updateValueDisplay("terrainHeight", value);
        });

        // Day Duration Slider
        this.setupSlider("dayDuration", (value) => {
            const minutes = parseFloat(value);
            this.updateValueDisplay("dayDuration", `${minutes} min`);
            if (this.forestGenerator && this.forestGenerator.lightingSystem) {
                this.forestGenerator.lightingSystem.setDayDuration(
                    minutes * 60000,
                );
            }
        });

        // Time Speed Slider
        this.setupSlider("timeSpeed", (value) => {
            const speed = parseFloat(value);
            this.updateValueDisplay("timeSpeed", `${speed}x`);
            if (this.forestGenerator && this.forestGenerator.lightingSystem) {
                this.forestGenerator.lightingSystem.setTimeSpeed(speed);
            }
        });

        // Note: Fog and flashlight intensity sliders don't exist in HTML
        // so we don't set up handlers for them
    }

    setupSlider(sliderId, handler) {
        const slider = document.getElementById(sliderId);
        if (slider) {
            console.log(`Slider ${sliderId} found and handler attached`);
            slider.addEventListener("input", (event) => {
                console.log(
                    `Slider ${sliderId} changed to:`,
                    event.target.value,
                );
                handler(event.target.value);
            });
            this.sliderHandlers.set(sliderId, handler);
        } else {
            console.warn(`Slider ${sliderId} not found in DOM`);
        }
    }

    setupButtons() {
        // Generate Forest Button
        const generateBtn = document.getElementById("generateBtn");
        if (generateBtn) {
            generateBtn.addEventListener("click", () => {
                this.handleGenerateForest();
            });
        }

        // Clear Forest Button
        const clearBtn = document.querySelector(
            'button[onclick="clearForest()"]',
        );
        if (clearBtn) {
            clearBtn.onclick = null; // Remove inline handler
            clearBtn.addEventListener("click", () => {
                this.handleClearForest();
            });
        }

        // Export Forest Button
        const exportBtn = document.querySelector(
            'button[onclick="exportForest()"]',
        );
        if (exportBtn) {
            exportBtn.onclick = null; // Remove inline handler
            exportBtn.addEventListener("click", () => {
                this.handleExportForest();
            });
        }

        // Help Button
        const helpBtn = document.getElementById("help-btn");
        if (helpBtn) {
            helpBtn.addEventListener("click", () => {
                this.showTutorial();
            });
        }

        // Refresh Plants Button
        const refreshPlantsBtn = document.querySelector(
            'button[onclick="loadPlants()"]',
        );
        if (refreshPlantsBtn) {
            refreshPlantsBtn.onclick = null; // Remove inline handler
            refreshPlantsBtn.addEventListener("click", () => {
                this.handleRefreshPlants();
            });
        }

        // Time Control Buttons
        this.setupTimeControlButtons();
    }

    setupTimeControlButtons() {
        // Pause/Play Button
        const pauseBtn = document.getElementById("pauseTime");
        if (pauseBtn) {
            pauseBtn.addEventListener("change", () => {
                if (
                    this.forestGenerator &&
                    this.forestGenerator.lightingSystem
                ) {
                    this.forestGenerator.lightingSystem.setTimePaused(
                        pauseBtn.checked,
                    );
                }
            });
        }

        // Reset Time Button
        const resetBtn = document.getElementById("resetTime");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                if (
                    this.forestGenerator &&
                    this.forestGenerator.lightingSystem
                ) {
                    this.forestGenerator.lightingSystem.resetTime();
                }
            });
        }
    }

    setupEventListeners() {
        // Fullscreen toggle is now handled by global event system
        // through ForestGenerator.onKeyDown() to prevent conflicts

        // Window resize handling
        window.addEventListener("resize", () => {
            this.handleResize();
        });
    }

    initializeValueDisplays() {
        // Initialize all slider value displays with their current values
        const sliders = [
            "plantCount",
            "forestSize",
            "minDistance",
            "scaleVariation",
            "terrainHeight",
            "dayDuration",
            "timeSpeed",
        ];

        sliders.forEach((sliderId) => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                const handler = this.sliderHandlers.get(sliderId);
                if (handler) {
                    handler(slider.value);
                } else {
                    // Fallback for sliders without custom handlers
                    this.updateValueDisplay(sliderId, slider.value);
                }
            }
        });
    }

    updateValueDisplay(elementId, value) {
        // Try hyphenated pattern first (preferred)
        let displayElement = document.getElementById(`${elementId}-value`);
        if (!displayElement) {
            // Fallback to camelCase pattern
            displayElement = document.getElementById(`${elementId}Value`);
        }
        if (displayElement) {
            displayElement.textContent = value;
        } else {
            console.warn(
                `Could not find display element for ${elementId}. Tried: ${elementId}-value and ${elementId}Value`,
            );
        }
    }

    handleGenerateForest() {
        if (!this.forestGenerator || !this.forestGenerator.plantSystem) {
            this.showError("Forest generator not initialized");
            return;
        }

        console.log(
            "UISystem.handleGenerateForest: Checking selected plants...",
        );
        console.log(
            "PlantSystem available:",
            !!this.forestGenerator.plantSystem,
        );

        const selectedPlants =
            this.forestGenerator.plantSystem.getSelectedPlants();
        console.log("Selected plants count:", selectedPlants.length);
        console.log("Selected plants data:", selectedPlants);

        if (selectedPlants.length === 0) {
            console.error("No plants selected, showing error to user");
            this.showError("Please select at least one plant type!");
            return;
        }

        // Skip validation - generate forest directly

        // Show loading state
        this.setGenerating(true);

        // Generate forest
        this.forestGenerator
            .generateForest()
            .then(() => {
                this.showSuccess("Forest generated successfully!");
            })
            .catch((error) => {
                this.showError("Failed to generate forest: " + error.message);
                console.error("Forest generation error:", error);
            })
            .finally(() => {
                this.setGenerating(false);
            });
    }

    handleClearForest() {
        if (!this.forestGenerator) return;

        this.forestGenerator.clearForest();
        this.showSuccess("Forest cleared");
    }

    handleExportForest() {
        if (!this.forestGenerator) return;

        try {
            this.forestGenerator.exportForest();
            this.showSuccess("Scene exported successfully!");
        } catch (error) {
            this.showError("Failed to export scene: " + error.message);
            console.error("Export error:", error);
        }
    }

    handleRefreshPlants() {
        if (!this.forestGenerator || !this.forestGenerator.plantSystem) {
            this.showError("Plant system not initialized");
            return;
        }

        this.forestGenerator.plantSystem
            .loadPlants()
            .then(() => {
                this.showSuccess("Plants refreshed");
            })
            .catch((error) => {
                this.showError("Failed to refresh plants: " + error.message);
            });
    }

    setGenerating(isGenerating) {
        const generateBtn = document.getElementById("generateBtn");
        const loadingEl = document.getElementById("generation-loading");

        if (generateBtn) {
            generateBtn.disabled = isGenerating;
            generateBtn.textContent = isGenerating
                ? "Generating..."
                : "Generate Forest";
        }

        if (loadingEl) {
            loadingEl.style.display = isGenerating ? "block" : "none";
        }
    }

    showTutorial() {
        const tutorialPopup = document.getElementById("tutorial-popup");
        if (tutorialPopup) {
            tutorialPopup.style.display = "block";
        }
    }

    hideTutorial() {
        const tutorialPopup = document.getElementById("tutorial-popup");
        if (tutorialPopup) {
            tutorialPopup.style.display = "none";
        }
    }

    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;

        if (this.isFullscreen) {
            document.body.classList.add("fullscreen-mode");
            this.showFullscreenIndicator();
        } else {
            document.body.classList.remove("fullscreen-mode");
            this.hideFullscreenIndicator();
        }

        // Trigger resize to update canvas
        setTimeout(() => {
            this.handleResize();
        }, 100);

        console.log(`Fullscreen mode: ${this.isFullscreen ? "ON" : "OFF"}`);
    }

    showFullscreenIndicator() {
        const indicator = document.getElementById("fullscreen-indicator");
        if (indicator) {
            indicator.style.display = "block";
        }
    }

    hideFullscreenIndicator() {
        const indicator = document.getElementById("fullscreen-indicator");
        if (indicator) {
            indicator.style.display = "none";
        }
    }

    handleResize() {
        if (this.forestGenerator) {
            this.forestGenerator.handleResize();
        }
    }

    showSuccess(message) {
        this.showNotification(message, "success");
    }

    showError(message) {
        this.showNotification(message, "error");
        console.error("UI Error:", message);
    }

    showNotification(message, type = "info") {
        // Create notification element if it doesn't exist
        let notification = document.getElementById("notification");
        if (!notification) {
            notification = document.createElement("div");
            notification.id = "notification";
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 4px;
                color: white;
                font-weight: bold;
                z-index: 10000;
                max-width: 300px;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(notification);
        }

        // Set notification style based on type
        switch (type) {
            case "success":
                notification.style.backgroundColor = "#4CAF50";
                break;
            case "error":
                notification.style.backgroundColor = "#F44336";
                break;
            case "warning":
                notification.style.backgroundColor = "#FF9800";
                break;
            default:
                notification.style.backgroundColor = "#2196F3";
        }

        notification.textContent = message;
        notification.style.display = "block";
        notification.style.opacity = "1";

        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.style.opacity = "0";
            setTimeout(() => {
                notification.style.display = "none";
            }, 300);
        }, 3000);
    }

    updateStats(stats) {
        const elements = {
            "plant-count": stats.plants || 0,
            "triangle-count": Math.floor(stats.triangles || 0),
            "fps-count": Math.floor(stats.fps || 0),
            "time-display": stats.timeString || "00:00",
            "period-display": stats.period || "Day",
            "fog-status": stats.fogStatus || "Clear",
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Update stamina bar if available
        if (stats.stamina !== undefined) {
            this.updateStaminaBar(stats.stamina, stats.maxStamina || 100);
        }
    }

    updateStaminaBar(stamina, maxStamina) {
        const staminaBar = document.getElementById("stamina-bar");
        const staminaText = document.getElementById("stamina-text");

        if (staminaBar && staminaText) {
            const percentage = (stamina / maxStamina) * 100;
            staminaBar.style.width = `${percentage}%`;
            staminaText.textContent = `${Math.floor(stamina)}`;

            // Change color based on stamina level
            if (percentage < 30) {
                staminaBar.style.backgroundColor = "#ff4444";
            } else if (percentage < 60) {
                staminaBar.style.backgroundColor = "#ffaa00";
            } else {
                staminaBar.style.backgroundColor = "#44ff44";
            }
        }
    }

    getFormValues() {
        return {
            plantCount: parseInt(document.getElementById("plantCount").value),
            forestSize: parseInt(document.getElementById("forestSize").value),
            minDistance: parseInt(document.getElementById("minDistance").value),
            scaleVariation: parseInt(
                document.getElementById("scaleVariation").value,
            ),
            terrainHeight: parseInt(
                document.getElementById("terrainHeight").value,
            ),
        };
    }

    dispose() {
        // Clear event listeners and handlers
        this.sliderHandlers.clear();

        // Remove notification if it exists
        const notification = document.getElementById("notification");
        if (notification) {
            notification.remove();
        }

        // Reset fullscreen mode
        if (this.isFullscreen) {
            this.toggleFullscreen();
        }

        console.log("UISystem disposed");
    }
}
