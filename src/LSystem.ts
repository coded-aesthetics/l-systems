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
                // Remove the braces and parse parameters
                const paramContent = paramString.slice(1, -1); // Remove { }
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
        // Remove # if present
        const cleanColor = colorString.startsWith("#")
            ? colorString.slice(1)
            : colorString;

        // Handle named colors
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

        // Handle hex colors
        if (cleanColor.match(/^[0-9A-Fa-f]+$/)) {
            if (cleanColor.length === 6) {
                // RGB format
                const r = parseInt(cleanColor.slice(0, 2), 16) / 255;
                const g = parseInt(cleanColor.slice(2, 4), 16) / 255;
                const b = parseInt(cleanColor.slice(4, 6), 16) / 255;
                return [r, g, b, 1];
            } else if (cleanColor.length === 8) {
                // RGBA format
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

export class LSystem {
    private axiom: string;
    private rules: Map<string, string[]>;
    private parameterizedRules: Map<string, string[]>;
    private angle: number;
    private angleVariation: number;
    private lengthVariation: number;
    private iterations: number;
    private leafProbability: number;
    private leafGenerationThreshold: number;

    constructor(
        axiom: string,
        rules: LSystemRule[],
        angle: number = 25,
        angleVariation: number = 0,
        lengthVariation: number = 0,
        leafProbability: number = 0.7,
        leafGenerationThreshold: number = 3,
    ) {
        this.axiom = axiom;
        this.rules = new Map();
        this.parameterizedRules = new Map();
        this.angle = (angle * Math.PI) / 180; // Convert to radians
        this.angleVariation = (angleVariation * Math.PI) / 180; // Convert to radians
        this.lengthVariation = lengthVariation / 100; // Convert percentage to decimal
        this.iterations = 0;
        this.leafProbability = leafProbability;
        this.leafGenerationThreshold = leafGenerationThreshold;

        // Group rules by symbol to support multiple rules per symbol
        rules.forEach((rule) => {
            // Extract base symbol from 'from' part (handle parameterized symbols)
            const baseSymbol = rule.from.includes("{")
                ? rule.from.charAt(0)
                : rule.from;

            if (!this.rules.has(baseSymbol)) {
                this.rules.set(baseSymbol, []);
            }
            this.rules.get(baseSymbol)!.push(rule.to);

            // Also store parameterized rules for direct lookup
            if (!this.parameterizedRules.has(rule.from)) {
                this.parameterizedRules.set(rule.from, []);
            }
            this.parameterizedRules.get(rule.from)!.push(rule.to);
        });

        // Add default leaf behavior if no explicit leaf rules exist
        if (!this.rules.has("L")) {
            this.rules.set("L", ["L"]); // Leaves stay as leaves
        }
    }

    public setAngle(angle: number): void {
        this.angle = (angle * Math.PI) / 180;
    }

    public setAngleVariation(variation: number): void {
        this.angleVariation = (variation * Math.PI) / 180;
    }

    public setLengthVariation(variation: number): void {
        this.lengthVariation = variation / 100;
    }

    private getVariedAngle(): number {
        if (this.angleVariation === 0) {
            return this.angle;
        }
        // Generate random variation between -angleVariation and +angleVariation
        const variation = (Math.random() * 2 - 1) * this.angleVariation;
        return this.angle + variation;
    }

    private getVariedLength(baseLength: number): number {
        if (this.lengthVariation === 0) {
            return baseLength;
        }
        // Generate random variation between -lengthVariation and +lengthVariation
        const variation = (Math.random() * 2 - 1) * this.lengthVariation;
        return baseLength * (1 + variation);
    }

    public generate(iterations: number): string {
        let current = this.axiom;
        this.iterations = iterations;

        console.log(`Starting L-System generation with axiom: "${current}"`);

        for (let i = 0; i < iterations; i++) {
            current = this.iterate(current, i);
            console.log(
                `Iteration ${i + 1}: "${current.substring(0, 100)}${current.length > 100 ? "..." : ""}"`,
            );

            // Count leaf symbols
            const leafCount = (current.match(/L/g) || []).length;
            console.log(`Leaf symbols (L) in iteration ${i + 1}: ${leafCount}`);
        }

        return current;
    }

    private iterate(input: string, iteration: number): string {
        // Parse input string into tokens first
        const tokens = ParameterizedSymbolParser.parseString(input);
        let result = "";

        for (const token of tokens) {
            const fullSymbol = ParameterizedSymbolParser.tokensToString([
                token,
            ]);

            // Try base symbol rules first (this allows F{color:red} to match F -> ...)
            let ruleOptions = this.rules.get(token.symbol);

            // If no base symbol match, try exact parameterized rule match
            if (!ruleOptions) {
                ruleOptions = this.parameterizedRules.get(fullSymbol);
            }

            if (ruleOptions && ruleOptions.length > 0) {
                // If multiple rules exist for this symbol, choose one randomly
                const selectedRule =
                    ruleOptions[Math.floor(Math.random() * ruleOptions.length)];
                result += selectedRule;
            } else {
                // For symbols without explicit rules, apply probabilistic leaf generation
                if (
                    token.symbol === "A" &&
                    iteration >= this.leafGenerationThreshold &&
                    Math.random() < this.leafProbability
                ) {
                    result += "L";
                } else {
                    result += fullSymbol; // Preserve the full parameterized symbol
                }
            }
        }

        return result;
    }

    public interpretToGeometry(
        lSystemString: string,
        length: number = 1,
        thickness: number = 0.1,
        tapering: number = 0.8,
        leafColor: [number, number, number] = [0.2, 0.8, 0.2],
    ): {
        vertices: number[];
        normals: number[];
        uvs: number[];
        depths: number[];
        heights: number[];
        indices: number[];
        leafVertices: number[];
        leafNormals: number[];
        leafUvs: number[];
        leafIndices: number[];
        colors: number[];
        leafColors: number[];
    } {
        const vertices: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const depths: number[] = [];
        const heights: number[] = [];
        const indices: number[] = [];
        const colors: number[] = [];
        const leafVertices: number[] = [];
        const leafNormals: number[] = [];
        const leafUvs: number[] = [];
        const leafIndices: number[] = [];
        const leafColors: number[] = [];

        const stateStack: LSystemState[] = [];
        let currentState: LSystemState = {
            position: [0, 0, 0],
            direction: [0, 1, 0], // Up
            up: [0, 0, 1], // Forward
            right: [1, 0, 0], // Right
            length: length,
            thickness: thickness,
            depth: 0,
            generation: 0,
            color: [0.4, 0.2, 0.1, 1], // Default brown color
        };

        let vertexCount = 0;
        let leafVertexCount = 0;
        const segments = 8; // Number of segments around cylinder

        // Helper functions for vector operations
        const normalize = (
            v: [number, number, number],
        ): [number, number, number] => {
            const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
            return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
        };

        const cross = (
            a: [number, number, number],
            b: [number, number, number],
        ): [number, number, number] => {
            return [
                a[1] * b[2] - a[2] * b[1],
                a[2] * b[0] - a[0] * b[2],
                a[0] * b[1] - a[1] * b[0],
            ];
        };

        const rotateVector = (
            v: [number, number, number],
            axis: [number, number, number],
            angle: number,
        ): [number, number, number] => {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const dot = v[0] * axis[0] + v[1] * axis[1] + v[2] * axis[2];

            return [
                v[0] * cos +
                    (axis[1] * v[2] - axis[2] * v[1]) * sin +
                    axis[0] * dot * (1 - cos),
                v[1] * cos +
                    (axis[2] * v[0] - axis[0] * v[2]) * sin +
                    axis[1] * dot * (1 - cos),
                v[2] * cos +
                    (axis[0] * v[1] - axis[1] * v[0]) * sin +
                    axis[2] * dot * (1 - cos),
            ];
        };

        const addCylinder = (
            startPos: [number, number, number],
            endPos: [number, number, number],
            startThickness: number,
            endThickness: number,
            depth: number,
            segmentColor?: [number, number, number, number],
        ) => {
            const direction = normalize([
                endPos[0] - startPos[0],
                endPos[1] - startPos[1],
                endPos[2] - startPos[2],
            ]);
            const up: [number, number, number] =
                Math.abs(direction[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
            const right = normalize(cross(direction, up)) as [
                number,
                number,
                number,
            ];
            const forward = normalize(cross(right, direction)) as [
                number,
                number,
                number,
            ];

            const startVertexCount = vertexCount;
            const color = segmentColor || [0.4, 0.2, 0.1, 1];

            // Create cylinder with variable thickness
            for (let i = 0; i <= 1; i++) {
                const pos = i === 0 ? startPos : endPos;
                const thickness = i === 0 ? startThickness : endThickness;
                const height = i === 0 ? -1 : 1; // For height gradient

                for (let j = 0; j < segments; j++) {
                    const angle = (j / segments) * 2 * Math.PI;
                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);

                    const localX = right[0] * cos + forward[0] * sin;
                    const localY = right[1] * cos + forward[1] * sin;
                    const localZ = right[2] * cos + forward[2] * sin;

                    vertices.push(
                        pos[0] + localX * thickness,
                        pos[1] + localY * thickness,
                        pos[2] + localZ * thickness,
                    );
                    normals.push(localX, localY, localZ);
                    uvs.push(j / segments, i);
                    depths.push(depth);
                    heights.push(pos[1]);

                    // Add color data
                    colors.push(color[0], color[1], color[2], color[3]);

                    vertexCount++;
                }
            }

            // Create indices for cylinder faces
            for (let i = 0; i < segments; i++) {
                const next = (i + 1) % segments;

                const v0 = startVertexCount + i;
                const v1 = startVertexCount + segments + i;
                const v2 = startVertexCount + next;
                const v3 = startVertexCount + segments + next;

                indices.push(v0, v1, v2);
                indices.push(v2, v1, v3);
            }
        };

        const addLeaf = (
            position: [number, number, number],
            direction: [number, number, number],
            right: [number, number, number],
            up: [number, number, number],
            size: number,
            depth: number,
            leafColor?: [number, number, number, number],
        ) => {
            // Create leaf as translucent sphere with some randomness
            const leafRadius = size * (0.8 + Math.random() * 0.4); // 80-120% variation
            const sphereSegments = 8; // Number of horizontal segments
            const sphereRings = 6; // Number of vertical rings

            // Offset position slightly from branch end
            const offsetPos: [number, number, number] = [
                position[0] + direction[0] * leafRadius * 0.5,
                position[1] + direction[1] * leafRadius * 0.5,
                position[2] + direction[2] * leafRadius * 0.5,
            ];

            const startIdx = leafVertexCount;
            const leafRGBA = leafColor || [0.3, 0.7, 0.2, 1];

            // Generate sphere vertices
            for (let ring = 0; ring <= sphereRings; ring++) {
                const phi = (ring / sphereRings) * Math.PI; // 0 to PI
                const y = Math.cos(phi);
                const ringRadius = Math.sin(phi);

                for (let segment = 0; segment <= sphereSegments; segment++) {
                    const theta = (segment / sphereSegments) * 2 * Math.PI; // 0 to 2PI
                    const x = ringRadius * Math.cos(theta);
                    const z = ringRadius * Math.sin(theta);

                    // Scale by leaf radius and add to position
                    const vertexPos: [number, number, number] = [
                        offsetPos[0] + x * leafRadius,
                        offsetPos[1] + y * leafRadius,
                        offsetPos[2] + z * leafRadius,
                    ];

                    leafVertices.push(vertexPos[0], vertexPos[1], vertexPos[2]);

                    // Normal is the normalized position relative to center
                    leafNormals.push(x, y, z);

                    // UV coordinates
                    leafUvs.push(segment / sphereSegments, ring / sphereRings);

                    // Add color data
                    leafColors.push(
                        leafRGBA[0],
                        leafRGBA[1],
                        leafRGBA[2],
                        leafRGBA[3],
                    );

                    leafVertexCount++;
                }
            }

            // Generate sphere indices
            for (let ring = 0; ring < sphereRings; ring++) {
                for (let segment = 0; segment < sphereSegments; segment++) {
                    const current =
                        startIdx + ring * (sphereSegments + 1) + segment;
                    const next = current + sphereSegments + 1;

                    // Two triangles per quad
                    leafIndices.push(
                        current,
                        next,
                        current + 1,
                        current + 1,
                        next,
                        next + 1,
                    );
                }
            }
        };

        // Parse parameterized symbols
        const tokens = ParameterizedSymbolParser.parseString(lSystemString);

        // Process tokens
        for (const token of tokens) {
            // Extract color parameter if present
            const colorParam = token.parameters.get("color");
            let symbolColor: [number, number, number, number] | undefined;

            if (colorParam) {
                console.log(
                    `Found color parameter: ${token.symbol}{color:${colorParam}}`,
                );
                symbolColor =
                    ParameterizedSymbolParser.parseColor(colorParam) ||
                    undefined;
                if (symbolColor) {
                    console.log(
                        `Parsed color: [${symbolColor[0].toFixed(3)}, ${symbolColor[1].toFixed(3)}, ${symbolColor[2].toFixed(3)}, ${symbolColor[3].toFixed(3)}]`,
                    );
                } else {
                    console.log(`Failed to parse color: ${colorParam}`);
                }
            }

            switch (token.symbol) {
                case "F": // Forward draw
                case "f": {
                    // Forward move (no draw)
                    const startPos: [number, number, number] = [
                        ...currentState.position,
                    ];
                    const variedLength = this.getVariedLength(
                        currentState.length,
                    );
                    const endPos: [number, number, number] = [
                        currentState.position[0] +
                            currentState.direction[0] * variedLength,
                        currentState.position[1] +
                            currentState.direction[1] * variedLength,
                        currentState.position[2] +
                            currentState.direction[2] * variedLength,
                    ];

                    if (token.symbol === "F") {
                        const endThickness = currentState.thickness * tapering;
                        const segmentColor = symbolColor || currentState.color;
                        console.log(
                            `Drawing F segment with color: [${segmentColor![0].toFixed(3)}, ${segmentColor![1].toFixed(3)}, ${segmentColor![2].toFixed(3)}, ${segmentColor![3].toFixed(3)}]`,
                        );
                        addCylinder(
                            startPos,
                            endPos,
                            currentState.thickness,
                            endThickness,
                            currentState.depth,
                            segmentColor,
                        );
                    }

                    // Update state color if symbol has color
                    if (symbolColor) {
                        console.log(
                            `Updating current state color to: [${symbolColor[0].toFixed(3)}, ${symbolColor[1].toFixed(3)}, ${symbolColor[2].toFixed(3)}, ${symbolColor[3].toFixed(3)}]`,
                        );
                        currentState.color = symbolColor;
                    }

                    currentState.position = endPos;
                    currentState.length *= 0.95; // Slight length reduction
                    currentState.generation++;
                    break;
                }
                case "L": {
                    // Leaf
                    console.log(
                        `Processing leaf at position: [${currentState.position.join(", ")}]`,
                    );
                    const leafRGBA = symbolColor || [
                        leafColor[0],
                        leafColor[1],
                        leafColor[2],
                        1,
                    ];
                    console.log(
                        `Drawing L leaf with color: [${leafRGBA[0].toFixed(3)}, ${leafRGBA[1].toFixed(3)}, ${leafRGBA[2].toFixed(3)}, ${leafRGBA[3].toFixed(3)}]`,
                    );
                    addLeaf(
                        currentState.position,
                        currentState.direction,
                        currentState.right,
                        currentState.up,
                        currentState.thickness * 3, // Leaf size relative to branch thickness (smaller for spheres)
                        currentState.depth,
                        leafRGBA,
                    );
                    break;
                }
                case "+": {
                    // Turn right
                    const variedAngle = this.getVariedAngle();
                    currentState.direction = normalize(
                        rotateVector(
                            currentState.direction,
                            currentState.up,
                            variedAngle,
                        ),
                    );
                    currentState.right = normalize(
                        cross(currentState.direction, currentState.up),
                    );
                    break;
                }
                case "-": {
                    // Turn left
                    const variedAngle = this.getVariedAngle();
                    currentState.direction = normalize(
                        rotateVector(
                            currentState.direction,
                            currentState.up,
                            -variedAngle,
                        ),
                    );
                    currentState.right = normalize(
                        cross(currentState.direction, currentState.up),
                    );
                    break;
                }
                case "&": {
                    // Pitch down
                    const variedAngle = this.getVariedAngle();
                    currentState.direction = normalize(
                        rotateVector(
                            currentState.direction,
                            currentState.right,
                            variedAngle,
                        ),
                    );
                    currentState.up = normalize(
                        cross(currentState.right, currentState.direction),
                    );
                    break;
                }
                case "^": {
                    // Pitch up
                    const variedAngle = this.getVariedAngle();
                    currentState.direction = normalize(
                        rotateVector(
                            currentState.direction,
                            currentState.right,
                            -variedAngle,
                        ),
                    );
                    currentState.up = normalize(
                        cross(currentState.right, currentState.direction),
                    );
                    break;
                }
                case "\\": {
                    // Roll left
                    const variedAngle = this.getVariedAngle();
                    currentState.up = normalize(
                        rotateVector(
                            currentState.up,
                            currentState.direction,
                            variedAngle,
                        ),
                    );
                    currentState.right = normalize(
                        cross(currentState.direction, currentState.up),
                    );
                    break;
                }
                case "/": {
                    // Roll right
                    const variedAngle = this.getVariedAngle();
                    currentState.up = normalize(
                        rotateVector(
                            currentState.up,
                            currentState.direction,
                            -variedAngle,
                        ),
                    );
                    currentState.right = normalize(
                        cross(currentState.direction, currentState.up),
                    );
                    break;
                }
                case "|": // Turn around
                    currentState.direction = [
                        -currentState.direction[0],
                        -currentState.direction[1],
                        -currentState.direction[2],
                    ];
                    break;
                case "[": // Push state
                    stateStack.push({ ...currentState });
                    currentState.depth++;
                    currentState.thickness *= tapering;
                    currentState.generation++;
                    break;
                case "]": // Pop state
                    if (stateStack.length > 0) {
                        currentState = stateStack.pop()!;
                    }
                    break;
            }
        }

        return {
            vertices,
            normals,
            uvs,
            depths,
            heights,
            indices,
            leafVertices,
            leafNormals,
            leafUvs,
            leafIndices,
            colors,
            leafColors,
        };
    }

    public static parseRules(rulesText: string): LSystemRule[] {
        const rules: LSystemRule[] = [];
        const lines = rulesText.split("\n");

        for (const line of lines) {
            const trimmed = line.trim();
            if (
                trimmed &&
                trimmed.includes("->") &&
                !trimmed.startsWith("//")
            ) {
                const [from, to] = trimmed.split("->").map((s) => s.trim());
                if (from && to) {
                    rules.push({ from, to });
                }
            }
        }

        return rules;
    }
}
