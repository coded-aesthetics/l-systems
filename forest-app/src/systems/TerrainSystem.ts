import * as THREE from "three";

interface TerrainConfig {
    size: number;
    segments: number;
    heightVariation: number;
    color: number;
    level: number;
    textureRepeat?: number;
}

interface TerrainStats {
    size: number;
    segments: number;
    triangles: number;
    heightVariation: number;
    terrainType: string;
}

export enum TerrainType {
    FLAT = "flat",
    HILLY = "hilly",
    MOUNTAINOUS = "mountainous",
    ROLLING = "rolling"
}

export class TerrainSystem {
    private scene: THREE.Scene;
    private terrain: THREE.Mesh | null;
    private config: TerrainConfig;
    private heightMap: Float32Array | null;
    private raycaster: THREE.Raycaster;
    private tempVector: THREE.Vector3;

    // Terrain variations
    private terrainType: TerrainType;
    private noiseScale: number;
    private octaves: number;
    private persistence: number;
    private lacunarity: number;

    constructor(scene: THREE.Scene, config?: Partial<TerrainConfig>) {
        this.scene = scene;
        this.terrain = null;
        this.heightMap = null;
        this.raycaster = new THREE.Raycaster();
        this.tempVector = new THREE.Vector3();

        // Default configuration
        this.config = {
            size: 2000,
            segments: 100,
            heightVariation: 2,
            color: 0x228b22,
            level: -2,
            textureRepeat: 50,
            ...config
        };

        // Terrain generation parameters
        this.terrainType = TerrainType.ROLLING;
        this.noiseScale = 0.02;
        this.octaves = 4;
        this.persistence = 0.5;
        this.lacunarity = 2.0;
    }

    public init(): void {
        this.createTerrain();
        console.log("TerrainSystem initialized");
    }

    private createTerrain(): void {
        // Create geometry with specified segments
        const geometry = new THREE.PlaneGeometry(
            this.config.size,
            this.config.size,
            this.config.segments,
            this.config.segments
        );

        // Generate height variations
        this.generateHeightMap(geometry);

        // Create material
        const material = this.createTerrainMaterial();

        // Create mesh
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.position.y = this.config.level;
        this.terrain.receiveShadow = true;
        this.terrain.name = "terrain";

        // Add to scene
        this.scene.add(this.terrain);

        console.log(`Terrain created: ${this.config.size}x${this.config.size}, ${this.config.segments} segments`);
    }

    private generateHeightMap(geometry: THREE.PlaneGeometry): void {
        const positionAttribute = geometry.getAttribute("position");
        const vertexCount = positionAttribute.count;

        // Initialize height map
        this.heightMap = new Float32Array(vertexCount);

        // Generate heights based on terrain type
        for (let i = 0; i < vertexCount; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);

            // Normalize coordinates to [0, 1] range
            const normalizedX = (x + this.config.size / 2) / this.config.size;
            const normalizedY = (y + this.config.size / 2) / this.config.size;

            // Generate height based on terrain type
            let height = this.generateHeightAtPosition(normalizedX, normalizedY);

            // Apply height variation multiplier
            height *= this.config.heightVariation;

            // Store in height map
            this.heightMap[i] = height;

            // Update vertex position (Z becomes height after rotation)
            positionAttribute.setZ(i, height);
        }

        // Update geometry
        positionAttribute.needsUpdate = true;
        geometry.computeVertexNormals();
    }

    private generateHeightAtPosition(x: number, y: number): number {
        switch (this.terrainType) {
            case TerrainType.FLAT:
                return this.generateFlatTerrain(x, y);
            case TerrainType.HILLY:
                return this.generateHillyTerrain(x, y);
            case TerrainType.MOUNTAINOUS:
                return this.generateMountainousTerrain(x, y);
            case TerrainType.ROLLING:
            default:
                return this.generateRollingTerrain(x, y);
        }
    }

    private generateFlatTerrain(x: number, y: number): number {
        // Very subtle random variation for flat terrain
        return (Math.random() - 0.5) * 0.1;
    }

    private generateRollingTerrain(x: number, y: number): number {
        // Gentle rolling hills using multiple octaves of noise
        let height = 0;
        let amplitude = 1;
        let frequency = this.noiseScale;

        for (let i = 0; i < this.octaves; i++) {
            height += this.simpleNoise(x * frequency, y * frequency) * amplitude;
            amplitude *= this.persistence;
            frequency *= this.lacunarity;
        }

        return height;
    }

    private generateHillyTerrain(x: number, y: number): number {
        // More pronounced hills with sharper features
        let height = 0;
        let amplitude = 1;
        let frequency = this.noiseScale * 1.5;

        for (let i = 0; i < this.octaves; i++) {
            const noiseValue = this.simpleNoise(x * frequency, y * frequency);
            height += Math.abs(noiseValue) * amplitude; // Use abs for sharper peaks
            amplitude *= this.persistence;
            frequency *= this.lacunarity;
        }

        return height * 1.5;
    }

    private generateMountainousTerrain(x: number, y: number): number {
        // Dramatic mountainous terrain with high variation
        let height = 0;
        let amplitude = 1;
        let frequency = this.noiseScale * 0.8;

        for (let i = 0; i < this.octaves + 2; i++) {
            const noiseValue = this.simpleNoise(x * frequency, y * frequency);
            height += Math.pow(Math.abs(noiseValue), 1.5) * amplitude;
            amplitude *= this.persistence;
            frequency *= this.lacunarity;
        }

        return height * 3;
    }

    private simpleNoise(x: number, y: number): number {
        // Simple pseudo-random noise function
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1; // Return value between -1 and 1
    }

    private createTerrainMaterial(): THREE.Material {
        // Create basic material with grass color
        const material = new THREE.MeshLambertMaterial({
            color: this.config.color,
        });

        return material;
    }

    public getGroundHeight(x: number, z: number): number {
        if (!this.terrain) {
            return this.config.level;
        }

        // Use raycasting to get precise height at position
        const origin = new THREE.Vector3(x, 100, z);
        const direction = new THREE.Vector3(0, -1, 0);

        this.raycaster.set(origin, direction);
        const intersects = this.raycaster.intersectObject(this.terrain);

        if (intersects.length > 0) {
            return intersects[0].point.y;
        }

        // Fallback to base level
        return this.config.level;
    }

    public getHeightAtPosition(x: number, z: number): number {
        // Alternative method using direct height map lookup
        if (!this.heightMap || !this.terrain) {
            return this.config.level;
        }

        // Convert world coordinates to normalized coordinates
        const normalizedX = (x + this.config.size / 2) / this.config.size;
        const normalizedZ = (z + this.config.size / 2) / this.config.size;

        // Clamp to terrain bounds
        if (normalizedX < 0 || normalizedX > 1 || normalizedZ < 0 || normalizedZ > 1) {
            return this.config.level;
        }

        // Calculate grid coordinates
        const gridX = Math.floor(normalizedX * this.config.segments);
        const gridZ = Math.floor(normalizedZ * this.config.segments);

        // Get height from height map (with bounds checking)
        const index = Math.min(gridZ * (this.config.segments + 1) + gridX, this.heightMap.length - 1);
        const height = this.heightMap[index] || 0;

        return this.config.level + height;
    }

    public setTerrainType(type: TerrainType): void {
        if (this.terrainType !== type) {
            this.terrainType = type;
            this.regenerateTerrain();
            console.log(`Terrain type changed to: ${type}`);
        }
    }

    public setHeightVariation(variation: number): void {
        this.config.heightVariation = Math.max(0, variation);
        this.regenerateTerrain();
        console.log(`Height variation set to: ${variation}`);
    }

    public setTerrainSize(size: number): void {
        this.config.size = Math.max(100, size);
        this.regenerateTerrain();
        console.log(`Terrain size set to: ${size}`);
    }

    public setSegments(segments: number): void {
        this.config.segments = Math.max(10, Math.min(200, segments));
        this.regenerateTerrain();
        console.log(`Terrain segments set to: ${segments}`);
    }

    public setTerrainColor(color: number): void {
        this.config.color = color;
        if (this.terrain && this.terrain.material) {
            (this.terrain.material as THREE.MeshLambertMaterial).color.setHex(color);
        }
        console.log(`Terrain color set to: #${color.toString(16).padStart(6, '0')}`);
    }

    public regenerateTerrain(): void {
        if (this.terrain) {
            // Dispose of existing terrain
            this.disposeTerrain();
        }

        // Create new terrain
        this.createTerrain();
        console.log("Terrain regenerated");
    }

    public isPositionOnTerrain(x: number, z: number): boolean {
        const halfSize = this.config.size / 2;
        return x >= -halfSize && x <= halfSize && z >= -halfSize && z <= halfSize;
    }

    public getTerrainBounds(): { min: THREE.Vector3; max: THREE.Vector3 } {
        const halfSize = this.config.size / 2;
        return {
            min: new THREE.Vector3(-halfSize, this.config.level, -halfSize),
            max: new THREE.Vector3(halfSize, this.config.level + this.config.heightVariation, halfSize)
        };
    }

    public getSafeSpawnPosition(): THREE.Vector3 {
        // Find a safe position for spawning objects on terrain
        const attempts = 10;
        const halfSize = this.config.size * 0.4; // Stay away from edges

        for (let i = 0; i < attempts; i++) {
            const x = (Math.random() - 0.5) * halfSize;
            const z = (Math.random() - 0.5) * halfSize;
            const height = this.getGroundHeight(x, z);

            // Check if position is reasonable (not too steep)
            if (height > this.config.level - 1 && height < this.config.level + this.config.heightVariation + 1) {
                return new THREE.Vector3(x, height, z);
            }
        }

        // Fallback to center if no good position found
        return new THREE.Vector3(0, this.getGroundHeight(0, 0), 0);
    }

    public getStats(): TerrainStats {
        const triangles = this.terrain ?
            (this.terrain.geometry as THREE.PlaneGeometry).parameters.widthSegments *
            (this.terrain.geometry as THREE.PlaneGeometry).parameters.heightSegments * 2 : 0;

        return {
            size: this.config.size,
            segments: this.config.segments,
            triangles,
            heightVariation: this.config.heightVariation,
            terrainType: this.terrainType
        };
    }

    public getTerrainMesh(): THREE.Mesh | null {
        return this.terrain;
    }

    public update(deltaTime: number): void {
        // Terrain system doesn't need regular updates currently
        // This method is here for consistency with other systems
        // and potential future features like animated terrain
    }

    private disposeTerrain(): void {
        if (this.terrain) {
            // Remove from scene
            this.scene.remove(this.terrain);

            // Dispose geometry and material
            this.terrain.geometry.dispose();
            if (Array.isArray(this.terrain.material)) {
                this.terrain.material.forEach(material => material.dispose());
            } else {
                this.terrain.material.dispose();
            }

            this.terrain = null;
        }

        // Clear height map
        this.heightMap = null;
    }

    public dispose(): void {
        this.disposeTerrain();
        console.log("TerrainSystem disposed");
    }
}
