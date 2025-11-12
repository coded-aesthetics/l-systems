import { Mat4Utils, Mat3Utils } from "../utils/mathUtils.js";

export interface CameraState {
    zoom: number;
    rotationSpeed: number;
    manualRotationX: number;
    manualRotationY: number;
    panX: number;
    panY: number;
    autoRotation: number;
}

export class CameraController {
    private viewMatrix: Float32Array;
    private projectionMatrix: Float32Array;
    private modelViewMatrix: Float32Array = new Float32Array(16);
    private normalMatrix: Float32Array = new Float32Array(9);

    // Camera state
    private zoom: number = 15.0;
    private rotationSpeed: number = 0.5;
    private manualRotationX: number = 0;
    private manualRotationY: number = 0;
    private panX: number = 0;
    private panY: number = -6;
    private rotation: number = 0;

    // Animation timing
    private lastTime: number = 0;

    constructor(viewMatrix: Float32Array, projectionMatrix: Float32Array) {
        this.viewMatrix = viewMatrix;
        this.projectionMatrix = projectionMatrix;
        this.initializeMatrices();
    }

    private initializeMatrices(): void {
        // Initialize identity matrices
        Mat4Utils.setIdentity(this.viewMatrix);
        Mat4Utils.setIdentity(this.projectionMatrix);
        Mat4Utils.setIdentity(this.modelViewMatrix);
        Mat3Utils.setIdentity(this.normalMatrix);
    }

    public updateCamera(currentTime: number = performance.now()): void {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Update auto rotation
        this.rotation += this.rotationSpeed * deltaTime * 0.001;

        // Reset view matrix to identity
        Mat4Utils.setIdentity(this.viewMatrix);

        // Apply camera transformations
        Mat4Utils.translate(this.viewMatrix, this.viewMatrix, [
            this.panX,
            this.panY,
            -this.zoom,
        ]);
        Mat4Utils.rotateX(
            this.viewMatrix,
            this.viewMatrix,
            this.manualRotationX,
        );
        Mat4Utils.rotateY(
            this.viewMatrix,
            this.viewMatrix,
            this.manualRotationY,
        );
        Mat4Utils.rotateY(this.viewMatrix, this.viewMatrix, this.rotation);

        // Copy view matrix to model-view matrix
        Mat4Utils.copy(this.modelViewMatrix, this.viewMatrix);

        // Extract normal matrix from model-view matrix
        Mat3Utils.normalFromMat4(this.normalMatrix, this.modelViewMatrix);
    }

    public updateProjection(
        aspect: number,
        fov: number = 45,
        near: number = 0.1,
        far: number = 100,
    ): void {
        Mat4Utils.perspective(
            this.projectionMatrix,
            (fov * Math.PI) / 180,
            aspect,
            near,
            far,
        );
    }

    public setZoom(zoom: number): void {
        this.zoom = Math.max(0.1, Math.min(50.0, zoom));
    }

    public getZoom(): number {
        return this.zoom;
    }

    public setRotationSpeed(speed: number): void {
        this.rotationSpeed = speed;
    }

    public getRotationSpeed(): number {
        return this.rotationSpeed;
    }

    public setPan(x: number, y: number): void {
        this.panX = Math.max(-10, Math.min(10, x));
        this.panY = Math.max(-10, Math.min(10, y));
    }

    public addPan(deltaX: number, deltaY: number): void {
        this.setPan(this.panX + deltaX, this.panY + deltaY);
    }

    public setManualRotation(x: number, y: number): void {
        this.manualRotationX = x;
        this.manualRotationY = y;
    }

    public addManualRotation(deltaX: number, deltaY: number): void {
        this.manualRotationX += deltaX;
        this.manualRotationY += deltaY;

        // Clamp X rotation to prevent flipping
        this.manualRotationX = Math.max(
            -Math.PI / 2,
            Math.min(Math.PI / 2, this.manualRotationX),
        );
    }

    public resetCamera(): void {
        this.zoom = 15.0;
        this.rotationSpeed = 0.5;
        this.manualRotationX = 0;
        this.manualRotationY = 0;
        this.panX = 0;
        this.panY = -4;
        this.rotation = 0;
    }

    public getCameraState(): CameraState {
        return {
            zoom: this.zoom,
            rotationSpeed: this.rotationSpeed,
            manualRotationX: this.manualRotationX,
            manualRotationY: this.manualRotationY,
            panX: this.panX,
            panY: this.panY,
            autoRotation: this.rotation,
        };
    }

    public setCameraState(state: CameraState): void {
        this.zoom = state.zoom;
        this.rotationSpeed = state.rotationSpeed;
        this.manualRotationX = state.manualRotationX;
        this.manualRotationY = state.manualRotationY;
        this.panX = state.panX;
        this.panY = state.panY;
        this.rotation = state.autoRotation;
    }

    public getModelViewMatrix(): Float32Array {
        return this.modelViewMatrix;
    }

    public getProjectionMatrix(): Float32Array {
        return this.projectionMatrix;
    }

    public getNormalMatrix(): Float32Array {
        return this.normalMatrix;
    }
}
