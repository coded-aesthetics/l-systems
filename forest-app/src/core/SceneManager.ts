import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

interface SceneStats {
    plants: number;
    triangles: number;
}

export class SceneManager {
    public scene: THREE.Scene | null;
    public camera: THREE.PerspectiveCamera | null;
    public renderer: THREE.WebGLRenderer | null;
    public controls: PointerLockControls | null;
    public ground: THREE.Mesh | null;
    public forestGroup: THREE.Group | null;

    private canvas: HTMLCanvasElement | null;
    private animationId: number | null;
    public readonly groundLevel: number;
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.ground = null;
        this.forestGroup = null;
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
        this.createGround();
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

    private createGround(): void {
        const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);

        const groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x228b22,
        });

        // Add some random height variation to vertices
        const positionAttribute = groundGeometry.getAttribute("position");
        for (let i = 0; i < positionAttribute.count; i++) {
            // Get current position
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);

            // Add height variation to Z coordinate (which becomes Y after rotation)
            const height = Math.random() * 2 - 1;
            positionAttribute.setZ(i, height);
        }

        positionAttribute.needsUpdate = true;
        groundGeometry.computeVertexNormals();

        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = this.groundLevel;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        console.log("Ground created");
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
        // Simple raycasting to get ground height at position
        if (!this.ground) return this.groundLevel;

        const raycaster = new THREE.Raycaster();
        const origin = new THREE.Vector3(x, 10, z);
        const direction = new THREE.Vector3(0, -1, 0);

        raycaster.set(origin, direction);
        const intersects = raycaster.intersectObject(this.ground);

        if (intersects.length > 0) {
            return intersects[0].point.y;
        }

        return this.groundLevel;
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

        if (this.ground) {
            this.scene.remove(this.ground);
            this.ground.geometry.dispose();
            if (Array.isArray(this.ground.material)) {
                this.ground.material.forEach((material) => material.dispose());
            } else {
                this.ground.material.dispose();
            }
            this.ground = null;
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
