import { ShaderManager, ShaderProgram } from './ShaderManager.js';
import { BufferManager } from './BufferManager.js';
import { CameraController } from '../controls/CameraController.js';

export class RenderPipeline {
    private gl: WebGLRenderingContext;
    private shaderManager: ShaderManager;
    private bufferManager: BufferManager;
    private cameraController: CameraController;

    private colorMode: number = 0;
    private leafColor: [number, number, number] = [0.18, 0.8, 0.13];

    constructor(
        gl: WebGLRenderingContext,
        shaderManager: ShaderManager,
        bufferManager: BufferManager,
        cameraController: CameraController
    ) {
        this.gl = gl;
        this.shaderManager = shaderManager;
        this.bufferManager = bufferManager;
        this.cameraController = cameraController;
    }

    public render(time: number = 0): void {
        const gl = this.gl;

        // Update camera matrices
        this.cameraController.updateCamera(time);

        // Clear screen
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Render branches
        this.renderBranches(time);

        // Render leaves
        this.renderLeaves(time);
    }

    private renderBranches(time: number): void {
        const gl = this.gl;
        const branchProgram = this.shaderManager.getBranchProgram();

        if (this.bufferManager.getIndexCount() <= 0) return;

        // Use branch shader program
        this.shaderManager.useProgram(branchProgram.program);

        // Update uniforms
        this.updateBranchUniforms(branchProgram, time);

        // Bind buffers and attributes
        this.bufferManager.bindBranchBuffers(branchProgram.attributes);

        // Set vertex color usage uniform
        const useVertexColors = this.colorMode === 4; // Mode 4 = Parameterized Colors
        if (branchProgram.uniforms.useVertexColors) {
            gl.uniform1i(branchProgram.uniforms.useVertexColors, useVertexColors ? 1 : 0);
        } else {
            console.error("Branch u_useVertexColors uniform location is null!");
        }

        // Draw branches
        const indexType = this.bufferManager.getIndexType();
        const indexCount = this.bufferManager.getIndexCount();
        gl.drawElements(gl.TRIANGLES, indexCount, indexType, 0);
    }

    private renderLeaves(time: number): void {
        const gl = this.gl;
        const leafProgram = this.shaderManager.getLeafProgram();

        if (this.bufferManager.getLeafIndexCount() <= 0) return;

        // Setup optimal blending for highly translucent spheres
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false); // Don't write to depth buffer for transparent objects
        gl.disable(gl.CULL_FACE);
        gl.depthFunc(gl.LEQUAL);

        // Use leaf shader program
        this.shaderManager.useProgram(leafProgram.program);

        // Update uniforms
        this.updateLeafUniforms(leafProgram, time);

        // Bind buffers and attributes
        this.bufferManager.bindLeafBuffers(leafProgram.attributes);

        // Set vertex color usage uniform
        const useVertexColors = this.colorMode === 4; // Mode 4 = Parameterized Colors
        if (leafProgram.uniforms.useVertexColors) {
            gl.uniform1i(leafProgram.uniforms.useVertexColors, useVertexColors ? 1 : 0);
        } else {
            console.error("Leaf u_useVertexColors uniform location is null!");
        }

        // Draw leaves
        const leafIndexType = this.bufferManager.getLeafIndexType();
        const leafIndexCount = this.bufferManager.getLeafIndexCount();
        gl.drawElements(gl.TRIANGLES, leafIndexCount, leafIndexType, 0);

        // Restore render state
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.depthMask(true);
        gl.depthFunc(gl.LESS);

        // Check for WebGL errors after leaf rendering
        const leafError = gl.getError();
        if (leafError !== gl.NO_ERROR) {
            console.error("WebGL error during leaf rendering:", leafError);
        }
    }

    private updateBranchUniforms(program: ShaderProgram, time: number): void {
        const gl = this.gl;
        const { uniforms } = program;

        // Update transformation matrices
        gl.uniformMatrix4fv(uniforms.modelViewMatrix, false, this.cameraController.getModelViewMatrix());
        gl.uniformMatrix4fv(uniforms.projectionMatrix, false, this.cameraController.getProjectionMatrix());
        gl.uniformMatrix3fv(uniforms.normalMatrix, false, this.cameraController.getNormalMatrix());

        // Update rendering parameters
        gl.uniform1f(uniforms.time, time * 0.001);
        gl.uniform1i(uniforms.colorMode, this.colorMode);
        gl.uniform3fv(uniforms.lightDirection, [0.5, 1.0, 0.3]);
    }

    private updateLeafUniforms(program: ShaderProgram, time: number): void {
        const gl = this.gl;
        const { uniforms } = program;

        // Update transformation matrices
        gl.uniformMatrix4fv(uniforms.modelViewMatrix, false, this.cameraController.getModelViewMatrix());
        gl.uniformMatrix4fv(uniforms.projectionMatrix, false, this.cameraController.getProjectionMatrix());
        gl.uniformMatrix3fv(uniforms.normalMatrix, false, this.cameraController.getNormalMatrix());

        // Update rendering parameters
        gl.uniform1f(uniforms.time, time * 0.001);
        gl.uniform3fv(uniforms.lightDirection, [0.5, 1.0, 0.3]);
        gl.uniform3fv(uniforms.leafColor, this.leafColor);
    }

    public setColorMode(mode: number): void {
        this.colorMode = mode;
    }

    public getColorMode(): number {
        return this.colorMode;
    }

    public setLeafColor(color: [number, number, number]): void {
        this.leafColor = color;
    }

    public getLeafColor(): [number, number, number] {
        return this.leafColor;
    }

    public dispose(): void {
        // Pipeline cleanup is handled by individual managers
        // This method exists for interface completeness
    }
}
