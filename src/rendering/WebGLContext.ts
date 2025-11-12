export class WebGLContext {
    private gl: WebGLRenderingContext;
    private canvas: HTMLCanvasElement;
    private supportsUint32Indices: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        const gl = canvas.getContext("webgl");
        if (!gl) {
            throw new Error("WebGL not supported");
        }

        this.gl = gl;
        this.initializeWebGL();
        this.setupResizeObserver();
    }

    private initializeWebGL(): void {
        const gl = this.gl;

        // Check for 32-bit index support
        const ext = gl.getExtension("OES_element_index_uint");
        this.supportsUint32Indices = ext !== null;

        if (this.supportsUint32Indices) {
            console.log("32-bit indices supported - can handle large geometries");
        } else {
            console.warn("32-bit indices not supported - limited to 65,536 vertices");
        }

        // Set up WebGL state
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Check for WebGL errors
        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
            console.error("WebGL error during initialization:", error);
        }
    }

    private setupResizeObserver(): void {
        window.addEventListener("resize", () => this.resize());
    }

    public getContext(): WebGLRenderingContext {
        return this.gl;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    public supportsUint32(): boolean {
        return this.supportsUint32Indices;
    }

    public resize(): void {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, displayWidth, displayHeight);
        }
    }

    public dispose(): void {
        window.removeEventListener("resize", () => this.resize());

        // Note: WebGL context cleanup is handled by the browser
        // when the canvas is removed from the DOM
    }
}
