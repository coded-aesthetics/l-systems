export interface RendererOptions {
    canvas: HTMLCanvasElement;
    segments?: number;
    colorMode?: number;
}

export class Renderer {
    private gl: WebGLRenderingContext;
    private canvas: HTMLCanvasElement;
    private program!: WebGLProgram;
    private vertexBuffer!: WebGLBuffer;
    private normalBuffer!: WebGLBuffer;
    private uvBuffer!: WebGLBuffer;
    private depthBuffer!: WebGLBuffer;
    private heightBuffer!: WebGLBuffer;
    private indexBuffer!: WebGLBuffer;

    // Uniform locations
    private uniforms: { [key: string]: WebGLUniformLocation } = {};

    // Attribute locations
    private attributes: { [key: string]: number } = {};

    // Camera properties
    private viewMatrix: Float32Array = new Float32Array(16);
    private projectionMatrix: Float32Array = new Float32Array(16);
    private modelViewMatrix: Float32Array = new Float32Array(16);
    private normalMatrix: Float32Array = new Float32Array(9);

    // Render state
    private indexCount: number = 0;
    private colorMode: number = 0;
    private zoom: number = 5.0;
    private rotation: number = 0;
    private rotationSpeed: number = 0.5;

    // Animation
    private lastTime: number = 0;
    private animationId: number | null = null;

    // Mouse controls
    private isDragging: boolean = false;
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;
    private manualRotationX: number = 0;
    private manualRotationY: number = 0;
    private panX: number = 0;
    private panY: number = 0;

    constructor(options: RendererOptions) {
        this.canvas = options.canvas;
        const gl = this.canvas.getContext("webgl");

        if (!gl) {
            throw new Error("WebGL not supported");
        }

        this.gl = gl;
        this.colorMode = options.colorMode || 0;

        this.initWebGL();
        this.setupBuffers();
        this.initializeMatrices();
        this.resize();

        // Setup resize observer
        window.addEventListener("resize", () => this.resize());

        // Setup mouse wheel zoom
        this.setupMouseControls();
    }

    private setupMouseControls(): void {
        // Add mouse wheel zoom
        this.canvas.addEventListener("wheel", (event: WheelEvent) => {
            event.preventDefault();

            // Zoom in/out based on wheel direction
            const zoomSpeed = 0.1;
            const delta = event.deltaY > 0 ? 1 : -1;

            this.zoom += delta * zoomSpeed;
            this.zoom = Math.max(1.0, Math.min(30.0, this.zoom));

            // Update the zoom slider in the UI if it exists
            const zoomSlider = document.getElementById(
                "zoom",
            ) as HTMLInputElement;
            if (zoomSlider) {
                zoomSlider.value = this.zoom.toString();
                // Update the display value
                const zoomDisplay = document.getElementById(
                    "zoom-value",
                ) as HTMLElement;
                if (zoomDisplay) {
                    zoomDisplay.textContent = this.zoom.toFixed(1);
                }
            }
        });

        // Add mouse drag controls for rotation
        let isDragging = false;
        let lastX = 0;
        let lastY = 0;

        this.canvas.addEventListener("mousedown", (event: MouseEvent) => {
            if (event.button === 0) {
                // Left mouse button
                isDragging = true;
                lastX = event.clientX;
                lastY = event.clientY;
                if (event.altKey) {
                    this.canvas.style.cursor = "move";
                } else {
                    this.canvas.style.cursor = "grabbing";
                }
                event.preventDefault();
            }
        });

        this.canvas.addEventListener("mousemove", (event: MouseEvent) => {
            if (isDragging) {
                const deltaX = event.clientX - lastX;
                const deltaY = event.clientY - lastY;

                if (event.altKey) {
                    // Pan mode when Alt is held
                    const panSensitivity = 0.005;
                    this.panX += deltaX * panSensitivity * this.zoom * 0.2;
                    this.panY -= deltaY * panSensitivity * this.zoom * 0.2;
                    this.canvas.style.cursor = "move";
                } else {
                    // Rotate based on mouse movement
                    const sensitivity = 0.01;
                    this.manualRotationY += deltaX * sensitivity;
                    this.manualRotationX += deltaY * sensitivity;

                    // Clamp vertical rotation to prevent flipping
                    this.manualRotationX = Math.max(
                        -Math.PI / 2 + 0.1,
                        Math.min(Math.PI / 2 - 0.1, this.manualRotationX),
                    );
                    this.canvas.style.cursor = "grabbing";
                }

                lastX = event.clientX;
                lastY = event.clientY;
            } else {
                // Update cursor based on Alt key state when not dragging
                if (event.altKey) {
                    this.canvas.style.cursor = "move";
                } else {
                    this.canvas.style.cursor = "grab";
                }
            }
        });

        this.canvas.addEventListener("mouseup", (event: MouseEvent) => {
            isDragging = false;
            if (event.altKey) {
                this.canvas.style.cursor = "move";
            } else {
                this.canvas.style.cursor = "grab";
            }
        });

        this.canvas.addEventListener("mouseleave", () => {
            isDragging = false;
            this.canvas.style.cursor = "grab";
        });

        // Handle Alt key state changes
        document.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.altKey && !isDragging) {
                this.canvas.style.cursor = "move";
            }
        });

        document.addEventListener("keyup", (event: KeyboardEvent) => {
            if (!event.altKey && !isDragging) {
                this.canvas.style.cursor = "grab";
            }
        });

        // Set initial cursor
        this.canvas.style.cursor = "grab";
    }

    private initializeMatrices(): void {
        // Initialize matrices to identity
        this.mat4Identity(this.viewMatrix);
        this.mat4Identity(this.projectionMatrix);
        this.mat4Identity(this.modelViewMatrix);
        this.mat3Identity(this.normalMatrix);
    }

    // Matrix utility functions
    private mat4Identity(out: Float32Array): void {
        out.fill(0);
        out[0] = out[5] = out[10] = out[15] = 1;
    }

    private mat3Identity(out: Float32Array): void {
        out.fill(0);
        out[0] = out[4] = out[8] = 1;
    }

    private mat4Translate(
        out: Float32Array,
        a: Float32Array,
        v: [number, number, number],
    ): void {
        const x = v[0],
            y = v[1],
            z = v[2];

        if (a === out) {
            out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
            out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
            out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
            out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        } else {
            for (let i = 0; i < 12; i++) out[i] = a[i];
            out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
            out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
            out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
            out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        }
    }

    private mat4RotateX(out: Float32Array, a: Float32Array, rad: number): void {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a10 = a[4],
            a11 = a[5],
            a12 = a[6],
            a13 = a[7];
        const a20 = a[8],
            a21 = a[9],
            a22 = a[10],
            a23 = a[11];

        if (a !== out) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
        }

        out[4] = a10 * c + a20 * s;
        out[5] = a11 * c + a21 * s;
        out[6] = a12 * c + a22 * s;
        out[7] = a13 * c + a23 * s;
        out[8] = a20 * c - a10 * s;
        out[9] = a21 * c - a11 * s;
        out[10] = a22 * c - a12 * s;
        out[11] = a23 * c - a13 * s;
    }

    private mat4RotateY(out: Float32Array, a: Float32Array, rad: number): void {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a00 = a[0],
            a01 = a[1],
            a02 = a[2],
            a03 = a[3];
        const a20 = a[8],
            a21 = a[9],
            a22 = a[10],
            a23 = a[11];

        if (a !== out) {
            out[4] = a[4];
            out[5] = a[5];
            out[6] = a[6];
            out[7] = a[7];
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
        }

        out[0] = a00 * c - a20 * s;
        out[1] = a01 * c - a21 * s;
        out[2] = a02 * c - a22 * s;
        out[3] = a03 * c - a23 * s;
        out[8] = a00 * s + a20 * c;
        out[9] = a01 * s + a21 * c;
        out[10] = a02 * s + a22 * c;
        out[11] = a03 * s + a23 * c;
    }

    private mat4Multiply(
        out: Float32Array,
        a: Float32Array,
        b: Float32Array,
    ): void {
        const a00 = a[0],
            a01 = a[1],
            a02 = a[2],
            a03 = a[3];
        const a10 = a[4],
            a11 = a[5],
            a12 = a[6],
            a13 = a[7];
        const a20 = a[8],
            a21 = a[9],
            a22 = a[10],
            a23 = a[11];
        const a30 = a[12],
            a31 = a[13],
            a32 = a[14],
            a33 = a[15];

        let b0 = b[0],
            b1 = b[1],
            b2 = b[2],
            b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[4];
        b1 = b[5];
        b2 = b[6];
        b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[8];
        b1 = b[9];
        b2 = b[10];
        b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[12];
        b1 = b[13];
        b2 = b[14];
        b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    }

    private mat4Perspective(
        out: Float32Array,
        fovy: number,
        aspect: number,
        near: number,
        far: number,
    ): void {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);

        out.fill(0);
        out[0] = f / aspect;
        out[5] = f;
        out[10] = (far + near) * nf;
        out[11] = -1;
        out[14] = 2 * far * near * nf;
    }

    private mat3NormalFromMat4(out: Float32Array, a: Float32Array): void {
        const a00 = a[0],
            a01 = a[1],
            a02 = a[2];
        const a10 = a[4],
            a11 = a[5],
            a12 = a[6];
        const a20 = a[8],
            a21 = a[9],
            a22 = a[10];

        const b01 = a22 * a11 - a12 * a21;
        const b11 = -a22 * a10 + a12 * a20;
        const b21 = a21 * a10 - a11 * a20;

        let det = a00 * b01 + a01 * b11 + a02 * b21;

        if (!det) {
            this.mat3Identity(out);
            return;
        }
        det = 1.0 / det;

        out[0] = b01 * det;
        out[1] = (-a22 * a01 + a02 * a21) * det;
        out[2] = (a12 * a01 - a02 * a11) * det;
        out[3] = b11 * det;
        out[4] = (a22 * a00 - a02 * a20) * det;
        out[5] = (-a12 * a00 + a02 * a10) * det;
        out[6] = b21 * det;
        out[7] = (-a21 * a00 + a01 * a20) * det;
        out[8] = (a11 * a00 - a01 * a10) * det;
    }

    private initWebGL(): void {
        const gl = this.gl;

        // Enable depth testing and backface culling
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        // Create shader program
        this.program = this.createProgram();
        gl.useProgram(this.program);

        // Get attribute locations
        this.attributes = {
            position: gl.getAttribLocation(this.program, "a_position"),
            normal: gl.getAttribLocation(this.program, "a_normal"),
            uv: gl.getAttribLocation(this.program, "a_uv"),
            depth: gl.getAttribLocation(this.program, "a_depth"),
            height: gl.getAttribLocation(this.program, "a_height"),
        };

        // Get uniform locations
        this.uniforms = {
            modelViewMatrix: gl.getUniformLocation(
                this.program,
                "u_modelViewMatrix",
            )!,
            projectionMatrix: gl.getUniformLocation(
                this.program,
                "u_projectionMatrix",
            )!,
            normalMatrix: gl.getUniformLocation(
                this.program,
                "u_normalMatrix",
            )!,
            time: gl.getUniformLocation(this.program, "u_time")!,
            colorMode: gl.getUniformLocation(this.program, "u_colorMode")!,
            lightDirection: gl.getUniformLocation(
                this.program,
                "u_lightDirection",
            )!,
        };

        // Enable attributes
        Object.values(this.attributes).forEach((attr) => {
            if (attr >= 0) gl.enableVertexAttribArray(attr);
        });
    }

    private createProgram(): WebGLProgram {
        const gl = this.gl;

        const vertexShaderSource = `
            precision mediump float;

            attribute vec3 a_position;
            attribute vec3 a_normal;
            attribute vec2 a_uv;
            attribute float a_depth;
            attribute float a_height;

            uniform mat4 u_modelViewMatrix;
            uniform mat4 u_projectionMatrix;
            uniform mat3 u_normalMatrix;
            uniform float u_time;

            varying vec3 v_position;
            varying vec3 v_normal;
            varying vec2 v_uv;
            varying float v_depth;
            varying float v_height;
            varying vec3 v_worldPosition;

            void main() {
                // Apply gentle wind animation
                vec3 position = a_position;
                float windStrength = 0.1;
                float windSpeed = u_time * 2.0;

                // Wind affects higher parts more
                float heightFactor = a_height * 0.5 + 0.5;
                position.x += sin(windSpeed + a_position.y * 0.5) * windStrength * heightFactor;
                position.z += cos(windSpeed * 0.8 + a_position.y * 0.3) * windStrength * heightFactor * 0.5;

                vec4 worldPosition = u_modelViewMatrix * vec4(position, 1.0);
                v_worldPosition = worldPosition.xyz;
                v_position = position;
                v_normal = normalize(u_normalMatrix * a_normal);
                v_uv = a_uv;
                v_depth = a_depth;
                v_height = a_height;

                gl_Position = u_projectionMatrix * worldPosition;
            }
        `;

        const fragmentShaderSource = `
            precision mediump float;

            varying vec3 v_position;
            varying vec3 v_normal;
            varying vec2 v_uv;
            varying float v_depth;
            varying float v_height;
            varying vec3 v_worldPosition;

            uniform float u_time;
            uniform int u_colorMode;
            uniform vec3 u_lightDirection;

            // Color palettes for different modes
            vec3 getHeightGradientColor(float height) {
                // Brown to green gradient based on height
                vec3 brownColor = vec3(0.4, 0.2, 0.1);
                vec3 darkGreenColor = vec3(0.1, 0.3, 0.1);
                vec3 lightGreenColor = vec3(0.3, 0.7, 0.2);

                float normalizedHeight = (height + 1.0) * 0.5; // Convert from [-1,1] to [0,1]

                if (normalizedHeight < 0.3) {
                    return mix(brownColor, darkGreenColor, normalizedHeight / 0.3);
                } else {
                    return mix(darkGreenColor, lightGreenColor, (normalizedHeight - 0.3) / 0.7);
                }
            }

            vec3 getDepthColor(float depth) {
                // Color based on branch generation depth
                vec3 trunkColor = vec3(0.3, 0.15, 0.05);
                vec3 branchColor = vec3(0.2, 0.4, 0.1);
                vec3 leafColor = vec3(0.4, 0.8, 0.2);

                float normalizedDepth = clamp(depth / 8.0, 0.0, 1.0);

                if (normalizedDepth < 0.5) {
                    return mix(trunkColor, branchColor, normalizedDepth * 2.0);
                } else {
                    return mix(branchColor, leafColor, (normalizedDepth - 0.5) * 2.0);
                }
            }

            vec3 getUniformColor() {
                return vec3(0.2, 0.6, 0.15);
            }

            vec3 getAutumnColor(float height, float depth) {
                vec3 brownTrunk = vec3(0.4, 0.2, 0.1);
                vec3 orangeLeaf = vec3(0.8, 0.4, 0.1);
                vec3 redLeaf = vec3(0.7, 0.2, 0.1);
                vec3 yellowLeaf = vec3(0.9, 0.7, 0.2);

                float normalizedHeight = (height + 1.0) * 0.5;
                float normalizedDepth = clamp(depth / 8.0, 0.0, 1.0);

                if (normalizedDepth < 0.3) {
                    return brownTrunk;
                } else {
                    // Mix autumn colors based on position
                    float colorMix = sin(v_position.x * 10.0 + v_position.z * 8.0 + u_time * 0.5) * 0.5 + 0.5;
                    vec3 baseAutumn = mix(orangeLeaf, redLeaf, colorMix);
                    return mix(baseAutumn, yellowLeaf, normalizedHeight * 0.3);
                }
            }

            void main() {
                vec3 baseColor;

                // Select color based on mode
                if (u_colorMode == 0) {
                    baseColor = getHeightGradientColor(v_height);
                } else if (u_colorMode == 1) {
                    baseColor = getDepthColor(v_depth);
                } else if (u_colorMode == 2) {
                    baseColor = getUniformColor();
                } else {
                    baseColor = getAutumnColor(v_height, v_depth);
                }

                // Simple lighting calculation
                vec3 normal = normalize(v_normal);
                vec3 lightDir = normalize(u_lightDirection);
                float lightIntensity = max(dot(normal, lightDir), 0.2); // Ambient minimum

                // Add some rim lighting for depth
                vec3 viewDir = normalize(-v_worldPosition);
                float rimLight = 1.0 - max(dot(normal, viewDir), 0.0);
                rimLight = pow(rimLight, 3.0) * 0.3;

                // Combine lighting
                vec3 finalColor = baseColor * lightIntensity + baseColor * rimLight;

                // Add subtle color variation
                float noise = sin(v_position.x * 20.0 + v_position.y * 15.0 + v_position.z * 18.0) * 0.05 + 1.0;
                finalColor *= noise;

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        const vertexShader = this.createShader(
            gl.VERTEX_SHADER,
            vertexShaderSource,
        );
        const fragmentShader = this.createShader(
            gl.FRAGMENT_SHADER,
            fragmentShaderSource,
        );

        const program = gl.createProgram();
        if (!program) throw new Error("Failed to create program");

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error("Failed to link program: " + info);
        }

        return program;
    }

    private createShader(type: number, source: string): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(type);
        if (!shader) throw new Error("Failed to create shader");

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error("Failed to compile shader: " + info);
        }

        return shader;
    }

    private setupBuffers(): void {
        const gl = this.gl;

        this.vertexBuffer = gl.createBuffer()!;
        this.normalBuffer = gl.createBuffer()!;
        this.uvBuffer = gl.createBuffer()!;
        this.depthBuffer = gl.createBuffer()!;
        this.heightBuffer = gl.createBuffer()!;
        this.indexBuffer = gl.createBuffer()!;
    }

    public updateGeometry(geometry: {
        vertices: number[];
        normals: number[];
        uvs: number[];
        depths: number[];
        heights: number[];
        indices: number[];
    }): void {
        const gl = this.gl;

        // Update vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.vertices),
            gl.STATIC_DRAW,
        );
        gl.vertexAttribPointer(
            this.attributes.position,
            3,
            gl.FLOAT,
            false,
            0,
            0,
        );

        // Update normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.normals),
            gl.STATIC_DRAW,
        );
        gl.vertexAttribPointer(
            this.attributes.normal,
            3,
            gl.FLOAT,
            false,
            0,
            0,
        );

        // Update UVs
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.uvs),
            gl.STATIC_DRAW,
        );
        gl.vertexAttribPointer(this.attributes.uv, 2, gl.FLOAT, false, 0, 0);

        // Update depths
        gl.bindBuffer(gl.ARRAY_BUFFER, this.depthBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.depths),
            gl.STATIC_DRAW,
        );
        gl.vertexAttribPointer(this.attributes.depth, 1, gl.FLOAT, false, 0, 0);

        // Update heights
        gl.bindBuffer(gl.ARRAY_BUFFER, this.heightBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.heights),
            gl.STATIC_DRAW,
        );
        gl.vertexAttribPointer(
            this.attributes.height,
            1,
            gl.FLOAT,
            false,
            0,
            0,
        );

        // Update indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(geometry.indices),
            gl.STATIC_DRAW,
        );

        this.indexCount = geometry.indices.length;
    }

    public setColorMode(mode: number): void {
        this.colorMode = mode;
    }

    public setZoom(zoom: number): void {
        this.zoom = zoom;
    }

    public setRotationSpeed(speed: number): void {
        this.rotationSpeed = speed;
    }

    public resetCamera(): void {
        this.rotation = 0;
        this.zoom = 5.0;
        this.manualRotationX = 0;
        this.manualRotationY = 0;
        this.panX = 0;
        this.panY = 0;
    }

    private updateCamera(): void {
        // Update rotation for auto-rotation
        this.rotation += this.rotationSpeed * 0.01;

        // Setup view matrix (camera)
        this.mat4Identity(this.viewMatrix);
        this.mat4Translate(this.viewMatrix, this.viewMatrix, [
            this.panX,
            this.panY,
            -this.zoom,
        ]);

        // Apply manual rotation from mouse drag
        this.mat4RotateX(
            this.viewMatrix,
            this.viewMatrix,
            this.manualRotationX - 0.3,
        );
        this.mat4RotateY(
            this.viewMatrix,
            this.viewMatrix,
            this.manualRotationY + this.rotation,
        );

        // Setup model-view matrix
        this.mat4Identity(this.modelViewMatrix);
        this.mat4Multiply(
            this.modelViewMatrix,
            this.viewMatrix,
            this.modelViewMatrix,
        );

        // Setup normal matrix
        this.mat3NormalFromMat4(this.normalMatrix, this.modelViewMatrix);
    }

    private resize(): void {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (
            this.canvas.width !== displayWidth ||
            this.canvas.height !== displayHeight
        ) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;

            this.gl.viewport(0, 0, displayWidth, displayHeight);

            // Update projection matrix
            const aspect = displayWidth / displayHeight;
            this.mat4Perspective(
                this.projectionMatrix,
                Math.PI / 4,
                aspect,
                0.1,
                100.0,
            );
        }
    }

    public render(time: number): void {
        const gl = this.gl;

        this.resize();
        this.updateCamera();

        // Clear
        gl.clearColor(0.05, 0.05, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (this.indexCount === 0) return;

        // Use program
        gl.useProgram(this.program);

        // Set uniforms
        gl.uniformMatrix4fv(
            this.uniforms.modelViewMatrix,
            false,
            this.modelViewMatrix,
        );
        gl.uniformMatrix4fv(
            this.uniforms.projectionMatrix,
            false,
            this.projectionMatrix,
        );
        gl.uniformMatrix3fv(
            this.uniforms.normalMatrix,
            false,
            this.normalMatrix,
        );
        gl.uniform1f(this.uniforms.time, time * 0.001);
        gl.uniform1i(this.uniforms.colorMode, this.colorMode);
        gl.uniform3fv(this.uniforms.lightDirection, [0.5, 1.0, 0.3]);

        // Bind buffers and draw
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(
            this.attributes.position,
            3,
            gl.FLOAT,
            false,
            0,
            0,
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(
            this.attributes.normal,
            3,
            gl.FLOAT,
            false,
            0,
            0,
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(this.attributes.uv, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.depthBuffer);
        gl.vertexAttribPointer(this.attributes.depth, 1, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.heightBuffer);
        gl.vertexAttribPointer(
            this.attributes.height,
            1,
            gl.FLOAT,
            false,
            0,
            0,
        );

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }

    public startAnimation(): void {
        if (this.animationId !== null) return;

        const animate = (time: number) => {
            this.render(time);
            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
    }

    public stopAnimation(): void {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    public dispose(): void {
        this.stopAnimation();

        const gl = this.gl;

        // Delete buffers
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.normalBuffer);
        gl.deleteBuffer(this.uvBuffer);
        gl.deleteBuffer(this.depthBuffer);
        gl.deleteBuffer(this.heightBuffer);
        gl.deleteBuffer(this.indexBuffer);

        // Delete program
        gl.deleteProgram(this.program);
    }
}
