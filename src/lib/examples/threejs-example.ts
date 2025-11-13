/**
 * Three.js L-Systems Example
 * Demonstrates how to use the L-Systems library with Three.js
 */

import * as THREE from "three";
import {
    LSystemsLibrary,
    LSystemConfig,
    GeometryParameters,
} from "../LSystemsLibrary.js";
import {
    ThreeJSAdapter,
    ThreeJSAdapterOptions,
} from "../adapters/ThreeJSAdapter.js";

export class ThreeJSLSystemExample {
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private controls: any; // OrbitControls
    private currentMeshGroup: any; // LSystemMeshGroup

    constructor(canvas: HTMLCanvasElement, controlsClass?: any) {
        this.initThreeJS(canvas);
        this.setupLighting();

        if (controlsClass) {
            this.setupControls(controlsClass);
        }

        this.animate();
    }

    private initThreeJS(canvas: HTMLCanvasElement): void {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            1000,
        );
        this.camera.position.set(5, 5, 5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Handle resize
        window.addEventListener("resize", () => this.handleResize());
    }

    private setupLighting(): void {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Point light for highlights
        const pointLight = new THREE.PointLight(0x88ccff, 0.5, 50);
        pointLight.position.set(-5, 8, -5);
        this.scene.add(pointLight);
    }

    private setupControls(OrbitControls: any): void {
        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement,
        );
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.autoRotate = false;
    }

    /**
     * Generate and display a simple tree L-System
     */
    public generateTree(): void {
        const options: ThreeJSAdapterOptions = {
            materialType: "standard",
            branchColor: 0x8b4513, // Brown
            leafColor: 0x228b22, // Forest green
            castShadow: true,
            receiveShadow: true,
        };

        this.generateLSystemFromPreset("tree", 4, options);
    }

    /**
     * Generate and display a fern L-System
     */
    public generateFern(): void {
        const options: ThreeJSAdapterOptions = {
            materialType: "phong",
            branchColor: 0x2f4f2f, // Dark green
            leafColor: 0x90ee90, // Light green
            castShadow: true,
            receiveShadow: true,
        };

        this.generateLSystemFromPreset("fern", 5, options);
    }

    /**
     * Generate a custom L-System
     */
    public generateCustom(
        axiom: string,
        rules: string,
        angle: number,
        iterations: number,
        options: ThreeJSAdapterOptions = {},
    ): void {
        try {
            // Clear existing mesh
            this.clearCurrentMesh();

            // Create L-System configuration
            const config: LSystemConfig = {
                axiom,
                rules,
                angle,
                iterations,
            };

            // Create geometry parameters
            const geometryParams: GeometryParameters = {
                length: 1.0,
                thickness: 0.05,
                tapering: 0.8,
                leafColor: [0.2, 0.8, 0.2],
            };

            // Create Three.js mesh
            this.currentMeshGroup = ThreeJSAdapter.createMeshFromLSystem(
                config,
                geometryParams,
                options,
            );

            // Add to scene
            this.scene.add(this.currentMeshGroup.group);

            // Fit camera to object
            ThreeJSAdapter.fitCameraToMesh(
                this.currentMeshGroup,
                this.camera,
                this.controls,
            );

            console.log("L-System generated:", this.currentMeshGroup.stats);
        } catch (error) {
            console.error("Error generating L-System:", error);
            throw error;
        }
    }

    /**
     * Generate from a predefined preset
     */
    public generateLSystemFromPreset(
        presetName: string,
        iterations: number = 4,
        options: ThreeJSAdapterOptions = {},
    ): void {
        // Clear existing mesh
        this.clearCurrentMesh();

        // Create from preset
        this.currentMeshGroup = ThreeJSAdapter.createFromPreset(
            presetName,
            iterations,
            options,
        );

        if (!this.currentMeshGroup) {
            throw new Error(`Unknown preset: ${presetName}`);
        }

        // Add to scene
        this.scene.add(this.currentMeshGroup.group);

        // Fit camera to object
        ThreeJSAdapter.fitCameraToMesh(
            this.currentMeshGroup,
            this.camera,
            this.controls,
        );

        console.log(`${presetName} generated:`, this.currentMeshGroup.stats);
    }

    /**
     * Update material properties
     */
    public updateMaterials(options: Partial<ThreeJSAdapterOptions>): void {
        if (this.currentMeshGroup) {
            ThreeJSAdapter.updateMaterials(this.currentMeshGroup, options);
        }
    }

    /**
     * Export current L-System to OBJ format
     */
    public exportToOBJ(): string | null {
        if (!this.currentMeshGroup) {
            console.warn("No L-System to export");
            return null;
        }

        return ThreeJSAdapter.exportToOBJ(this.currentMeshGroup);
    }

    /**
     * Get statistics about the current L-System
     */
    public getStats(): any {
        return this.currentMeshGroup?.stats || null;
    }

    /**
     * Reset camera to default position
     */
    public resetCamera(): void {
        this.camera.position.set(5, 5, 5);
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }

    /**
     * Clear the current mesh from the scene
     */
    private clearCurrentMesh(): void {
        if (this.currentMeshGroup) {
            this.scene.remove(this.currentMeshGroup.group);
            ThreeJSAdapter.dispose(this.currentMeshGroup);
            this.currentMeshGroup = null;
        }
    }

    /**
     * Handle window resize
     */
    private handleResize(): void {
        const canvas = this.renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * Animation loop
     */
    private animate(): void {
        requestAnimationFrame(() => this.animate());

        if (this.controls) {
            this.controls.update();
        }

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Dispose of all resources
     */
    public dispose(): void {
        this.clearCurrentMesh();
        this.renderer.dispose();

        if (this.controls) {
            this.controls.dispose();
        }
    }

    // Static helper methods for common L-System patterns

    /**
     * Create a basic tree L-System configuration
     */
    static createTreeConfig(
        angle: number = 25,
        iterations: number = 4,
    ): LSystemConfig {
        return {
            axiom: "F",
            rules: "F -> F[+F]F[-F]F",
            angle,
            iterations,
        };
    }

    /**
     * Create a fern L-System configuration
     */
    static createFernConfig(
        angle: number = 25,
        iterations: number = 5,
    ): LSystemConfig {
        return {
            axiom: "X",
            rules: "X -> F[+X]F[-X]+X\nF -> FF",
            angle,
            iterations,
        };
    }

    /**
     * Create a bush L-System configuration
     */
    static createBushConfig(
        angle: number = 22,
        iterations: number = 4,
    ): LSystemConfig {
        return {
            axiom: "F",
            rules: "F -> FF+[+F-F-F]-[-F+F+F]",
            angle,
            iterations,
        };
    }

    /**
     * Create a dragon curve L-System configuration
     */
    static createDragonConfig(
        angle: number = 90,
        iterations: number = 10,
    ): LSystemConfig {
        return {
            axiom: "FX",
            rules: "X -> X+YF+\nY -> -FX-Y",
            angle,
            iterations,
        };
    }

    /**
     * Create a 3D coral-like structure configuration
     */
    static createCoralConfig(
        angle: number = 18,
        iterations: number = 4,
    ): LSystemConfig {
        return {
            axiom: "F",
            rules: "F -> F[++F][--F][^F][vF]",
            angle,
            iterations,
        };
    }
}

// Example usage:
/*
import { ThreeJSLSystemExample } from './threejs-example.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const app = new ThreeJSLSystemExample(canvas, OrbitControls);

// Generate a tree
app.generateTree();

// Or generate a custom L-System
app.generateCustom(
    'F',                    // axiom
    'F -> F[+F]F[-F][F]',   // rules
    25,                     // angle
    4,                      // iterations
    {
        materialType: 'standard',
        branchColor: 0x654321,
        leafColor: 0x228B22
    }
);

// Export to OBJ
const objData = app.exportToOBJ();
if (objData) {
    // Save to file or display
    console.log(objData);
}
*/
