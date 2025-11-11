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
}

export interface LeafGeometry {
    vertices: number[];
    normals: number[];
    uvs: number[];
    indices: number[];
}

export class LSystem {
    private axiom: string;
    private rules: Map<string, string[]>;
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
        this.angle = (angle * Math.PI) / 180; // Convert to radians
        this.angleVariation = (angleVariation * Math.PI) / 180; // Convert to radians
        this.lengthVariation = lengthVariation / 100; // Convert percentage to decimal
        this.iterations = 0;
        this.leafProbability = leafProbability;
        this.leafGenerationThreshold = leafGenerationThreshold;

        // Group rules by symbol to support multiple rules per symbol
        rules.forEach((rule) => {
            if (!this.rules.has(rule.from)) {
                this.rules.set(rule.from, []);
            }
            this.rules.get(rule.from)!.push(rule.to);
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
        let result = "";

        for (let i = 0; i < input.length; i++) {
            const char = input[i];

            // Apply grammar rules - support multiple rules per symbol
            const ruleOptions = this.rules.get(char);
            if (ruleOptions !== undefined && ruleOptions.length > 0) {
                // If multiple rules exist for this symbol, choose one randomly
                const selectedRule =
                    ruleOptions[Math.floor(Math.random() * ruleOptions.length)];
                result += selectedRule;
            } else {
                // For characters without explicit rules, apply probabilistic leaf generation
                if (
                    char === "A" &&
                    iteration >= this.leafGenerationThreshold &&
                    Math.random() < this.leafProbability
                ) {
                    result += "L";
                } else {
                    result += char;
                }
            }
        }

        return result;
    }

    public interpretToGeometry(
        lSystemString: string,
        initialLength: number = 1.0,
        initialThickness: number = 0.1,
        tapering: number = 0.8,
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
    } {
        const vertices: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const depths: number[] = [];
        const heights: number[] = [];
        const indices: number[] = [];
        const leafVertices: number[] = [];
        const leafNormals: number[] = [];
        const leafUvs: number[] = [];
        const leafIndices: number[] = [];

        const stateStack: LSystemState[] = [];
        let currentState: LSystemState = {
            position: [0, 0, 0],
            direction: [0, 1, 0], // Up
            up: [0, 0, 1], // Forward
            right: [1, 0, 0], // Right
            length: initialLength,
            thickness: initialThickness,
            depth: 0,
            generation: 0,
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
            start: [number, number, number],
            end: [number, number, number],
            startThickness: number,
            endThickness: number,
            depth: number,
        ) => {
            const direction = normalize([
                end[0] - start[0],
                end[1] - start[1],
                end[2] - start[2],
            ]);
            const up = Math.abs(direction[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
            const right = normalize(
                cross(direction, up as [number, number, number]),
            );
            const forward = cross(right, direction);

            const startVertexCount = vertexCount;

            // Create vertices for start and end circles
            for (let ring = 0; ring < 2; ring++) {
                const pos = ring === 0 ? start : end;
                const thickness = ring === 0 ? startThickness : endThickness;
                const height = ring === 0 ? start[1] : end[1];

                for (let i = 0; i < segments; i++) {
                    const angle = (i / segments) * 2 * Math.PI;
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
                    uvs.push(i / segments, ring);
                    depths.push(depth);
                    heights.push(height);
                    vertexCount++;
                }
            }

            // Create indices for cylinder
            for (let i = 0; i < segments; i++) {
                const next = (i + 1) % segments;

                const v0 = startVertexCount + i;
                const v1 = startVertexCount + next;
                const v2 = startVertexCount + segments + i;
                const v3 = startVertexCount + segments + next;

                // Two triangles per quad
                indices.push(v0, v2, v1);
                indices.push(v1, v2, v3);
            }
        };

        const addLeaf = (
            position: [number, number, number],
            direction: [number, number, number],
            right: [number, number, number],
            up: [number, number, number],
            size: number,
            depth: number,
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

        // Process L-system string
        for (let i = 0; i < lSystemString.length; i++) {
            const char = lSystemString[i];

            switch (char) {
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

                    if (char === "F") {
                        const endThickness = currentState.thickness * tapering;
                        addCylinder(
                            startPos,
                            endPos,
                            currentState.thickness,
                            endThickness,
                            currentState.depth,
                        );
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
                    addLeaf(
                        currentState.position,
                        currentState.direction,
                        currentState.right,
                        currentState.up,
                        currentState.thickness * 3, // Leaf size relative to branch thickness (smaller for spheres)
                        currentState.depth,
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
