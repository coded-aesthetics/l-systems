/**
 * Core types and interfaces for L-System state management
 */

export interface ParameterizedSymbol {
    symbol: string;
    parameters: Map<string, string>;
}

export interface LSystemRule {
    from: string;
    to: string;
    condition?: (state: GenerationState) => boolean;
    probability?: number;
}

export interface GenerationState {
    iteration: number;
    depth: number;
    position: number;
}

export interface LSystemState {
    position: [number, number, number];
    direction: [number, number, number];
    up: [number, number, number];
    right: [number, number, number];
    length: number;
    thickness: number;
    depth: number;
    generation: number;
    color?: [number, number, number, number]; // RGBA color
}

export interface LeafGeometry {
    vertices: number[];
    normals: number[];
    uvs: number[];
    indices: number[];
    colors?: number[];
}

export interface LSystemConfig {
    angle: number;
    angleVariation: number;
    lengthVariation: number;
    lengthTapering: number;
    leafProbability: number;
    leafGenerationThreshold: number;
}

export interface GeometryData {
    branches: {
        vertices: number[];
        normals: number[];
        uvs: number[];
        depths: number[];
        heights: number[];
        indices: number[];
        colors: number[];
    };
    leaves: {
        vertices: number[];
        normals: number[];
        uvs: number[];
        indices: number[];
        colors: number[];
    };
}
