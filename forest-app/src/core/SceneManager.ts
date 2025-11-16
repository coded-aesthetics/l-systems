import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export class SceneManager {
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

    async init() {
        this.setupCanvas();
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.createGround();
        this.setupEventListeners();
    }

    setupCanvas() {
        this.canvas = document.getElementById("forest-canvas");
        if (!this.canvas) {
            throw new Error('Canvas element "forest-canvas" not found');
        }
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 500);

        // Create forest group for plant organization
        this.forestGroup = new THREE.Group();
        this.scene.add(this.forestGroup);

        console.log("Scene initialized");
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.canvas.clientWidth / this.canvas.clientHeight,
            0.1,
            1000,
        );
        this.camera.position.set(0, 1.6, 5);
        console.log("Camera initialized");
    }

    setupRenderer() {
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

    setupControls() {
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

    createGround() {
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

    setupEventListeners() {
        // Window resize handling
        window.addEventListener("resize", () => this.handleResize());
    }

    handleResize() {
        if (!this.canvas || !this.camera || !this.renderer) return;

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);

        console.log(`Scene resized to ${width}x${height}`);
    }

    getGroundHeight(x, z) {
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

    updateFog(density, color) {
        if (this.scene.fog && density !== undefined) {
            // Update fog density while maintaining distance ratios
            const baseNear = 50;
            const baseFar = 500;

            this.scene.fog.near = baseNear * (1 - density * 0.9);
            this.scene.fog.far = baseFar * (1 - density * 0.8);

            if (color !== undefined) {
                this.scene.fog.color.setHex(color);
            }
        }
    }

    setBackground(color) {
        if (this.scene && this.renderer) {
            this.scene.background = new THREE.Color(color);
            this.renderer.setClearColor(color, 1);
        }
    }

    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    startAnimation(animateCallback) {
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

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            console.log("Animation loop stopped");
        }
    }

    addToForest(object) {
        if (this.forestGroup && object) {
            this.forestGroup.add(object);
        }
    }

    removeFromForest(object) {
        if (this.forestGroup && object) {
            this.forestGroup.remove(object);
        }
    }

    clearForest() {
        if (!this.forestGroup) return;

        while (this.forestGroup.children.length > 0) {
            const child = this.forestGroup.children[0];
            this.forestGroup.remove(child);

            // Dispose of geometry and materials
            child.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach((material) => {
                            if (material.map) material.map.dispose();
                            material.dispose();
                        });
                    } else {
                        if (obj.material.map) obj.material.map.dispose();
                        obj.material.dispose();
                    }
                }
            });
        }

        console.log("Forest cleared");
    }

    getStats() {
        const stats = {
            plants: this.forestGroup ? this.forestGroup.children.length : 0,
            triangles: 0,
        };

        // Count triangles
        if (this.forestGroup) {
            this.forestGroup.traverse((child) => {
                if (child.geometry && child.geometry.index) {
                    stats.triangles += child.geometry.index.count / 3;
                }
            });
        }

        return stats;
    }

    dispose() {
        this.stopAnimation();
        this.clearForest();

        if (this.ground) {
            this.scene.remove(this.ground);
            this.ground.geometry.dispose();
            this.ground.material.dispose();
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
