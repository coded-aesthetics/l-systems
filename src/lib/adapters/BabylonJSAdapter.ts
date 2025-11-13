/**
 * Babylon.js Adapter for L-Systems Library
 * Provides easy integration between L-Systems and Babylon.js
 */

import {
    LSystemsLibrary,
    LSystemConfig,
    TreeGeometry,
    GeometryParameters,
} from "../LSystemsLibrary.js";

// Use global BABYLON object loaded from CDN
declare const BABYLON: any;

export interface BabylonJSAdapterOptions {
    materialType?: "pbr" | "standard" | "basic";
    castShadow?: boolean;
    receiveShadow?: boolean;
    transparent?: boolean;
    opacity?: number;
    roughness?: number;
    metalness?: number;
    specularPower?: number;
    emissiveColor?: any;
    usePBRTextures?: boolean;
}

export interface BabylonMeshGroup {
    branches?: any;
    leaves?: any;
    group: any;
    boundingBox: any;
    stats: {
        branchVertices: number;
        leafVertices: number;
        branchTriangles: number;
        leafTriangles: number;
        totalVertices: number;
        totalTriangles: number;
    };
}

export class BabylonJSAdapter {
    private static readonly DEFAULT_OPTIONS: Required<BabylonJSAdapterOptions> =
        {
            materialType: "pbr",
            castShadow: true,
            receiveShadow: true,
            transparent: false,
            opacity: 1.0,
            roughness: 0.7,
            metalness: 0.1,
            specularPower: 64,
            emissiveColor: null,
            usePBRTextures: false,
        };

    /**
     * Create a Babylon.js mesh group from L-System configuration
     */
    static createMeshFromLSystem(
        config: LSystemConfig,
        geometryParams: GeometryParameters = {},
        options: BabylonJSAdapterOptions = {},
        scene: any,
    ): BabylonMeshGroup {
        // Generate tree geometry using the library
        const treeGeometry = LSystemsLibrary.generateTree(
            config,
            geometryParams,
        );

        return this.createMeshFromTreeGeometry(treeGeometry, options, scene);
    }

    /**
     * Create a Babylon.js mesh group from tree geometry data
     */
    static createMeshFromTreeGeometry(
        treeGeometry: TreeGeometry,
        options: BabylonJSAdapterOptions = {},
        scene: any,
    ): BabylonMeshGroup {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        const group = new BABYLON.TransformNode("lsystem-group", scene);

        let branchMesh: any | undefined;
        let leafMesh: any | undefined;

        const stats = {
            branchVertices: 0,
            leafVertices: 0,
            branchTriangles: 0,
            leafTriangles: 0,
            totalVertices: 0,
            totalTriangles: 0,
        };

        // Create branch mesh
        if (
            treeGeometry.branches.vertices &&
            treeGeometry.branches.vertices.length > 0
        ) {
            const branchGeometry = this.createMeshFromVertexData(
                "branches",
                treeGeometry.branches.vertices,
                treeGeometry.branches.normals,
                treeGeometry.branches.uvs,
                treeGeometry.branches.indices,
                treeGeometry.branches.colors,
                scene,
            );

            const branchMaterial = this.createMaterial(
                "branchMaterial",
                opts,
                scene,
            );
            branchGeometry.material = branchMaterial;

            if (opts.castShadow) {
                branchGeometry.receiveShadows = true;
            }
            if (opts.receiveShadow) {
                branchGeometry.receiveShadows = true;
            }

            branchGeometry.parent = group;
            branchMesh = branchGeometry;

            stats.branchVertices = treeGeometry.statistics.branchVertices;
            stats.branchTriangles = treeGeometry.branches.indices.length / 3;
        }

        // Create leaf mesh
        if (
            treeGeometry.leaves.vertices &&
            treeGeometry.leaves.vertices.length > 0
        ) {
            const leafGeometry = this.createMeshFromVertexData(
                "leaves",
                treeGeometry.leaves.vertices,
                treeGeometry.leaves.normals,
                treeGeometry.leaves.uvs,
                treeGeometry.leaves.indices,
                treeGeometry.leaves.colors,
                scene,
            );

            const leafMaterial = this.createMaterial(
                "leafMaterial",
                opts,
                scene,
            );
            leafGeometry.material = leafMaterial;

            if (opts.castShadow) {
                leafGeometry.receiveShadows = true;
            }
            if (opts.receiveShadow) {
                leafGeometry.receiveShadows = true;
            }

            leafGeometry.parent = group;
            leafMesh = leafGeometry;

            stats.leafVertices = treeGeometry.statistics.leafVertices;
            stats.leafTriangles = treeGeometry.leaves.indices.length / 3;
        }

        // Calculate bounding box
        const boundingBox = this.calculateBoundingBox(branchMesh, leafMesh);

        // Update total stats
        stats.totalVertices = stats.branchVertices + stats.leafVertices;
        stats.totalTriangles = stats.branchTriangles + stats.leafTriangles;

        console.log("L-Systems Tree Generated:", {
            branches: branchMesh ? "✓" : "✗",
            leaves: leafMesh ? "✓" : "✗",
            totalVertices: stats.totalVertices,
            totalTriangles: stats.totalTriangles,
        });

        return {
            branches: branchMesh,
            leaves: leafMesh,
            group,
            boundingBox,
            stats,
        };
    }

    /**
     * Create a Babylon.js mesh from vertex data
     */
    private static createMeshFromVertexData(
        name: string,
        vertices: Float32Array,
        normals: Float32Array,
        uvs: Float32Array,
        indices: Uint16Array | Uint32Array,
        colors: Float32Array,
        scene: any,
    ): any {
        const mesh = new BABYLON.Mesh(name, scene);

        // Create vertex data
        const vertexData = new BABYLON.VertexData();

        // Set positions
        vertexData.positions = Array.from(vertices);

        // Set normals
        if (normals && normals.length > 0) {
            vertexData.normals = Array.from(normals);
        }

        // Set UVs
        if (uvs && uvs.length > 0) {
            vertexData.uvs = Array.from(uvs);
        }

        // Set colors (convert from Float32Array to regular array)
        if (colors && colors.length > 0) {
            vertexData.colors = Array.from(colors);
        }

        // Handle 32-bit indices if needed
        const engine = scene.getEngine();
        const supports32BitIndices = engine.getCaps().uintIndices;

        if (indices.length > 0) {
            if (indices instanceof Uint32Array && !supports32BitIndices) {
                console.warn(
                    "32-bit indices not supported, clamping to 16-bit",
                );
                const clampedIndices = new Uint16Array(indices.length);
                for (let i = 0; i < indices.length; i++) {
                    clampedIndices[i] = Math.min(indices[i], 65535);
                }
                vertexData.indices = Array.from(clampedIndices);
            } else {
                vertexData.indices = Array.from(indices);
            }
        }

        // Apply vertex data to mesh
        vertexData.applyToMesh(mesh);

        return mesh;
    }

    /**
     * Create material based on options
     */
    private static createMaterial(
        name: string,
        options: BabylonJSAdapterOptions,
        scene: any,
    ): any {
        // Always use vertex colors and set material color to white to avoid color multiplication
        const materialColor = BABYLON.Color3.White();

        switch (options.materialType) {
            case "pbr":
                const pbrMaterial = new BABYLON.PBRMaterial(name, scene);
                pbrMaterial.albedoColor = materialColor;
                pbrMaterial.roughness = options.roughness || 0.7;
                pbrMaterial.metallic = options.metalness || 0.1;
                pbrMaterial.backFaceCulling = false;
                pbrMaterial.useVertexColors = true;
                if (options.transparent) {
                    pbrMaterial.alpha = options.opacity || 1.0;
                }
                if (options.emissiveColor) {
                    pbrMaterial.emissiveColor = options.emissiveColor;
                }
                return pbrMaterial;

            case "standard":
                const standardMaterial = new BABYLON.StandardMaterial(
                    name,
                    scene,
                );
                standardMaterial.diffuseColor = materialColor;
                standardMaterial.specularPower = options.specularPower || 64;
                standardMaterial.backFaceCulling = false;
                standardMaterial.useVertexColors = true;
                if (options.transparent) {
                    standardMaterial.alpha = options.opacity || 1.0;
                }
                if (options.emissiveColor) {
                    standardMaterial.emissiveColor = options.emissiveColor;
                }
                return standardMaterial;

            case "basic":
            default:
                const basicMaterial = new BABYLON.StandardMaterial(name, scene);
                basicMaterial.diffuseColor = materialColor;
                basicMaterial.disableLighting = true;
                basicMaterial.backFaceCulling = false;
                basicMaterial.useVertexColors = true;
                if (options.transparent) {
                    basicMaterial.alpha = options.opacity || 1.0;
                }
                return basicMaterial;
        }
    }

    /**
     * Update materials of existing mesh group
     */
    static updateMaterials(
        meshGroup: BabylonMeshGroup,
        options: BabylonJSAdapterOptions,
        scene: any,
    ): void {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };

        if (meshGroup.branches) {
            const branchMaterial = this.createMaterial(
                "branch-material-updated",
                opts,
                scene,
            );
            meshGroup.branches.material = branchMaterial;
        }

        if (meshGroup.leaves) {
            const leafMaterial = this.createMaterial(
                "leaf-material-updated",
                opts,
                scene,
            );
            meshGroup.leaves.material = leafMaterial;
        }
    }

    /**
     * Fit camera to view the mesh group
     */
    static fitCameraToMesh(
        meshGroup: BabylonMeshGroup,
        camera: any,
        paddingFactor: number = 1.2,
    ): void {
        const boundingBox = meshGroup.boundingBox;
        const size = boundingBox.maximum.subtract(boundingBox.minimum);
        const center = boundingBox.center;

        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = (maxDim * paddingFactor) / Math.tan(camera.fov / 2);

        camera.setTarget(center);
        camera.radius = distance;
        camera.beta = Math.PI / 3; // 60 degrees
        camera.alpha = Math.PI / 4; // 45 degrees
    }

    /**
     * Export mesh group to OBJ format
     */
    static exportToOBJ(meshGroup: BabylonMeshGroup): string {
        let objContent = "# L-Systems Tree Export\n";
        let vertexOffset = 0;

        const exportMesh = (mesh: any, name: string) => {
            if (!mesh.geometry) return;

            objContent += `\n# ${name}\n`;
            objContent += `o ${name}\n`;

            const positions = mesh.getVerticesData(
                BABYLON.VertexBuffer.PositionKind,
            );
            const normals = mesh.getVerticesData(
                BABYLON.VertexBuffer.NormalKind,
            );
            const uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);

            if (positions) {
                for (let i = 0; i < positions.length; i += 3) {
                    objContent += `v ${positions[i]} ${positions[i + 1]} ${positions[i + 2]}\n`;
                }
            }

            if (normals) {
                for (let i = 0; i < normals.length; i += 3) {
                    objContent += `vn ${normals[i]} ${normals[i + 1]} ${normals[i + 2]}\n`;
                }
            }

            if (uvs) {
                for (let i = 0; i < uvs.length; i += 2) {
                    objContent += `vt ${uvs[i]} ${uvs[i + 1]}\n`;
                }
            }

            const indices = mesh.getIndices();
            if (indices) {
                for (let i = 0; i < indices.length; i += 3) {
                    const v1 = indices[i] + 1 + vertexOffset;
                    const v2 = indices[i + 1] + 1 + vertexOffset;
                    const v3 = indices[i + 2] + 1 + vertexOffset;

                    if (normals && uvs) {
                        objContent += `f ${v1}/${v1}/${v1} ${v2}/${v2}/${v2} ${v3}/${v3}/${v3}\n`;
                    } else if (uvs) {
                        objContent += `f ${v1}/${v1} ${v2}/${v2} ${v3}/${v3}\n`;
                    } else if (normals) {
                        objContent += `f ${v1}//${v1} ${v2}//${v2} ${v3}//${v3}\n`;
                    } else {
                        objContent += `f ${v1} ${v2} ${v3}\n`;
                    }
                }

                if (positions) {
                    vertexOffset += positions.length / 3;
                }
            }
        };

        if (meshGroup.branches) {
            exportMesh(meshGroup.branches, "branches");
        }

        if (meshGroup.leaves) {
            exportMesh(meshGroup.leaves, "leaves");
        }

        return objContent;
    }

    /**
     * Create mesh group from preset configuration
     */
    static createFromPreset(
        presetName: "tree" | "fern" | "bush" | "dragon",
        scene: any,
        options: BabylonJSAdapterOptions = {},
    ): BabylonMeshGroup {
        const presets = {
            tree: {
                axiom: "F",
                rules: "F -> F[+F]F[-F]F",
                angle: 25,
                iterations: 4,
            },
            fern: {
                axiom: "X",
                rules: "X -> F+[[X]-X]-F[-FX]+X, F -> FF",
                angle: 25,
                iterations: 5,
            },
            bush: {
                axiom: "F",
                rules: "F -> F[+F]F[-F][F]",
                angle: 20,
                iterations: 4,
            },
            dragon: {
                axiom: "FX",
                rules: "X -> X+YF+, Y -> -FX-Y",
                angle: 90,
                iterations: 10,
            },
        };

        const preset = presets[presetName];
        if (!preset) {
            throw new Error(`Unknown preset: ${presetName}`);
        }

        const geometryParams: GeometryParameters = {
            length: 1.0,
            thickness: 0.05,
            tapering: 0.8,
            leafColor: [0.2, 0.8, 0.2],
        };

        return this.createMeshFromLSystem(
            preset,
            geometryParams,
            options,
            scene,
        );
    }

    /**
     * Dispose of mesh group and free resources
     */
    static dispose(meshGroup: BabylonMeshGroup): void {
        if (meshGroup.branches) {
            meshGroup.branches.dispose();
        }
        if (meshGroup.leaves) {
            meshGroup.leaves.dispose();
        }
        meshGroup.group.dispose();

        console.log("L-Systems mesh group disposed");
    }

    /**
     * Calculate bounding box for the mesh group
     */
    private static calculateBoundingBox(branchMesh?: any, leafMesh?: any): any {
        let min = new BABYLON.Vector3(0, 0, 0);
        let max = new BABYLON.Vector3(0, 0, 0);

        if (branchMesh) {
            const branchBoundingInfo = branchMesh.getBoundingInfo();
            min = branchBoundingInfo.minimum.clone();
            max = branchBoundingInfo.maximum.clone();
        }

        if (leafMesh) {
            const leafBoundingInfo = leafMesh.getBoundingInfo();
            if (branchMesh) {
                min = BABYLON.Vector3.Minimize(min, leafBoundingInfo.minimum);
                max = BABYLON.Vector3.Maximize(max, leafBoundingInfo.maximum);
            } else {
                min = leafBoundingInfo.minimum.clone();
                max = leafBoundingInfo.maximum.clone();
            }
        }

        return new BABYLON.BoundingBox(min, max);
    }
}
