/**
 * Main L-System application orchestrator
 * Coordinates between the core engine, parsing, and geometry generation
 */

import { LSystemEngine } from "./LSystemEngine.js";
import { LSystemRule, LSystemConfig, GeometryData } from "./LSystemState.js";
import { ValidationUtils } from "../utils/validationUtils.js";
import { SymbolParser } from "../parsing/SymbolParser.js";
import { ColorParser } from "../parsing/ColorParser.js";
import {
    VectorUtils,
    Vec3,
    normalize,
    cross,
    rotateVector,
} from "../utils/mathUtils.js";

export class LSystemGenerator {
    private engine: LSystemEngine;
    private currentGeometry: GeometryData | null = null;
    private currentString: string = "";

    constructor(
        axiom: string,
        rules: LSystemRule[],
        config: Partial<LSystemConfig> = {},
    ) {
        // Validate inputs
        const validation = ValidationUtils.validateComplete(
            axiom,
            rules,
            config,
            0,
        );
        if (!validation.isValid) {
            throw new Error(
                `Invalid L-System configuration: ${validation.errors.join(", ")}`,
            );
        }

        this.engine = new LSystemEngine(axiom, rules, config);
    }

    /**
     * Generate L-System string for specified iterations
     */
    public generate(iterations: number): string {
        const validation = ValidationUtils.validateIterations(iterations);
        if (!validation.isValid) {
            throw new Error(
                `Invalid iterations: ${validation.errors.join(", ")}`,
            );
        }

        this.currentString = this.engine.generate(iterations);
        return this.currentString;
    }

    /**
     * Convert the current L-System string to 3D geometry
     */
    public interpretToGeometry(
        length: number = 1.0,
        thickness: number = 0.1,
        tapering: number = 0.8,
        leafColor?: [number, number, number],
    ): GeometryData {
        if (!this.currentString) {
            throw new Error(
                "No L-System string generated. Call generate() first.",
            );
        }

        const config = this.engine.getConfig();

        // Initialize geometry data
        const geometry: GeometryData = {
            branches: {
                vertices: [],
                normals: [],
                uvs: [],
                depths: [],
                heights: [],
                indices: [],
                colors: [],
            },
            leaves: {
                vertices: [],
                normals: [],
                uvs: [],
                indices: [],
                colors: [],
            },
        };

        // Parse the L-System string into tokens
        const tokens = SymbolParser.parseString(this.currentString);

        // State management
        const stateStack: LSystemState[] = [];
        let currentState: LSystemState = {
            position: [0, 0, 0],
            direction: [0, 1, 0],
            up: [0, 0, 1],
            right: [1, 0, 0],
            length: length,
            thickness: thickness,
            depth: 0,
            generation: 0,
            color: [0.3, 0.15, 0.05, 1.0], // Default bark_brown
        };

        let vertexCount = 0;
        let leafVertexCount = 0;
        const segments = 8;

        // Helper functions for geometry generation
        const getVariedAngle = (): number => {
            if (config.angleVariation === 0) {
                return (config.angle * Math.PI) / 180;
            }
            const variation =
                ((Math.random() * 2 - 1) * (config.angleVariation * Math.PI)) /
                180;
            return (config.angle * Math.PI) / 180 + variation;
        };

        const getVariedLength = (baseLength: number): number => {
            if (config.lengthVariation === 0) {
                return baseLength;
            }
            const variation =
                (Math.random() * 2 - 1) * (config.lengthVariation / 100);
            return baseLength * (1 + variation);
        };

        const addCylinder = (
            startPos: Vec3,
            endPos: Vec3,
            startThickness: number,
            endThickness: number,
            color: [number, number, number, number],
        ) => {
            const direction = VectorUtils.subtract(endPos, startPos);
            const length = VectorUtils.length(direction);

            if (length === 0) return;

            const normalizedDirection = VectorUtils.normalize(direction);
            const up =
                Math.abs(normalizedDirection[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
            const right = VectorUtils.normalize(
                VectorUtils.cross(normalizedDirection, up as Vec3),
            );
            const forward = VectorUtils.cross(right, normalizedDirection);

            const startVertexCount = vertexCount;

            // Generate cylinder vertices
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * 2 * Math.PI;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                // Bottom ring (start)
                const localX = VectorUtils.scale(right, cos);
                const localY = VectorUtils.scale(forward, sin);
                const localZ = VectorUtils.scale(localX, startThickness);
                const localW = VectorUtils.scale(localY, startThickness);
                const offset = VectorUtils.add(localZ, localW);
                const pos = VectorUtils.add(startPos, offset);

                geometry.branches.vertices.push(pos[0], pos[1], pos[2]);
                geometry.branches.normals.push(
                    localX[0] + localY[0],
                    localX[1] + localY[1],
                    localX[2] + localY[2],
                );
                geometry.branches.uvs.push(i / segments, 0);
                geometry.branches.depths.push(currentState.depth);
                geometry.branches.heights.push(currentState.generation);
                geometry.branches.colors.push(
                    color[0],
                    color[1],
                    color[2],
                    color[3],
                );

                // Top ring (end)
                const endLocalZ = VectorUtils.scale(localX, endThickness);
                const endLocalW = VectorUtils.scale(localY, endThickness);
                const endOffset = VectorUtils.add(endLocalZ, endLocalW);
                const endPos2 = VectorUtils.add(endPos, endOffset);

                geometry.branches.vertices.push(
                    endPos2[0],
                    endPos2[1],
                    endPos2[2],
                );
                geometry.branches.normals.push(
                    localX[0] + localY[0],
                    localX[1] + localY[1],
                    localX[2] + localY[2],
                );
                geometry.branches.uvs.push(i / segments, 1);
                geometry.branches.depths.push(currentState.depth + 1);
                geometry.branches.heights.push(currentState.generation + 1);
                geometry.branches.colors.push(
                    color[0],
                    color[1],
                    color[2],
                    color[3],
                );

                vertexCount += 2;
            }

            // Generate indices for cylinder
            for (let i = 0; i < segments; i++) {
                const next = (i + 1) % (segments + 1);
                const current = i;

                const v0 = startVertexCount + current * 2;
                const v1 = startVertexCount + current * 2 + 1;
                const v2 = startVertexCount + next * 2;
                const v3 = startVertexCount + next * 2 + 1;

                // Two triangles per segment
                geometry.branches.indices.push(v0, v1, v2);
                geometry.branches.indices.push(v2, v1, v3);
            }
        };

        const addLeaf = (
            position: Vec3,
            size: number,
            color: [number, number, number, number],
        ) => {
            const leafRadius = size * 0.6;
            const sphereSegments = 12;
            const sphereRings = 8;

            // Offset position slightly
            const offsetPos: Vec3 = [
                position[0] + (Math.random() - 0.5) * 0.1,
                position[1] + (Math.random() - 0.5) * 0.1,
                position[2] + (Math.random() - 0.5) * 0.1,
            ];

            const startIdx = leafVertexCount;
            const leafRGBA = color;

            // Generate sphere vertices for leaf
            for (let ring = 0; ring <= sphereRings; ring++) {
                const phi = (ring / sphereRings) * Math.PI;
                const y = Math.cos(phi) * leafRadius;
                const ringRadius = Math.sin(phi) * leafRadius;

                for (let segment = 0; segment <= sphereSegments; segment++) {
                    const theta = (segment / sphereSegments) * 2 * Math.PI;
                    const x = Math.cos(theta) * ringRadius;
                    const z = Math.sin(theta) * ringRadius;

                    const vertexPos: Vec3 = [
                        offsetPos[0] + x,
                        offsetPos[1] + y,
                        offsetPos[2] + z,
                    ];

                    geometry.leaves.vertices.push(
                        vertexPos[0],
                        vertexPos[1],
                        vertexPos[2],
                    );

                    // Normal pointing outward from center
                    const normal = VectorUtils.normalize([x, y, z]);
                    geometry.leaves.normals.push(
                        normal[0],
                        normal[1],
                        normal[2],
                    );

                    geometry.leaves.uvs.push(
                        segment / sphereSegments,
                        ring / sphereRings,
                    );
                    geometry.leaves.colors.push(
                        leafRGBA[0],
                        leafRGBA[1],
                        leafRGBA[2],
                        leafRGBA[3],
                    );

                    leafVertexCount++;
                }
            }

            // Generate indices for sphere
            for (let ring = 0; ring < sphereRings; ring++) {
                for (let segment = 0; segment < sphereSegments; segment++) {
                    const current =
                        startIdx + ring * (sphereSegments + 1) + segment;
                    const next =
                        startIdx + ring * (sphereSegments + 1) + segment + 1;
                    const currentNext =
                        startIdx + (ring + 1) * (sphereSegments + 1) + segment;
                    const nextNext =
                        startIdx +
                        (ring + 1) * (sphereSegments + 1) +
                        segment +
                        1;

                    if (ring !== 0) {
                        geometry.leaves.indices.push(
                            current,
                            next,
                            currentNext,
                        );
                    }
                    if (ring !== sphereRings - 1) {
                        geometry.leaves.indices.push(
                            next,
                            nextNext,
                            currentNext,
                        );
                    }
                }
            }
        };

        // Process each token
        for (const token of tokens) {
            const colorParam = SymbolParser.extractString(token, "color");
            let symbolColor: [number, number, number, number] | undefined =
                undefined;

            if (colorParam) {
                const parsedColor = ColorParser.parseColor(colorParam);
                if (parsedColor) {
                    symbolColor = parsedColor;
                }
            }

            switch (token.symbol) {
                case "F":
                case "f": {
                    // Forward with line
                    const startPos: Vec3 = [...currentState.position];
                    const variedLength = getVariedLength(currentState.length);
                    const movement = VectorUtils.scale(
                        currentState.direction,
                        variedLength,
                    );
                    const endPos: Vec3 = VectorUtils.add(
                        currentState.position,
                        movement,
                    );

                    // Calculate thickness tapering with minimum thickness
                    const endThickness = Math.max(
                        currentState.thickness * tapering,
                        0.001,
                    );
                    const segmentColor = symbolColor || currentState.color!;

                    addCylinder(
                        startPos,
                        endPos,
                        currentState.thickness,
                        endThickness,
                        segmentColor,
                    );

                    currentState.position = endPos;
                    currentState.thickness = Math.max(endThickness, 0.001); // Apply tapering to current state with minimum
                    currentState.length *= 0.95; // Slight length reduction
                    break;
                }

                case "L": {
                    // Leaf - only generate if above threshold and probability check
                    if (
                        currentState.generation >=
                            config.leafGenerationThreshold &&
                        Math.random() < config.leafProbability
                    ) {
                        // Priority: symbolColor > leafColor parameter > default green
                        let leafRGBA: [number, number, number, number];
                        if (symbolColor) {
                            leafRGBA = symbolColor;
                        } else if (leafColor) {
                            leafRGBA = [
                                leafColor[0],
                                leafColor[1],
                                leafColor[2],
                                1.0,
                            ];
                        } else {
                            leafRGBA = [0, 1, 0, 1.0]; // Default green
                        }
                        addLeaf(
                            currentState.position,
                            currentState.length,
                            leafRGBA,
                        );
                    }
                    break;
                }

                case "+": {
                    // Turn right around up vector
                    const variedAngle = getVariedAngle();
                    currentState.direction = rotateVector(
                        currentState.direction,
                        currentState.up,
                        variedAngle,
                    );
                    currentState.right = VectorUtils.cross(
                        currentState.direction,
                        currentState.up,
                    );
                    break;
                }

                case "-": {
                    // Turn left around up vector
                    const variedAngle = getVariedAngle();
                    currentState.direction = rotateVector(
                        currentState.direction,
                        currentState.up,
                        -variedAngle,
                    );
                    currentState.right = VectorUtils.cross(
                        currentState.direction,
                        currentState.up,
                    );
                    break;
                }

                case "&": {
                    // Pitch down around right vector
                    const variedAngle = getVariedAngle();
                    currentState.direction = rotateVector(
                        currentState.direction,
                        currentState.right,
                        -variedAngle,
                    );
                    currentState.up = VectorUtils.cross(
                        currentState.right,
                        currentState.direction,
                    );
                    break;
                }

                case "^": {
                    // Pitch up around right vector
                    const variedAngle = getVariedAngle();
                    currentState.direction = rotateVector(
                        currentState.direction,
                        currentState.right,
                        variedAngle,
                    );
                    currentState.up = VectorUtils.cross(
                        currentState.right,
                        currentState.direction,
                    );
                    break;
                }

                case "\\": {
                    // Roll left around direction vector
                    const variedAngle = getVariedAngle();
                    currentState.up = rotateVector(
                        currentState.up,
                        currentState.direction,
                        -variedAngle,
                    );
                    currentState.right = VectorUtils.cross(
                        currentState.direction,
                        currentState.up,
                    );
                    break;
                }

                case "/": {
                    // Roll right around direction vector
                    const variedAngle = getVariedAngle();
                    currentState.up = rotateVector(
                        currentState.up,
                        currentState.direction,
                        variedAngle,
                    );
                    currentState.right = VectorUtils.cross(
                        currentState.direction,
                        currentState.up,
                    );
                    break;
                }

                case "[": {
                    // Push state
                    stateStack.push({
                        ...currentState,
                        position: [...currentState.position],
                        direction: [...currentState.direction],
                        up: [...currentState.up],
                        right: [...currentState.right],
                        color: currentState.color
                            ? [...currentState.color]
                            : undefined,
                    });
                    currentState.depth++;
                    currentState.thickness = Math.max(
                        currentState.thickness * tapering,
                        0.001,
                    );
                    currentState.generation++;
                    break;
                }

                case "]": {
                    // Pop state
                    if (stateStack.length > 0) {
                        currentState = stateStack.pop()!;
                    }
                    break;
                }
            }

            // Update color if it was modified
            if (symbolColor) {
                currentState.color = symbolColor;
            }
        }

        this.currentGeometry = geometry;
        return geometry;
    }

    /**
     * Get the current generated string
     */
    public getCurrentString(): string {
        return this.currentString;
    }

    /**
     * Get the current geometry
     */
    public getCurrentGeometry(): GeometryData | null {
        return this.currentGeometry;
    }

    /**
     * Get engine statistics
     */
    public getStatistics() {
        return this.engine.getStatistics();
    }

    /**
     * Update configuration
     */
    public updateConfig(config: Partial<LSystemConfig>): void {
        const validation = ValidationUtils.validateConfig(config);
        if (!validation.isValid) {
            throw new Error(
                `Invalid configuration: ${validation.errors.join(", ")}`,
            );
        }
        this.engine.updateConfig(config);
    }

    /**
     * Get current configuration
     */
    public getConfig(): LSystemConfig {
        return this.engine.getConfig();
    }

    /**
     * Set new axiom
     */
    public setAxiom(axiom: string): void {
        const validation = ValidationUtils.validateAxiom(axiom);
        if (!validation.isValid) {
            throw new Error(`Invalid axiom: ${validation.errors.join(", ")}`);
        }
        this.engine.setAxiom(axiom);
    }

    /**
     * Add new rules
     */
    public addRules(rules: LSystemRule[]): void {
        const validation = ValidationUtils.validateRules(rules);
        if (!validation.isValid) {
            throw new Error(`Invalid rules: ${validation.errors.join(", ")}`);
        }
        this.engine.addRules(rules);
    }

    /**
     * Parse rules from string format
     */
    public static parseRules(ruleText: string): LSystemRule[] {
        const rules: LSystemRule[] = [];
        const lines = ruleText.split("\n");

        for (const line of lines) {
            const trimmed = line.trim();
            if (
                !trimmed ||
                trimmed.startsWith("//") ||
                trimmed.startsWith("#")
            ) {
                continue;
            }

            if (trimmed.includes("->")) {
                const [from, to] = trimmed.split("->").map((s) => s.trim());
                if (from && to) {
                    rules.push({ from, to });
                }
            }
        }

        return rules;
    }

    /**
     * Reset to initial state
     */
    public reset(): void {
        this.engine.reset();
        this.currentString = "";
        this.currentGeometry = null;
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.currentGeometry = null;
        this.currentString = "";
    }
}

// Re-export important types for backward compatibility
export type {
    LSystemRule,
    LSystemConfig,
    GeometryData,
} from "./LSystemState.js";
export { ValidationUtils } from "../utils/validationUtils.js";
export { ColorParser } from "../parsing/ColorParser.js";

// Helper interface for internal state management
interface LSystemState {
    position: Vec3;
    direction: Vec3;
    up: Vec3;
    right: Vec3;
    length: number;
    thickness: number;
    depth: number;
    generation: number;
    color?: [number, number, number, number];
}
