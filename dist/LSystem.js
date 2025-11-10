export class LSystem {
    constructor(axiom, rules, angle = 25, angleVariation = 0) {
        this.axiom = axiom;
        this.rules = new Map();
        this.angle = (angle * Math.PI) / 180; // Convert to radians
        this.angleVariation = (angleVariation * Math.PI) / 180; // Convert to radians
        this.iterations = 0;
        rules.forEach((rule) => {
            this.rules.set(rule.from, rule.to);
        });
    }
    setAngle(angle) {
        this.angle = (angle * Math.PI) / 180;
    }
    setAngleVariation(variation) {
        this.angleVariation = (variation * Math.PI) / 180;
    }
    getVariedAngle() {
        if (this.angleVariation === 0) {
            return this.angle;
        }
        // Generate random variation between -angleVariation and +angleVariation
        const variation = (Math.random() * 2 - 1) * this.angleVariation;
        return this.angle + variation;
    }
    generate(iterations) {
        let current = this.axiom;
        this.iterations = iterations;
        for (let i = 0; i < iterations; i++) {
            current = this.iterate(current);
        }
        return current;
    }
    iterate(input) {
        let result = "";
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            const rule = this.rules.get(char);
            result += rule !== undefined ? rule : char;
        }
        return result;
    }
    interpretToGeometry(lSystemString, initialLength = 1.0, initialThickness = 0.1, tapering = 0.8) {
        const vertices = [];
        const normals = [];
        const uvs = [];
        const depths = [];
        const heights = [];
        const indices = [];
        const stateStack = [];
        let currentState = {
            position: [0, 0, 0],
            direction: [0, 1, 0], // Up
            up: [0, 0, 1], // Forward
            right: [1, 0, 0], // Right
            length: initialLength,
            thickness: initialThickness,
            depth: 0,
        };
        let vertexCount = 0;
        const segments = 8; // Number of segments around cylinder
        // Helper functions for vector operations
        const normalize = (v) => {
            const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
            return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
        };
        const cross = (a, b) => {
            return [
                a[1] * b[2] - a[2] * b[1],
                a[2] * b[0] - a[0] * b[2],
                a[0] * b[1] - a[1] * b[0],
            ];
        };
        const rotateVector = (v, axis, angle) => {
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
        const addCylinder = (start, end, startThickness, endThickness, depth) => {
            const direction = normalize([
                end[0] - start[0],
                end[1] - start[1],
                end[2] - start[2],
            ]);
            const up = Math.abs(direction[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
            const right = normalize(cross(direction, up));
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
                    vertices.push(pos[0] + localX * thickness, pos[1] + localY * thickness, pos[2] + localZ * thickness);
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
        // Process L-system string
        for (let i = 0; i < lSystemString.length; i++) {
            const char = lSystemString[i];
            switch (char) {
                case "F": // Forward draw
                case "f": { // Forward move (no draw)
                    const startPos = [
                        ...currentState.position,
                    ];
                    const endPos = [
                        currentState.position[0] +
                            currentState.direction[0] * currentState.length,
                        currentState.position[1] +
                            currentState.direction[1] * currentState.length,
                        currentState.position[2] +
                            currentState.direction[2] * currentState.length,
                    ];
                    if (char === "F") {
                        const endThickness = currentState.thickness * tapering;
                        addCylinder(startPos, endPos, currentState.thickness, endThickness, currentState.depth);
                    }
                    currentState.position = endPos;
                    currentState.length *= 0.95; // Slight length reduction
                    break;
                }
                case "+": { // Turn right
                    const variedAngle = this.getVariedAngle();
                    currentState.direction = normalize(rotateVector(currentState.direction, currentState.up, variedAngle));
                    currentState.right = normalize(cross(currentState.direction, currentState.up));
                    break;
                }
                case "-": { // Turn left
                    const variedAngle = this.getVariedAngle();
                    currentState.direction = normalize(rotateVector(currentState.direction, currentState.up, -variedAngle));
                    currentState.right = normalize(cross(currentState.direction, currentState.up));
                    break;
                }
                case "&": { // Pitch down
                    const variedAngle = this.getVariedAngle();
                    currentState.direction = normalize(rotateVector(currentState.direction, currentState.right, variedAngle));
                    currentState.up = normalize(cross(currentState.right, currentState.direction));
                    break;
                }
                case "^": { // Pitch up
                    const variedAngle = this.getVariedAngle();
                    currentState.direction = normalize(rotateVector(currentState.direction, currentState.right, -variedAngle));
                    currentState.up = normalize(cross(currentState.right, currentState.direction));
                    break;
                }
                case "\\": { // Roll left
                    const variedAngle = this.getVariedAngle();
                    currentState.up = normalize(rotateVector(currentState.up, currentState.direction, variedAngle));
                    currentState.right = normalize(cross(currentState.direction, currentState.up));
                    break;
                }
                case "/": { // Roll right
                    const variedAngle = this.getVariedAngle();
                    currentState.up = normalize(rotateVector(currentState.up, currentState.direction, -variedAngle));
                    currentState.right = normalize(cross(currentState.direction, currentState.up));
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
                    break;
                case "]": // Pop state
                    if (stateStack.length > 0) {
                        currentState = stateStack.pop();
                    }
                    break;
            }
        }
        return { vertices, normals, uvs, depths, heights, indices };
    }
    static parseRules(rulesText) {
        const rules = [];
        const lines = rulesText.split("\n");
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && trimmed.includes("->")) {
                const [from, to] = trimmed.split("->").map((s) => s.trim());
                if (from && to) {
                    rules.push({ from, to });
                }
            }
        }
        return rules;
    }
}
//# sourceMappingURL=LSystem.js.map