import { BRANCH_VERTEX_SHADER, BRANCH_FRAGMENT_SHADER, BRANCH_UNIFORMS, BRANCH_ATTRIBUTES } from './shaders/BranchShader.js';
import { LEAF_VERTEX_SHADER, LEAF_FRAGMENT_SHADER, LEAF_UNIFORMS, LEAF_ATTRIBUTES } from './shaders/LeafShader.js';

export interface ShaderProgram {
    program: WebGLProgram;
    uniforms: Record<string, WebGLUniformLocation>;
    attributes: Record<string, number>;
}

export class ShaderManager {
    private gl: WebGLRenderingContext;
    private branchProgram!: ShaderProgram;
    private leafProgram!: ShaderProgram;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.initializeShaders();
    }

    private initializeShaders(): void {
        this.branchProgram = this.createShaderProgram(
            BRANCH_VERTEX_SHADER,
            BRANCH_FRAGMENT_SHADER,
            BRANCH_UNIFORMS,
            BRANCH_ATTRIBUTES
        );

        this.leafProgram = this.createShaderProgram(
            LEAF_VERTEX_SHADER,
            LEAF_FRAGMENT_SHADER,
            LEAF_UNIFORMS,
            LEAF_ATTRIBUTES
        );
    }

    private createShaderProgram(
        vertexSource: string,
        fragmentSource: string,
        uniformNames: string[],
        attributeNames: string[]
    ): ShaderProgram {
        const program = this.createProgram(vertexSource, fragmentSource);
        const uniforms = this.getUniformLocations(program, uniformNames);
        const attributes = this.getAttributeLocations(program, attributeNames);

        return { program, uniforms, attributes };
    }

    public createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
        const gl = this.gl;

        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);

        const program = gl.createProgram();
        if (!program) {
            throw new Error("Failed to create program");
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error("Failed to link program: " + info);
        }

        // Clean up shaders after linking
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    }

    public getUniformLocations(program: WebGLProgram, uniforms: string[]): Record<string, WebGLUniformLocation> {
        const gl = this.gl;
        const locations: Record<string, WebGLUniformLocation> = {};

        for (const uniform of uniforms) {
            const location = gl.getUniformLocation(program, uniform);
            if (location === null) {
                console.warn(`Uniform ${uniform} not found in shader program`);
                continue;
            }
            locations[uniform.replace('u_', '')] = location;
        }

        return locations;
    }

    public getAttributeLocations(program: WebGLProgram, attributes: string[]): Record<string, number> {
        const gl = this.gl;
        const locations: Record<string, number> = {};

        for (const attribute of attributes) {
            const location = gl.getAttribLocation(program, attribute);
            if (location === -1) {
                console.warn(`Attribute ${attribute} not found in shader program`);
                continue;
            }
            locations[attribute.replace('a_', '')] = location;
        }

        return locations;
    }

    private createShader(type: number, source: string): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(type);
        if (!shader) {
            throw new Error("Failed to create shader");
        }

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error("Failed to compile shader: " + info);
        }

        return shader;
    }

    public getBranchProgram(): ShaderProgram {
        return this.branchProgram;
    }

    public getLeafProgram(): ShaderProgram {
        return this.leafProgram;
    }

    public useProgram(program: WebGLProgram): void {
        this.gl.useProgram(program);
    }

    public dispose(): void {
        const gl = this.gl;

        if (this.branchProgram) {
            gl.deleteProgram(this.branchProgram.program);
        }

        if (this.leafProgram) {
            gl.deleteProgram(this.leafProgram.program);
        }
    }
}
