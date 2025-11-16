import * as THREE from "three";

interface LightingStats {
    timeString: string;
    period: string;
    fogStatus: string;
}

export class LightingSystem {
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;

    // Day/Night cycle properties
    private dayDuration: number;
    private dayStartTime: number;
    private sunRadius: number;
    private sunHeight: number;
    private sunMesh: THREE.Mesh | null;
    private moonMesh: THREE.Mesh | null;
    private sunLight: THREE.DirectionalLight | null;
    private hemisphereLight: THREE.HemisphereLight | null;

    // Fog properties
    private fogEnabled: boolean;
    private fogCycleTime: number;
    private fogStartTime: number;
    private baseFogDensity: number;
    private maxFogDensity: number;

    // Time control properties
    private timeSpeed: number;
    private timePaused: boolean;
    private lastUpdateTime: number;

    // Flashlight properties
    private flashlight: THREE.SpotLight | null;
    private flashlightEnabled: boolean;
    private flashlightIntensity: number;
    private flashlightDistance: number;
    private flashlightAngle: number;
    private flashlightPenumbra: number;
    constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
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

    public init(): void {
        this.setupLighting();
        this.setupFog();
    }

    private setupLighting(): void {
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

    private setupFog(): void {
        // Setup dramatic fog that's very visible
        this.scene.fog = new THREE.Fog(0xcce7f0, 20, 200);
    }

    private createSun(): void {
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

    private createMoon(): void {
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

    private createFlashlight(): void {
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

    private updateDayNightCycle(): void {
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

        // Update moon position (opposite to sun)
        if (this.moonMesh) {
            const moonX = -sunX * 0.7;
            const moonY = -sunY * 0.7 + this.sunHeight * 0.5;
            const moonZ = -sunZ * 0.7;

            this.moonMesh.position.set(moonX, Math.max(moonY, -30), moonZ);

            // Make moon visible only during night (when sun is below horizon)
            this.moonMesh.visible = sunY <= 0 && moonY > -20;

            // Adjust moon brightness based on how dark it is
            const moonBrightness = Math.max(0, -Math.sin(sunAngle) * 0.5 + 0.2);

            // Update moon brightness - make it more visible
            (
                this.moonMesh.material as THREE.MeshStandardMaterial
            ).emissiveIntensity = Math.max(0.4, moonBrightness * 1.5);
        }

        // Calculate lighting intensity based on sun height
        const sunHeight = sunY;
        const dayIntensity = Math.max(0, Math.min(1, (sunHeight + 20) / 40));
        const nightIntensity = 1 - dayIntensity;

        // Adjust sun light intensity and color for magical moonlight
        if (dayIntensity > 0.5) {
            // Daytime - warm sunlight
            this.sunLight.color.setRGB(1.0, 0.95, 0.8);
            this.sunLight.intensity = dayIntensity * 1.2;
        } else {
            // Nighttime - blue moonlight
            this.sunLight.color.setRGB(0.7, 0.8, 1.0);
            // Ensure decent nighttime visibility
            this.sunLight.intensity = Math.max(0.5, dayIntensity * 1.2);
        }

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

        // Control sun visibility
        this.sunMesh.visible = dayIntensity > 0.1;
    }

    private updateFog(): void {
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
        (this.scene.fog as THREE.Fog).far = Math.max(
            minFar,
            baseFar * (1 - fogDensity),
        );
    }

    private updateFlashlight(camera: THREE.Camera | null): void {
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

    public toggleFlashlight(): boolean {
        this.flashlightEnabled = !this.flashlightEnabled;

        // Update UI indicator
        const indicator = document.getElementById("flashlight-indicator");
        if (indicator) {
            indicator.style.display = this.flashlightEnabled ? "block" : "none";
        }

        return this.flashlightEnabled;
    }

    public setDayDuration(milliseconds: number): void {
        this.dayDuration = milliseconds;
        console.log(`Day duration set to ${milliseconds / 60000} minutes`);
    }

    public setTimeSpeed(speed: number): void {
        this.timeSpeed = speed;
        console.log(`Time speed set to ${speed}x`);
    }

    public setTimePaused(paused: boolean): void {
        this.timePaused = paused;
        console.log(`Time ${paused ? "paused" : "resumed"}`);
    }

    public setFogIntensity(intensity: number): void {
        // This will be handled by the fog update cycle
        console.log(`Fog intensity set to ${intensity}`);
    }

    public setFlashlightIntensity(intensity: number): void {
        this.flashlightIntensity = intensity;
        if (this.flashlight) {
            this.flashlight.intensity = intensity;
        }
        console.log(`Flashlight intensity set to ${intensity}`);
    }

    public setFogEnabled(enabled: boolean): void {
        this.fogEnabled = enabled;
        if (!enabled && this.scene.fog) {
            (this.scene.fog as THREE.Fog).far = 1000; // Effectively disable fog
        }
    }

    public pauseTime(): void {
        this.setTimePaused(true);
    }

    public resumeTime(): void {
        this.setTimePaused(false);
    }

    public resetTime(): void {
        this.dayStartTime = Date.now();
        console.log("Time reset");
    }

    public update(deltaTimeOrCamera: THREE.Camera | number): void {
        // Handle both deltaTime and camera parameter for backward compatibility
        const camera =
            deltaTimeOrCamera &&
            typeof deltaTimeOrCamera === "object" &&
            "position" in deltaTimeOrCamera
                ? deltaTimeOrCamera
                : null;

        this.updateDayNightCycle();
        this.updateFog();
        this.updateFlashlight(camera);
    }

    public getStats(): LightingStats & {
        flashlightEnabled: boolean;
        timePaused: boolean;
        timeSpeed: number;
    } {
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

    public onKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case "KeyL":
                this.toggleFlashlight();
                break;
            case "KeyH":
                // Show tutorial - this will be handled by UISystem
                break;
        }
    }

    public onKeyUp(event: KeyboardEvent): void {
        // No key-up handlers needed for lighting system currently
    }

    public dispose(): void {
        // Clean up lighting resources
        if (this.sunMesh) {
            this.scene.remove(this.sunMesh);
            this.sunMesh.geometry?.dispose();
            if (Array.isArray(this.sunMesh.material)) {
                this.sunMesh.material.forEach((material) => material.dispose());
            } else {
                this.sunMesh.material?.dispose();
            }
        }

        if (this.moonMesh) {
            this.scene.remove(this.moonMesh);
            this.moonMesh.geometry?.dispose();
            if (Array.isArray(this.moonMesh.material)) {
                this.moonMesh.material.forEach((material) =>
                    material.dispose(),
                );
            } else {
                this.moonMesh.material?.dispose();
            }
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
