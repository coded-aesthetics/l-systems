/**
 * Backward-compatible LSystem class wrapper
 * Maintains the same interface as the original while using the new modular architecture
 */

import { LSystemGenerator } from "./LSystemGenerator.js";
import { LSystemRule, LSystemConfig, GeometryData } from "./LSystemState.js";
import { SymbolParser } from "../parsing/SymbolParser.js";

// Re-export types for backward compatibility
export interface ParameterizedSymbol {
    symbol: string;
    parameters: Map<string, string>;
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
    color?: [number, number, number, number];
}

export interface LeafGeometry {
    vertices: number[];
    normals: number[];
    uvs: number[];
    indices: number[];
    colors?: number[];
}

// Backward-compatible ParameterizedSymbolParser export
export class ParameterizedSymbolParser {
    private static readonly PARAM_PATTERN =
        /([A-Za-z+\-\[\]&^\\\/Ff])(\{[^}]+\})?/g;
    private static readonly PARAM_CONTENT = /(\w+):([^,}]+)/g;

    static parseString(input: string): ParameterizedSymbol[] {
        const tokens: ParameterizedSymbol[] = [];
        let match;

        this.PARAM_PATTERN.lastIndex = 0;

        while ((match = this.PARAM_PATTERN.exec(input)) !== null) {
            const symbol = match[1];
            const paramString = match[2];

            const parameters = new Map<string, string>();

            if (paramString) {
                const paramContent = paramString.slice(1, -1);
                const paramMatches = paramContent.matchAll(this.PARAM_CONTENT);

                for (const paramMatch of paramMatches) {
                    const key = paramMatch[1].trim();
                    const value = paramMatch[2].trim();
                    parameters.set(key, value);
                }
            }

            tokens.push({ symbol, parameters });
        }

        return tokens;
    }

    static parseColor(
        colorString: string,
    ): [number, number, number, number] | null {
        const cleanColor = colorString.startsWith("#")
            ? colorString.slice(1)
            : colorString;

        const namedColors: { [key: string]: [number, number, number, number] } =
            {
                red: [1, 0, 0, 1],
                green: [0, 1, 0, 1],
                blue: [0, 0, 1, 1],
                brown: [0.4, 0.2, 0.1, 1],
                leaf_green: [0.3, 0.7, 0.2, 1],
                bark_brown: [0.3, 0.15, 0.05, 1],
                autumn_red: [0.7, 0.2, 0.1, 1],
                autumn_orange: [0.8, 0.4, 0.1, 1],
                autumn_yellow: [0.9, 0.7, 0.2, 1],
                dark_green: [0.1, 0.3, 0.1, 1],
            };

        if (namedColors[cleanColor.toLowerCase()]) {
            return namedColors[cleanColor.toLowerCase()];
        }

        if (cleanColor.match(/^[0-9A-Fa-f]+$/)) {
            if (cleanColor.length === 6) {
                const r = parseInt(cleanColor.slice(0, 2), 16) / 255;
                const g = parseInt(cleanColor.slice(2, 4), 16) / 255;
                const b = parseInt(cleanColor.slice(4, 6), 16) / 255;
                return [r, g, b, 1];
            } else if (cleanColor.length === 8) {
                const r = parseInt(cleanColor.slice(0, 2), 16) / 255;
                const g = parseInt(cleanColor.slice(2, 4), 16) / 255;
                const b = parseInt(cleanColor.slice(4, 6), 16) / 255;
                const a = parseInt(cleanColor.slice(6, 8), 16) / 255;
                return [r, g, b, a];
            }
        }

        return null;
    }

    static tokensToString(tokens: ParameterizedSymbol[]): string {
        return tokens
            .map((token) => {
                if (token.parameters.size === 0) {
                    return token.symbol;
                }

                const params = Array.from(token.parameters.entries())
                    .map(([key, value]) => `${key}:${value}`)
                    .join(",");
                return `${token.symbol}{${params}}`;
            })
            .join("");
    }
}

/**
 * Backward-compatible LSystem class that wraps the new modular architecture
 */
export class LSystem {
    private app: LSystemGenerator;

    constructor(
        axiom: string,
        rules: LSystemRule[],
        angle: number = 25,
        angleVariation: number = 0,
        lengthVariation: number = 0,
        leafProbability: number = 0.7,
        leafGenerationThreshold: number = 3,
    ) {
        const config: Partial<LSystemConfig> = {
            angle,
            angleVariation,
            lengthVariation,
            leafProbability,
            leafGenerationThreshold,
        };

        this.app = new LSystemGenerator(axiom, rules, config);
    }

    public setAngle(angle: number): void {
        this.app.updateConfig({ angle });
    }

    public setAngleVariation(variation: number): void {
        this.app.updateConfig({ angleVariation: variation });
    }

    public setLengthVariation(variation: number): void {
        this.app.updateConfig({ lengthVariation: variation });
    }

    public setLeafProbability(probability: number): void {
        this.app.updateConfig({ leafProbability: probability });
    }

    public setLeafGenerationThreshold(threshold: number): void {
        this.app.updateConfig({ leafGenerationThreshold: threshold });
    }

    public generate(iterations: number): string {
        return this.app.generate(iterations);
    }

    public interpretToGeometry(
        lSystemString?: string,
        length: number = 1,
        thickness: number = 0.1,
        tapering: number = 0.8,
        leafColor: [number, number, number] = [0.2, 0.8, 0.2],
    ): any {
        // For backward compatibility, we'll use the current generated string
        // The parameters length, thickness, tapering, leafColor are deprecated
        // but we maintain the method signature for compatibility

        if (lSystemString && lSystemString !== this.app.getCurrentString()) {
            console.warn(
                "Custom lSystemString parameter is deprecated. Using current generated string.",
            );
        }

        const geometry = this.app.interpretToGeometry(
            length,
            thickness,
            tapering,
            leafColor,
        );

        // Convert to the old format expected by the renderer
        return {
            vertices: geometry.branches.vertices,
            normals: geometry.branches.normals,
            uvs: geometry.branches.uvs,
            depths: geometry.branches.depths,
            heights: geometry.branches.heights,
            indices: geometry.branches.indices,
            colors: geometry.branches.colors,
            leafVertices: geometry.leaves.vertices,
            leafNormals: geometry.leaves.normals,
            leafUvs: geometry.leaves.uvs,
            leafIndices: geometry.leaves.indices,
            leafColors: geometry.leaves.colors,
        };
    }

    public static parseRules(ruleText: string): LSystemRule[] {
        return LSystemGenerator.parseRules(ruleText);
    }
}

// Re-export types for backward compatibility
export type {
    LSystemRule,
    LSystemConfig,
    GeometryData,
} from "./LSystemState.js";
