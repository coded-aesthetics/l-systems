/**
 * Math utilities for the forest generator
 * Provides mathematical helper functions, random distribution, and positioning algorithms
 */

import * as THREE from "three";

export class MathUtils {
    /**
     * Generate random positions with minimum distance constraint
     * Uses Poisson disk sampling for natural distribution
     */
    static generatePoissonPositions(
        count: number,
        size: number,
        minDistance: number,
        maxAttempts: number = 30,
    ): THREE.Vector3[] {
        const positions = [];
        const cellSize = minDistance / Math.sqrt(2);
        const gridWidth = Math.ceil(size / cellSize);
        const gridHeight = Math.ceil(size / cellSize);
        const grid = new Array(gridWidth * gridHeight).fill(null);
        const activeList = [];

        // Helper function to get grid index
        const getGridIndex = (x: number, z: number): number => {
            const gridX = Math.floor((x + size / 2) / cellSize);
            const gridZ = Math.floor((z + size / 2) / cellSize);
            if (
                gridX < 0 ||
                gridX >= gridWidth ||
                gridZ < 0 ||
                gridZ >= gridHeight
            ) {
                return -1;
            }
            return gridZ * gridWidth + gridX;
        };

        // Helper function to check if position is valid
        const isValidPosition = (x: number, z: number): boolean => {
            if (Math.abs(x) > size / 2 || Math.abs(z) > size / 2) return false;

            const gridX = Math.floor((x + size / 2) / cellSize);
            const gridZ = Math.floor((z + size / 2) / cellSize);

            // Check surrounding cells
            for (let dz = -2; dz <= 2; dz++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const checkX = gridX + dx;
                    const checkZ = gridZ + dz;
                    if (
                        checkX >= 0 &&
                        checkX < gridWidth &&
                        checkZ >= 0 &&
                        checkZ < gridHeight
                    ) {
                        const index = checkZ * gridWidth + checkX;
                        const existing = grid[index];
                        if (existing) {
                            const dist = Math.sqrt(
                                (x - existing.x) ** 2 + (z - existing.z) ** 2,
                            );
                            if (dist < minDistance) return false;
                        }
                    }
                }
            }
            return true;
        };

        // Start with a random point
        const firstX = (Math.random() - 0.5) * size * 0.8;
        const firstZ = (Math.random() - 0.5) * size * 0.8;
        const firstPos = new THREE.Vector3(firstX, 0, firstZ);
        positions.push(firstPos);
        activeList.push(firstPos);
        grid[getGridIndex(firstX, firstZ)] = { x: firstX, z: firstZ };

        while (activeList.length > 0 && positions.length < count) {
            const randomIndex = Math.floor(Math.random() * activeList.length);
            const current = activeList[randomIndex];
            let found = false;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = minDistance + Math.random() * minDistance;
                const newX = current.x + Math.cos(angle) * distance;
                const newZ = current.z + Math.sin(angle) * distance;

                if (isValidPosition(newX, newZ)) {
                    const newPos = new THREE.Vector3(newX, 0, newZ);
                    positions.push(newPos);
                    activeList.push(newPos);
                    grid[getGridIndex(newX, newZ)] = { x: newX, z: newZ };
                    found = true;
                    break;
                }
            }

            if (!found) {
                activeList.splice(randomIndex, 1);
            }
        }

        return positions.slice(0, count);
    }

    /**
     * Generate random positions with simple minimum distance check
     * Faster but less natural than Poisson sampling
     */
    static generateRandomPositions(
        count: number,
        size: number,
        minDistance: number,
    ): THREE.Vector3[] {
        const positions = [];
        const maxAttempts = count * 10;
        let attempts = 0;

        while (positions.length < count && attempts < maxAttempts) {
            const x = (Math.random() - 0.5) * size;
            const z = (Math.random() - 0.5) * size;
            const newPos = new THREE.Vector3(x, 0, z);

            let validPosition = true;
            for (const existingPos of positions) {
                if (newPos.distanceTo(existingPos) < minDistance) {
                    validPosition = false;
                    break;
                }
            }

            if (validPosition) {
                positions.push(newPos);
            }

            attempts++;
        }

        return positions;
    }

    /**
     * Generate positions in a grid pattern with some randomization
     */
    static generateGridPositions(
        count: number,
        size: number,
        minDistance: number,
        randomization: number = 0.3,
    ): THREE.Vector3[] {
        const positions = [];
        const spacing = Math.max(minDistance * 1.5, size / Math.sqrt(count));
        const gridSize = Math.floor(size / spacing);
        const startOffset = -size / 2 + spacing / 2;

        for (let x = 0; x < gridSize && positions.length < count; x++) {
            for (let z = 0; z < gridSize && positions.length < count; z++) {
                const baseX = startOffset + x * spacing;
                const baseZ = startOffset + z * spacing;

                // Add randomization
                const offsetX = (Math.random() - 0.5) * spacing * randomization;
                const offsetZ = (Math.random() - 0.5) * spacing * randomization;

                const finalX = baseX + offsetX;
                const finalZ = baseZ + offsetZ;

                positions.push(new THREE.Vector3(finalX, 0, finalZ));
            }
        }

        // Shuffle positions for more random selection
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        return positions.slice(0, count);
    }

    /**
     * Linear interpolation between two values
     */
    static lerp(a: number, b: number, t: number): number {
        return a + (b - a) * Math.max(0, Math.min(1, t));
    }

    /**
     * Smooth step interpolation (eased interpolation)
     */
    static smoothstep(edge0: number, edge1: number, x: number): number {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }

    /**
     * Clamp a value between min and max
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Map a value from one range to another
     */
    static map(
        value: number,
        inMin: number,
        inMax: number,
        outMin: number,
        outMax: number,
    ): number {
        return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
    }

    /**
     * Generate random float between min and max
     */
    static randomFloat(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }

    /**
     * Generate random integer between min and max (inclusive)
     */
    static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate random value from normal distribution (Box-Muller transform)
     */
    static randomNormal(mean: number = 0, stdDev: number = 1): number {
        let u = 0,
            v = 0;
        while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();

        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return z * stdDev + mean;
    }

    /**
     * Generate random point on unit sphere
     */
    static randomOnSphere(): THREE.Vector3 {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);

        return new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi),
        );
    }

    /**
     * Generate random point in unit circle
     */
    static randomInCircle(radius: number = 1): THREE.Vector2 {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * radius;
        return new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r);
    }

    /**
     * Calculate distance between two 2D points
     */
    static distance2D(x1: number, z1: number, x2: number, z2: number): number {
        const dx = x2 - x1;
        const dz = z2 - z1;
        return Math.sqrt(dx * dx + dz * dz);
    }

    /**
     * Calculate angle between two vectors
     */
    static angleBetween(v1: THREE.Vector3, v2: THREE.Vector3): number {
        const dot = v1.dot(v2);
        const mag1 = v1.length();
        const mag2 = v2.length();
        return Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))));
    }

    /**
     * Convert degrees to radians
     */
    static degToRad(degrees: number): number {
        return (degrees * Math.PI) / 180;
    }

    /**
     * Convert radians to degrees
     */
    static radToDeg(radians: number): number {
        return (radians * 180) / Math.PI;
    }

    /**
     * Noise function (simple pseudo-random noise)
     */
    static noise(x: number, y: number = 0, z: number = 0): number {
        const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
        return n - Math.floor(n);
    }

    /**
     * Simple 2D Perlin-like noise
     */
    static noise2D(x: number, y: number): number {
        const intX = Math.floor(x);
        const intY = Math.floor(y);
        const fracX = x - intX;
        const fracY = y - intY;

        const a = this.noise(intX, intY);
        const b = this.noise(intX + 1, intY);
        const c = this.noise(intX, intY + 1);
        const d = this.noise(intX + 1, intY + 1);

        const i1 = this.lerp(a, b, fracX);
        const i2 = this.lerp(c, d, fracX);

        return this.lerp(i1, i2, fracY);
    }

    /**
     * Generate fractal noise (multiple octaves)
     */
    static fractalNoise2D(
        x: number,
        y: number,
        octaves: number = 4,
        persistence: number = 0.5,
        scale: number = 1,
    ): number {
        let value = 0;
        let amplitude = 1;
        let frequency = scale;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            value += this.noise2D(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }

        return value / maxValue;
    }

    /**
     * Check if a point is inside a polygon (ray casting algorithm)
     */
    static pointInPolygon(
        point: THREE.Vector3,
        polygon: THREE.Vector3[],
    ): boolean {
        let inside = false;
        const x = point.x;
        const y = point.z;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x;
            const yi = polygon[i].z;
            const xj = polygon[j].x;
            const yj = polygon[j].z;

            if (
                yi > y !== yj > y &&
                x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
            ) {
                inside = !inside;
            }
        }

        return inside;
    }

    /**
     * Generate weighted random selection from array
     */
    static weightedRandom<T>(items: T[], weights: number[]): T {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }

        return items[items.length - 1];
    }

    /**
     * Calculate bounding box for array of positions
     */
    static calculateBoundingBox(positions: THREE.Vector3[]): THREE.Box3 {
        if (positions.length === 0) {
            return new THREE.Box3();
        }

        const box = new THREE.Box3();
        box.setFromPoints(positions);
        return box;
    }

    /**
     * Generate spiral positions (for interesting patterns)
     */
    static generateSpiralPositions(
        count: number,
        size: number,
        turns: number = 3,
    ): THREE.Vector3[] {
        const positions = [];
        const maxRadius = size / 2;

        for (let i = 0; i < count; i++) {
            const t = i / count;
            const angle = t * turns * 2 * Math.PI;
            const radius = t * maxRadius;

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            positions.push(new THREE.Vector3(x, 0, z));
        }

        return positions;
    }
}
