import * as THREE from "three";

export class LightingSystem {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;

        // Day/Night cycle properties
        this.dayDuration = 120000; // 2 minutes in milliseconds
        this.dayStartTime = Date.now();
        this.sunRadius = 300;
        this.sunHeight = 100;
        this.sunMesh = null;
        this.moonMesh = null;
        this.sunLight = null;
        this.hemisphereLight = null;

        // Fog properties
        this.fogEnabled = true;
        this.fogCycleTime = 20000; // 20 seconds cycle for longer fog states
        this.fogStartTime = Date.now();
        this.baseFogDensity = 0.002;
        this.maxFogDensity = 0.8;

        // Time control properties
        this.timeSpeed = 1.0;
        this.timePaused = false;
        this.lastUpdateTime = Date.now();

        // Flashlight properties
        this.flashlight = null;
        this.flashlightEnabled = false;
        this.flashlightIntensity = 70; // Much brighter for longer range
        this.flashlightDistance = 400; // Much longer beam
        this.flashlightAngle = Math.PI * 0.17; // Slightly wider cone
        this.flashlightPenumbra = 0.7; // Softer edge for fog
    }

    init() {
        this.setupLighting();
        this.setupFog();
    }

    setupLighting() {
        // Ambient light - brighter for better night visibility
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.sunLight.position.set(100, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -200;
        this.sunLight.shadow.camera.right = 200;
        this.sunLight.shadow.camera.top = 200;
        this.sunLight.shadow.camera.bottom = -200;
        this.scene.add(this.sunLight);

        // Hemisphere light for softer lighting
        this.hemisphereLight = new THREE.HemisphereLight(
            0x87ceeb,
            0x228b22,
            0.6,
        );
        this.scene.add(this.hemisphereLight);

        // Create visible sun and moon
        this.createSun();
        this.createMoon();

        // Create flashlight
        this.createFlashlight();

        // Set initial background color
        this.renderer.setClearColor(0x87ceeb, 1);
    }

    setupFog() {
        // Setup dramatic fog that's very visible
        this.scene.fog = new THREE.Fog(0xcce7f0, 20, 200);
    }

    createSun() {
        // Create simple sun sphere
        const sunGeometry = new THREE.SphereGeometry(8, 16, 16);
        const sunMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.8,
        });
        this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        this.scene.add(this.sunMesh);
    }

    createMoon() {
        // Create simple moon sphere
        const moonGeometry = new THREE.SphereGeometry(6, 16, 16);
        const moonMaterial = new THREE.MeshStandardMaterial({
            color: 0xe6e6e6,
            emissive: 0x444444,
            emissiveIntensity: 0.3,
        });
        this.moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
        this.scene.add(this.moonMesh);
    }

    createFlashlight() {
        // Create flashlight (spot light attached to camera)
        this.flashlight = new THREE.SpotLight(
            0xffffff,
            this.flashlightIntensity,
            this.flashlightDistance,
            this.flashlightAngle,
            this.flashlightPenumbra,
        );
        this.flashlight.castShadow = true;
        this.flashlight.shadow.mapSize.width = 1024;
        this.flashlight.shadow.mapSize.height = 1024;
        this.flashlight.shadow.camera.near = 0.5;
        this.flashlight.shadow.camera.far = this.flashlightDistance;
        this.flashlight.visible = false;
        this.scene.add(this.flashlight);
        this.scene.add(this.flashlight.target);
    }

    updateDayNightCycle() {
        if (this.timePaused) return;

        const currentTime = Date.now();
        const adjustedTime = (currentTime - this.dayStartTime) * this.timeSpeed;
        const dayProgress =
            (adjustedTime % this.dayDuration) / this.dayDuration;

        // Calculate sun and moon positions
        const sunAngle = dayProgress * Math.PI * 2;
        const sunX = Math.cos(sunAngle - Math.PI / 2) * this.sunRadius;
        const sunY = Math.sin(sunAngle - Math.PI / 2) * this.sunHeight;
        const sunZ = 0;

        // Position sun
        this.sunMesh.position.set(sunX, sunY + 50, sunZ);
        this.sunLight.position.copy(this.sunMesh.position);

        // Position moon (opposite to sun)
        const moonAngle = sunAngle + Math.PI;
        const moonX = Math.cos(moonAngle - Math.PI / 2) * this.sunRadius;
        const moonY = Math.sin(moonAngle - Math.PI / 2) * this.sunHeight;
        this.moonMesh.position.set(moonX, moonY + 50, sunZ);

        // Calculate lighting intensity based on sun height
        const sunHeight = sunY;
        const dayIntensity = Math.max(0, Math.min(1, (sunHeight + 20) / 40));
        const nightIntensity = 1 - dayIntensity;

        // Adjust sun light intensity
        this.sunLight.intensity = dayIntensity * 1.2;

        // Adjust hemisphere light
        this.hemisphereLight.intensity = 0.3 + dayIntensity * 0.5;

        // Update sky color
        const dayColor = new THREE.Color(0x87ceeb);
        const nightColor = new THREE.Color(0x191970);
        const currentSkyColor = dayColor
            .clone()
            .lerp(nightColor, nightIntensity);
        this.renderer.setClearColor(currentSkyColor);

        // Update fog color to match sky
        if (this.scene.fog) {
            this.scene.fog.color = currentSkyColor.clone();
        }

        // Control sun/moon visibility
        this.sunMesh.visible = dayIntensity > 0.1;
        this.moonMesh.visible = nightIntensity > 0.1;
    }

    updateFog() {
        if (!this.fogEnabled || !this.scene.fog) return;

        const currentTime = Date.now();
        const fogProgress =
            ((currentTime - this.fogStartTime) % this.fogCycleTime) /
            this.fogCycleTime;

        // Create a fog cycle that varies density
        const fogCycle = Math.sin(fogProgress * Math.PI * 2) * 0.5 + 0.5;
        const fogDensity = this.baseFogDensity + fogCycle * this.maxFogDensity;

        // Apply fog density by adjusting the far distance
        const baseFar = 200;
        const minFar = 30;
        this.scene.fog.far = Math.max(minFar, baseFar * (1 - fogDensity));
    }

    updateFlashlight(camera) {
        if (!this.flashlight || !camera) return;

        // Position flashlight at camera
        this.flashlight.position.copy(camera.position);

        // Point flashlight in camera direction
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        this.flashlight.target.position.copy(camera.position).add(direction);

        // Update visibility
        this.flashlight.visible = this.flashlightEnabled;
    }

    toggleFlashlight() {
        this.flashlightEnabled = !this.flashlightEnabled;

        // Update UI indicator
        const indicator = document.getElementById("flashlight-indicator");
        if (indicator) {
            indicator.style.display = this.flashlightEnabled ? "block" : "none";
        }

        return this.flashlightEnabled;
    }

    setDayDuration(milliseconds) {
        this.dayDuration = milliseconds;
        console.log(`Day duration set to ${milliseconds / 60000} minutes`);
    }

    setTimeSpeed(speed) {
        this.timeSpeed = speed;
        console.log(`Time speed set to ${speed}x`);
    }

    setTimePaused(paused) {
        this.timePaused = paused;
        console.log(`Time ${paused ? "paused" : "resumed"}`);
    }

    setFogIntensity(intensity) {
        // This will be handled by the fog update cycle
        console.log(`Fog intensity set to ${intensity}`);
    }

    setFlashlightIntensity(intensity) {
        this.flashlightIntensity = intensity;
        if (this.flashlight) {
            this.flashlight.intensity = intensity;
        }
        console.log(`Flashlight intensity set to ${intensity}`);
    }

    setFogEnabled(enabled) {
        this.fogEnabled = enabled;
        if (!enabled && this.scene.fog) {
            this.scene.fog.far = 1000; // Effectively disable fog
        }
    }

    update(deltaTimeOrCamera) {
        // Handle both deltaTime and camera parameter for backward compatibility
        const camera =
            deltaTimeOrCamera && deltaTimeOrCamera.position
                ? deltaTimeOrCamera
                : null;

        this.updateDayNightCycle();
        this.updateFog();
        this.updateFlashlight(camera);
    }

    getStats() {
        // Calculate current time of day
        const currentTime = Date.now();
        const elapsed = (currentTime - this.dayStartTime) % this.dayDuration;
        const timeOfDay = elapsed / this.dayDuration;
        const hours = Math.floor(timeOfDay * 24);
        const minutes = Math.floor((timeOfDay * 24 * 60) % 60);
        const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

        // Determine period of day
        let period = "Night";
        if (this.sunLight) {
            const intensity = this.sunLight.intensity;
            if (intensity > 0.8) {
                period = "Day";
            } else if (intensity > 0.3) {
                period = timeOfDay < 0.5 ? "Dawn" : "Dusk";
            }
        }

        // Calculate fog status
        const fogTime = (currentTime - this.fogStartTime) % this.fogCycleTime;
        const fogCycle = fogTime / this.fogCycleTime;
        let fogStatus = "Clear";
        if (fogCycle > 0.3 && fogCycle < 0.7) {
            fogStatus = "Foggy";
        } else if (fogCycle > 0.7 && fogCycle < 0.8) {
            fogStatus = "Heavy Fog";
        }

        return {
            timeString,
            period,
            fogStatus,
            flashlightEnabled: this.flashlightEnabled,
            timePaused: this.timePaused,
            timeSpeed: this.timeSpeed,
        };
    }

    onKeyDown(event) {
        switch (event.code) {
            case "KeyL":
                this.toggleFlashlight();
                break;
            case "KeyH":
                // Show tutorial - this will be handled by UISystem
                break;
        }
    }

    onKeyUp(event) {
        // No key-up handlers needed for lighting system currently
    }

    dispose() {
        // Clean up lighting resources
        if (this.sunMesh) {
            this.scene.remove(this.sunMesh);
            this.sunMesh.geometry?.dispose();
            this.sunMesh.material?.dispose();
        }

        if (this.moonMesh) {
            this.scene.remove(this.moonMesh);
            this.moonMesh.geometry?.dispose();
            this.moonMesh.material?.dispose();
        }

        if (this.flashlight) {
            this.scene.remove(this.flashlight);
            if (this.flashlight.target) {
                this.scene.remove(this.flashlight.target);
            }
        }

        console.log("LightingSystem disposed");
    }
}
