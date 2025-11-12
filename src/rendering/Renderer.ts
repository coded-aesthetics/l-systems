import { Mat4Utils } from "../utils/mathUtils.js";
import { WebGLContext } from "./WebGLContext.js";
import { ShaderManager } from "./ShaderManager.js";
import { BufferManager } from "./BufferManager.js";
import { RenderPipeline } from "./RenderPipeline.js";
import { CameraController, CameraState } from "../controls/CameraController.js";
import { InputHandler } from "../controls/InputHandler.js";
import { AnimationLoop } from "../controls/AnimationLoop.js";

export interface RendererOptions {
    canvas: HTMLCanvasElement;
    segments?: number;
    colorMode?: number;
}

export interface GeometryData {
    vertices: number[];
    normals: number[];
    uvs: number[];
    depths: number[];
    heights: number[];
    indices: number[];
    colors: number[];
    leafVertices: number[];
    leafNormals: number[];
    leafUvs: number[];
    leafIndices: number[];
    leafColors: number[];
}

export class Renderer {
    private webglContext: WebGLContext;
    private shaderManager: ShaderManager;
    private bufferManager: BufferManager;
    private renderPipeline: RenderPipeline;
    private cameraController: CameraController;
    private inputHandler: InputHandler;
    private animationLoop: AnimationLoop;

    // Matrix storage for camera controller
    private viewMatrix: Float32Array = new Float32Array(16);
    private projectionMatrix: Float32Array = new Float32Array(16);

    constructor(options: RendererOptions) {
        // Initialize WebGL context
        this.webglContext = new WebGLContext(options.canvas);
        const gl = this.webglContext.getContext();

        // Initialize camera controller with matrix storage
        this.cameraController = new CameraController(
            this.viewMatrix,
            this.projectionMatrix,
        );

        // Set up initial projection matrix
        this.resize();

        // Initialize rendering components
        this.shaderManager = new ShaderManager(gl);
        this.bufferManager = new BufferManager(
            gl,
            this.webglContext.supportsUint32(),
        );
        this.renderPipeline = new RenderPipeline(
            gl,
            this.shaderManager,
            this.bufferManager,
            this.cameraController,
        );

        // Set initial color mode
        if (options.colorMode !== undefined) {
            this.renderPipeline.setColorMode(options.colorMode);
        }

        // Initialize input handling
        this.inputHandler = new InputHandler(
            options.canvas,
            this.cameraController,
        );

        // Initialize animation loop
        this.animationLoop = new AnimationLoop((time: number) => {
            this.renderPipeline.render(time);
        });

        // Set up resize handling
        this.setupResizeHandler();
    }

    private setupResizeHandler(): void {
        const resizeObserver = new ResizeObserver(() => {
            this.resize();
        });

        resizeObserver.observe(this.webglContext.getCanvas());

        // Store reference for cleanup (attached to the context)
        (this.webglContext as any)._resizeObserver = resizeObserver;
    }

    private resize(): void {
        this.webglContext.resize();

        const canvas = this.webglContext.getCanvas();
        const aspect = canvas.width / canvas.height;
        this.cameraController.updateProjection(aspect);
    }

    public updateGeometry(geometry: GeometryData): void {
        this.bufferManager.updateGeometry(geometry);
    }

    public setColorMode(mode: number): void {
        this.renderPipeline.setColorMode(mode);
        // Force a re-render to apply the new color mode
        requestAnimationFrame(() => this.render());
    }

    public getColorMode(): number {
        return this.renderPipeline.getColorMode();
    }

    public setLeafColor(color: [number, number, number]): void {
        this.renderPipeline.setLeafColor(color);
    }

    public getLeafColor(): [number, number, number] {
        return this.renderPipeline.getLeafColor();
    }

    public setZoom(zoom: number): void {
        this.cameraController.setZoom(zoom);
    }

    public getZoom(): number {
        return this.cameraController.getZoom();
    }

    public setRotationSpeed(speed: number): void {
        this.cameraController.setRotationSpeed(speed);
    }

    public getRotationSpeed(): number {
        return this.cameraController.getRotationSpeed();
    }

    public resetCamera(): void {
        this.cameraController.resetCamera();
    }

    public getCameraState(): CameraState {
        return this.cameraController.getCameraState();
    }

    public setCameraState(state: CameraState): void {
        this.cameraController.setCameraState(state);
    }

    public render(time: number = 0): void {
        this.renderPipeline.render(time);
    }

    public startAnimation(): void {
        this.animationLoop.start();
    }

    public stopAnimation(): void {
        this.animationLoop.stop();
    }

    public isAnimating(): boolean {
        return this.animationLoop.isActive();
    }

    public dispose(): void {
        // Stop animation first
        this.animationLoop.dispose();

        // Dispose of input handling
        this.inputHandler.dispose();

        // Dispose of rendering components
        this.renderPipeline.dispose();
        this.bufferManager.dispose();
        this.shaderManager.dispose();

        // Clean up resize observer
        const resizeObserver = (this.webglContext as any)._resizeObserver;
        if (resizeObserver) {
            resizeObserver.disconnect();
            delete (this.webglContext as any)._resizeObserver;
        }

        // Dispose of WebGL context
        this.webglContext.dispose();
    }

    // Legacy compatibility methods (if needed by existing code)
    public getCanvas(): HTMLCanvasElement {
        return this.webglContext.getCanvas();
    }

    public getWebGLContext(): WebGLRenderingContext {
        return this.webglContext.getContext();
    }
}
