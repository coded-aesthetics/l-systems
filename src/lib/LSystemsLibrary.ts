/**
 * L-Systems Tree Generator Library
 *
 * A lightweight library for generating 3D tree structures using L-Systems (Lindenmayer Systems).
 * Provides WebGL-ready geometry data that can be easily integrated into any 3D framework.
 */

import { LSystemGenerator } from "../core/LSystemGenerator.js";
import { LSystemRule, GeometryData } from "../core/LSystemState.js";

export interface LSystemConfig {
    axiom: string;
    rules: string | LSystemRule[];
    iterations: number;
    angle: number;
    angleVariation?: number;
    lengthVariation?: number;
    lengthTapering?: number;
    leafProbability?: number;
    leafGenerationThreshold?: number;
}

export interface GeometryParameters {
    length?: number;
    thickness?: number;
    tapering?: number;
    leafColor?: [number, number, number];
}

export interface TreeGeometry {
    branches: {
        vertices: Float32Array;
        normals: Float32Array;
        uvs: Float32Array;
        colors: Float32Array;
        indices: Uint16Array | Uint32Array;
        depths: Float32Array;
        heights: Float32Array;
    };
    leaves: {
        vertices: Float32Array;
        normals: Float32Array;
        uvs: Float32Array;
        colors: Float32Array;
        indices: Uint16Array | Uint32Array;
    };
    statistics: {
        branchVertices: number;
        leafVertices: number;
        totalVertices: number;
        generatedString: string;
    };
}

/**
 * Main L-Systems Library Class
 */
export class LSystemsLibrary {
    private generator: LSystemGenerator;

    constructor(config: LSystemConfig) {
        // Parse rules if provided as string
        const rules =
            typeof config.rules === "string"
                ? LSystemGenerator.parseRules(config.rules)
                : config.rules;

        // Create generator with configuration
        const generatorConfig = {
            angle: config.angle,
            angleVariation: config.angleVariation || 0,
            lengthVariation: config.lengthVariation || 0,
            lengthTapering: config.lengthTapering || 0.95,
            leafProbability: config.leafProbability || 0.7,
            leafGenerationThreshold: config.leafGenerationThreshold || 3,
        };

        this.generator = new LSystemGenerator(
            config.axiom,
            rules,
            generatorConfig,
        );
    }

    /**
     * Generate tree geometry from the L-System configuration
     */
    public generateTree(
        iterations: number,
        geometryParams: GeometryParameters = {},
    ): TreeGeometry {
        // Generate L-System string
        const lSystemString = this.generator.generate(iterations);

        // Set default geometry parameters
        const params = {
            length: geometryParams.length || 1.0,
            thickness: geometryParams.thickness || 0.05,
            tapering: geometryParams.tapering || 0.8,
            leafColor:
                geometryParams.leafColor ||
                ([0.2, 0.8, 0.2] as [number, number, number]),
        };

        // Generate geometry
        const geometryData = this.generator.interpretToGeometry(
            params.length,
            params.thickness,
            params.tapering,
            params.leafColor,
        );

        // Convert to library format
        return this.convertGeometryData(geometryData, lSystemString);
    }

    /**
     * Update the L-System configuration
     */
    public updateConfig(config: Partial<LSystemConfig>): void {
        if (config.axiom) {
            this.generator.setAxiom(config.axiom);
        }

        if (config.rules) {
            const rules =
                typeof config.rules === "string"
                    ? LSystemGenerator.parseRules(config.rules)
                    : config.rules;
            this.generator.addRules(rules);
        }

        // Update generator configuration
        const generatorConfig: any = {};
        if (config.angle !== undefined) generatorConfig.angle = config.angle;
        if (config.angleVariation !== undefined)
            generatorConfig.angleVariation = config.angleVariation;
        if (config.lengthVariation !== undefined)
            generatorConfig.lengthVariation = config.lengthVariation;
        if (config.leafProbability !== undefined)
            generatorConfig.leafProbability = config.leafProbability;
        if (config.leafGenerationThreshold !== undefined)
            generatorConfig.leafGenerationThreshold =
                config.leafGenerationThreshold;

        if (Object.keys(generatorConfig).length > 0) {
            this.generator.updateConfig(generatorConfig);
        }
    }

    /**
     * Get current configuration
     */
    public getConfig(): any {
        return this.generator.getConfig();
    }

    /**
     * Generate only the L-System string without geometry
     */
    public generateString(iterations: number): string {
        return this.generator.generate(iterations);
    }

    /**
     * Get statistics about the current L-System
     */
    public getStatistics(): any {
        return this.generator.getStatistics();
    }

    /**
     * Reset the generator to initial state
     */
    public reset(): void {
        this.generator.reset();
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.generator.dispose();
    }

    private convertGeometryData(
        geometryData: GeometryData,
        generatedString: string,
    ): TreeGeometry {
        // Determine if we need 32-bit indices based on vertex count
        const branchVertexCount = geometryData.branches.vertices.length / 3;
        const leafVertexCount = geometryData.leaves.vertices.length / 3;

        const needsBranch32BitIndices = branchVertexCount > 65535;
        const needsLeaf32BitIndices = leafVertexCount > 65535;

        // Find maximum index values to double-check (efficient loop to avoid stack overflow)
        let maxBranchIndex = 0;
        for (let i = 0; i < geometryData.branches.indices.length; i++) {
            if (geometryData.branches.indices[i] > maxBranchIndex) {
                maxBranchIndex = geometryData.branches.indices[i];
            }
        }

        let maxLeafIndex = 0;
        for (let i = 0; i < geometryData.leaves.indices.length; i++) {
            if (geometryData.leaves.indices[i] > maxLeafIndex) {
                maxLeafIndex = geometryData.leaves.indices[i];
            }
        }

        // Use 32-bit indices if vertex count or max index exceeds 16-bit limit
        const useBranch32Bit =
            needsBranch32BitIndices || maxBranchIndex > 65535;
        const useLeaf32Bit = needsLeaf32BitIndices || maxLeafIndex > 65535;

        // Log when 32-bit indices are needed
        if (useBranch32Bit || useLeaf32Bit) {
            console.log(
                `[LSystemsLibrary] Using 32-bit indices - Vertices: ${branchVertexCount + leafVertexCount}, Branch32: ${useBranch32Bit}, Leaf32: ${useLeaf32Bit}`,
            );
        }

        return {
            branches: {
                vertices: new Float32Array(geometryData.branches.vertices),
                normals: new Float32Array(geometryData.branches.normals),
                uvs: new Float32Array(geometryData.branches.uvs),
                colors: new Float32Array(geometryData.branches.colors),
                indices: useBranch32Bit
                    ? new Uint32Array(geometryData.branches.indices)
                    : new Uint16Array(geometryData.branches.indices),
                depths: new Float32Array(geometryData.branches.depths),
                heights: new Float32Array(geometryData.branches.heights),
            },
            leaves: {
                vertices: new Float32Array(geometryData.leaves.vertices),
                normals: new Float32Array(geometryData.leaves.normals),
                uvs: new Float32Array(geometryData.leaves.uvs),
                colors: new Float32Array(geometryData.leaves.colors),
                indices: useLeaf32Bit
                    ? new Uint32Array(geometryData.leaves.indices)
                    : new Uint16Array(geometryData.leaves.indices),
            },
            statistics: {
                branchVertices: branchVertexCount,
                leafVertices: leafVertexCount,
                totalVertices: branchVertexCount + leafVertexCount,
                generatedString: generatedString,
            },
        };
    }

    /**
     * Static factory method for quick tree generation
     */
    static generateTree(
        config: LSystemConfig,
        geometryParams: GeometryParameters = {},
    ): TreeGeometry {
        const library = new LSystemsLibrary(config);
        const result = library.generateTree(config.iterations, geometryParams);
        library.dispose();
        return result;
    }

    /**
     * Parse rule string into rule objects
     */
    static parseRules(ruleString: string): LSystemRule[] {
        return LSystemGenerator.parseRules(ruleString);
    }
}

// Re-export core types for convenience
export type { LSystemRule, GeometryData } from "../core/LSystemState.js";
