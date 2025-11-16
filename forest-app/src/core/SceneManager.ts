import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { TerrainSystem, TerrainType } from "../systems/TerrainSystem.js";

interface SceneStats {
    plants: number;
    triangles: number;
}

export class SceneManager {
    public scene: THREE.Scene | null;
    public camera: THREE.PerspectiveCamera | null;
    public renderer: THREE.WebGLRenderer | null;
    public controls: PointerLockControls | null;
    public forestGroup: THREE.Group | null;
    public terrainSystem: TerrainSystem | null;

    private canvas: HTMLCanvasElement | null;
    private animationId: number | null;
    public readonly groundLevel: number;
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.forestGroup = null;
        this.terrainSystem = null;
        this.canvas = null;
        this.animationId = null;
        this.groundLevel = -2;
    }

    public async init(): Promise<void> {
        this.setupCanvas();
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.initTerrain();
        this.setupEventListeners();
    }

    private setupCanvas(): void {
        this.canvas = document.getElementById(
            "forest-canvas",
        ) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error('Canvas element "forest-canvas" not found');
        }
    }

    private setupScene(): void {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 500);

        // Create forest group for plant organization
        this.forestGroup = new THREE.Group();
        this.scene.add(this.forestGroup);

        console.log("Scene initialized");
    }

    private setupCamera(): void {
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.canvas.clientWidth / this.canvas.clientHeight,
            0.1,
            1000,
        );
        this.camera.position.set(0, 1.6, 5);
        console.log("Camera initialized");
    }

    private setupRenderer(): void {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
        });

        this.renderer.setSize(
            this.canvas.clientWidth,
            this.canvas.clientHeight,
        );

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x87ceeb, 1);

        console.log("Renderer initialized");
    }

    private setupControls(): void {
        this.controls = new PointerLockControls(
            this.camera,
            this.renderer.domElement,
        );

        this.scene.add(this.controls.getObject());

        // Click to lock pointer
        this.renderer.domElement.addEventListener("click", () => {
            this.controls.lock();
        });

        console.log("Controls initialized");
    }

    private initTerrain(): void {
        if (!this.scene) {
            throw new Error("Scene must be initialized before terrain");
        }

        // Create terrain system with default configuration
        this.terrainSystem = new TerrainSystem(this.scene, {
            size: 2000,
            segments: 100,
            heightVariation: 2,
            color: 0x228b22,
            level: this.groundLevel,
        });

        // Initialize the terrain
        this.terrainSystem.init();

        console.log("Terrain system initialized");
    }

    private setupEventListeners(): void {
        // Window resize handling
        window.addEventListener("resize", () => this.handleResize());
    }

    public handleResize(): void {
        if (!this.canvas || !this.camera || !this.renderer) return;

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);

        console.log(`Scene resized to ${width}x${height}`);
    }

    public getGroundHeight(x: number, z: number): number {
        // Delegate to terrain system
        if (this.terrainSystem) {
            return this.terrainSystem.getGroundHeight(x, z);
        }
        return this.groundLevel;
    }

    // Terrain management methods
    public setTerrainType(type: TerrainType): void {
        if (this.terrainSystem) {
            this.terrainSystem.setTerrainType(type);
        }
    }

    public setTerrainHeightVariation(variation: number): void {
        if (this.terrainSystem) {
            this.terrainSystem.setHeightVariation(variation);
        }
    }

    public setTerrainColor(color: number): void {
        if (this.terrainSystem) {
            this.terrainSystem.setTerrainColor(color);
        }
    }

    public regenerateTerrain(): void {
        if (this.terrainSystem) {
            this.terrainSystem.regenerateTerrain();
        }
    }

    public getTerrainStats(): any {
        return this.terrainSystem ? this.terrainSystem.getStats() : null;
    }

    public getSafeSpawnPosition(): THREE.Vector3 {
        if (this.terrainSystem) {
            return this.terrainSystem.getSafeSpawnPosition();
        }
        return new THREE.Vector3(0, this.groundLevel, 0);
    }

    public isPositionOnTerrain(x: number, z: number): boolean {
        return this.terrainSystem
            ? this.terrainSystem.isPositionOnTerrain(x, z)
            : false;
    }

    public updateFog(density?: number, color?: number): void {
        if (this.scene.fog && density !== undefined) {
            // Update fog density while maintaining distance ratios
            const baseNear = 50;
            const baseFar = 500;

            (this.scene.fog as THREE.Fog).near = baseNear * (1 - density * 0.9);
            (this.scene.fog as THREE.Fog).far = baseFar * (1 - density * 0.8);

            if (color !== undefined) {
                this.scene.fog.color.setHex(color);
            }
        }
    }

    public setBackground(color: number): void {
        if (this.scene && this.renderer) {
            this.scene.background = new THREE.Color(color);
            this.renderer.setClearColor(color, 1);
        }
    }

    public render(): void {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    public startAnimation(animateCallback?: () => void): void {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);

            if (animateCallback) {
                animateCallback();
            }

            this.render();
        };

        animate();
        console.log("Animation loop started");
    }

    public stopAnimation(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            console.log("Animation loop stopped");
        }
    }

    public addToForest(object: THREE.Object3D): void {
        if (this.forestGroup && object) {
            this.forestGroup.add(object);
        }
    }

    public removeFromForest(object: THREE.Object3D): void {
        if (this.forestGroup && object) {
            this.forestGroup.remove(object);
        }
    }

    public clearForest(): void {
        if (!this.forestGroup) return;

        while (this.forestGroup.children.length > 0) {
            const child = this.forestGroup.children[0];
            this.forestGroup.remove(child);

            // Dispose of geometry and materials
            child.traverse((obj) => {
                const mesh = obj as any;
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) {
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach((material: any) => {
                            if (material.map) material.map.dispose();
                            material.dispose();
                        });
                    } else {
                        if (mesh.material.map) mesh.material.map.dispose();
                        mesh.material.dispose();
                    }
                }
            });
        }

        console.log("Forest cleared");
    }

    public getStats(): SceneStats {
        const stats = {
            plants: this.forestGroup ? this.forestGroup.children.length : 0,
            triangles: 0,
        };

        // Count triangles
        if (this.forestGroup) {
            this.forestGroup.traverse((child) => {
                const mesh = child as any;
                if (mesh.geometry && mesh.geometry.index) {
                    stats.triangles += mesh.geometry.index.count / 3;
                }
            });
        }

        return stats;
    }

    public dispose(): void {
        this.stopAnimation();
        this.clearForest();

        if (this.terrainSystem) {
            this.terrainSystem.dispose();
            this.terrainSystem = null;
        }

        if (this.forestGroup) {
            this.scene.remove(this.forestGroup);
            this.forestGroup = null;
        }

        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }

        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }

        this.scene = null;
        this.camera = null;
        this.canvas = null;

        console.log("SceneManager disposed");
    }
}
