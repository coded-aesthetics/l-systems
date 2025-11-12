import { GeometryData } from "./Renderer.js";

interface BufferSet {
    vertexBuffer: WebGLBuffer;
    normalBuffer: WebGLBuffer;
    uvBuffer: WebGLBuffer;
    depthBuffer?: WebGLBuffer;
    heightBuffer?: WebGLBuffer;
    colorBuffer: WebGLBuffer;
    indexBuffer: WebGLBuffer;
}

export class BufferManager {
    private gl: WebGLRenderingContext;
    private branchBuffers!: BufferSet;
    private leafBuffers!: BufferSet;
    private supportsUint32Indices: boolean;

    private indexCount: number = 0;
    private leafIndexCount: number = 0;
    private usingUint32Indices: boolean = false;
    private usingUint32LeafIndices: boolean = false;

    constructor(gl: WebGLRenderingContext, supportsUint32Indices: boolean) {
        this.gl = gl;
        this.supportsUint32Indices = supportsUint32Indices;
        this.createBuffers();
    }

    private createBuffers(): void {
        this.branchBuffers = this.createBufferSet(true); // Branch buffers need depth/height
        this.leafBuffers = this.createBufferSet(false); // Leaf buffers don't need depth/height
    }

    private createBufferSet(includeBranchData: boolean): BufferSet {
        const gl = this.gl;

        const buffers: BufferSet = {
            vertexBuffer: this.createBuffer(),
            normalBuffer: this.createBuffer(),
            uvBuffer: this.createBuffer(),
            colorBuffer: this.createBuffer(),
            indexBuffer: this.createBuffer(),
        };

        if (includeBranchData) {
            buffers.depthBuffer = this.createBuffer();
            buffers.heightBuffer = this.createBuffer();
        }

        return buffers;
    }

    private createBuffer(): WebGLBuffer {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        if (!buffer) {
            throw new Error("Failed to create WebGL buffer");
        }
        return buffer;
    }

    public updateGeometry(geometry: GeometryData): void {
        this.updateBranchGeometry(geometry);
        this.updateLeafGeometry(geometry);

        // Check for WebGL errors
        const error = this.gl.getError();
        if (error !== this.gl.NO_ERROR) {
            console.error("WebGL error during geometry update:", error);
        }
    }

    private updateBranchGeometry(geometry: GeometryData): void {
        const gl = this.gl;
        const buffers = this.branchBuffers;

        // Update vertex data
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.vertices),
            gl.STATIC_DRAW,
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.normals),
            gl.STATIC_DRAW,
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uvBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.uvs),
            gl.STATIC_DRAW,
        );

        if (buffers.depthBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.depthBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(geometry.depths),
                gl.STATIC_DRAW,
            );
        }

        if (buffers.heightBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.heightBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(geometry.heights),
                gl.STATIC_DRAW,
            );
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.colors),
            gl.STATIC_DRAW,
        );

        // Update index data with appropriate type
        let maxIndex = 0;
        for (let i = 0; i < geometry.indices.length; i++) {
            if (geometry.indices[i] > maxIndex) {
                maxIndex = geometry.indices[i];
            }
        }
        this.usingUint32Indices =
            maxIndex > 65535 && this.supportsUint32Indices;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);

        if (this.usingUint32Indices) {
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint32Array(geometry.indices),
                gl.STATIC_DRAW,
            );
        } else {
            if (maxIndex > 65535) {
                console.warn(
                    `Index ${maxIndex} exceeds 16-bit limit, truncating to 16-bit indices`,
                );
            }
            const indices16 = new Uint16Array(
                geometry.indices.map((i) => Math.min(i, 65535)),
            );
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices16, gl.STATIC_DRAW);
        }

        this.indexCount = geometry.indices.length;
    }

    private updateLeafGeometry(geometry: GeometryData): void {
        const gl = this.gl;
        const buffers = this.leafBuffers;

        // Update leaf vertex data
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.leafVertices),
            gl.STATIC_DRAW,
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.leafNormals),
            gl.STATIC_DRAW,
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uvBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.leafUvs),
            gl.STATIC_DRAW,
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.leafColors),
            gl.STATIC_DRAW,
        );

        // Update leaf index data with appropriate type
        let maxLeafIndex = 0;
        for (let i = 0; i < geometry.leafIndices.length; i++) {
            if (geometry.leafIndices[i] > maxLeafIndex) {
                maxLeafIndex = geometry.leafIndices[i];
            }
        }
        this.usingUint32LeafIndices =
            maxLeafIndex > 65535 && this.supportsUint32Indices;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);

        if (this.usingUint32LeafIndices) {
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint32Array(geometry.leafIndices),
                gl.STATIC_DRAW,
            );
        } else {
            if (maxLeafIndex > 65535) {
                console.warn(
                    `Leaf index ${maxLeafIndex} exceeds 16-bit limit, truncating to 16-bit indices`,
                );
            }
            const leafIndices16 = new Uint16Array(
                geometry.leafIndices.map((i) => Math.min(i, 65535)),
            );
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                leafIndices16,
                gl.STATIC_DRAW,
            );
        }

        this.leafIndexCount = geometry.leafIndices.length;
    }

    public bindBranchBuffers(attributes: Record<string, number>): void {
        const gl = this.gl;
        const buffers = this.branchBuffers;

        this.bindAttribute(buffers.vertexBuffer, attributes.position, 3);
        this.bindAttribute(buffers.normalBuffer, attributes.normal, 3);
        this.bindAttribute(buffers.uvBuffer, attributes.uv, 2);

        if (buffers.depthBuffer && attributes.depth !== undefined) {
            this.bindAttribute(buffers.depthBuffer, attributes.depth, 1);
        }

        if (buffers.heightBuffer && attributes.height !== undefined) {
            this.bindAttribute(buffers.heightBuffer, attributes.height, 1);
        }

        if (attributes.color !== undefined && attributes.color !== -1) {
            this.bindAttribute(buffers.colorBuffer, attributes.color, 4);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
    }

    public bindLeafBuffers(attributes: Record<string, number>): void {
        const gl = this.gl;
        const buffers = this.leafBuffers;

        this.bindAttribute(buffers.vertexBuffer, attributes.position, 3);
        this.bindAttribute(buffers.normalBuffer, attributes.normal, 3);
        this.bindAttribute(buffers.uvBuffer, attributes.uv, 2);

        if (attributes.color !== undefined && attributes.color !== -1) {
            this.bindAttribute(buffers.colorBuffer, attributes.color, 4);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
    }

    private bindAttribute(
        buffer: WebGLBuffer,
        location: number,
        size: number,
    ): void {
        if (location === -1) return;

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    }

    public getIndexCount(): number {
        return this.indexCount;
    }

    public getLeafIndexCount(): number {
        return this.leafIndexCount;
    }

    public getIndexType(): number {
        return this.usingUint32Indices
            ? this.gl.UNSIGNED_INT
            : this.gl.UNSIGNED_SHORT;
    }

    public getLeafIndexType(): number {
        return this.usingUint32LeafIndices
            ? this.gl.UNSIGNED_INT
            : this.gl.UNSIGNED_SHORT;
    }

    public dispose(): void {
        const gl = this.gl;

        this.deleteBufferSet(this.branchBuffers);
        this.deleteBufferSet(this.leafBuffers);
    }

    private deleteBufferSet(buffers: BufferSet): void {
        const gl = this.gl;

        gl.deleteBuffer(buffers.vertexBuffer);
        gl.deleteBuffer(buffers.normalBuffer);
        gl.deleteBuffer(buffers.uvBuffer);
        gl.deleteBuffer(buffers.colorBuffer);
        gl.deleteBuffer(buffers.indexBuffer);

        if (buffers.depthBuffer) gl.deleteBuffer(buffers.depthBuffer);
        if (buffers.heightBuffer) gl.deleteBuffer(buffers.heightBuffer);
    }
}
