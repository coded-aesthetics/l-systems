/**
 * Three.js Adapter for L-Systems Library
 * Provides easy integration between L-Systems and Three.js
 */

import * as THREE from "three";
import {
    LSystemsLibrary,
    LSystemConfig,
    TreeGeometry,
    GeometryParameters,
} from "../LSystemsLibrary.js";

export interface ThreeJSAdapterOptions {
    materialType?: "standard" | "phong" | "lambert" | "basic";
    branchColor?: string | number;
    leafColor?: string | number;
    castShadow?: boolean;
    receiveShadow?: boolean;
    transparent?: boolean;
    opacity?: number;
    roughness?: number;
    metalness?: number;
    shininess?: number;
}

export interface LSystemMeshGroup {
    branches?: THREE.Mesh;
    leaves?: THREE.Mesh;
    group: THREE.Group;
    boundingBox: THREE.Box3;
    stats: {
        branchVertices: number;
        leafVertices: number;
        branchTriangles: number;
        leafTriangles: number;
        totalVertices: number;
        totalTriangles: number;
    };
}

export class ThreeJSAdapter {
    private static readonly DEFAULT_OPTIONS: ThreeJSAdapterOptions = {
        materialType: "standard",
        branchColor: 0x4a4a4a,
        leafColor: 0x4caf50,
        castShadow: true,
        receiveShadow: true,
        transparent: false,
        opacity: 1.0,
        roughness: 0.7,
        metalness: 0.1,
        shininess: 30,
    };

    /**
     * Create a Three.js mesh group from L-System configuration
     */
    static createMeshFromLSystem(
        config: LSystemConfig,
        geometryParams: GeometryParameters = {},
        options: ThreeJSAdapterOptions = {},
    ): LSystemMeshGroup {
        // Generate tree geometry using the library
        const treeGeometry = LSystemsLibrary.generateTree(
            config,
            geometryParams,
        );

        return this.createMeshFromTreeGeometry(treeGeometry, options);
    }

    /**
     * Create a Three.js mesh group from tree geometry data
     */
    static createMeshFromTreeGeometry(
        treeGeometry: TreeGeometry,
        options: ThreeJSAdapterOptions = {},
    ): LSystemMeshGroup {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        const group = new THREE.Group();

        let branchMesh: THREE.Mesh | undefined;
        let leafMesh: THREE.Mesh | undefined;

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
            const branchGeometry = this.createBufferGeometry(
                treeGeometry.branches.vertices,
                treeGeometry.branches.normals,
                treeGeometry.branches.uvs,
                treeGeometry.branches.indices,
                treeGeometry.branches.colors,
            );

            const branchMaterial = this.createMaterial(opts, opts.branchColor!);
            branchMesh = new THREE.Mesh(branchGeometry, branchMaterial);

            branchMesh.castShadow = opts.castShadow!;
            branchMesh.receiveShadow = opts.receiveShadow!;
            branchMesh.name = "branches";

            group.add(branchMesh);

            stats.branchVertices = treeGeometry.statistics.branchVertices;
            stats.branchTriangles = treeGeometry.branches.indices.length / 3;
        }

        // Create leaf mesh
        if (
            treeGeometry.leaves.vertices &&
            treeGeometry.leaves.vertices.length > 0
        ) {
            const leafGeometry = this.createBufferGeometry(
                treeGeometry.leaves.vertices,
                treeGeometry.leaves.normals,
                treeGeometry.leaves.uvs,
                treeGeometry.leaves.indices,
                treeGeometry.leaves.colors,
            );

            const leafMaterial = this.createMaterial(opts, opts.leafColor!);
            leafMaterial.transparent = true;
            leafMaterial.opacity = 0.8;
            leafMaterial.side = THREE.DoubleSide;

            leafMesh = new THREE.Mesh(leafGeometry, leafMaterial);

            leafMesh.castShadow = opts.castShadow!;
            leafMesh.receiveShadow = opts.receiveShadow!;
            leafMesh.name = "leaves";

            group.add(leafMesh);

            stats.leafVertices = treeGeometry.statistics.leafVertices;
            stats.leafTriangles = treeGeometry.leaves.indices.length / 3;
        }

        // Calculate total stats
        stats.totalVertices = treeGeometry.statistics.totalVertices;
        stats.totalTriangles = stats.branchTriangles + stats.leafTriangles;

        // Calculate bounding box
        const boundingBox = new THREE.Box3();
        if (branchMesh) boundingBox.expandByObject(branchMesh);
        if (leafMesh) boundingBox.expandByObject(leafMesh);

        return {
            branches: branchMesh,
            leaves: leafMesh,
            group,
            boundingBox,
            stats,
        };
    }

    /**
     * Create a BufferGeometry from vertex data
     */
    private static createBufferGeometry(
        vertices: number[] | Float32Array,
        normals?: number[] | Float32Array,
        uvs?: number[] | Float32Array,
        indices?: number[] | Uint16Array | Uint32Array,
        colors?: number[] | Float32Array,
    ): THREE.BufferGeometry {
        const geometry = new THREE.BufferGeometry();

        // Set vertices
        geometry.setAttribute(
            "position",
            vertices instanceof Float32Array
                ? new THREE.Float32BufferAttribute(vertices, 3)
                : new THREE.Float32BufferAttribute(vertices, 3),
        );

        // Set normals
        if (normals && normals.length > 0) {
            geometry.setAttribute(
                "normal",
                normals instanceof Float32Array
                    ? new THREE.Float32BufferAttribute(normals, 3)
                    : new THREE.Float32BufferAttribute(normals, 3),
            );
        } else {
            geometry.computeVertexNormals();
        }

        // Set UVs
        if (uvs && uvs.length > 0) {
            geometry.setAttribute(
                "uv",
                uvs instanceof Float32Array
                    ? new THREE.Float32BufferAttribute(uvs, 2)
                    : new THREE.Float32BufferAttribute(uvs, 2),
            );
        }

        // Set vertex colors
        if (colors && colors.length > 0) {
            geometry.setAttribute(
                "color",
                colors instanceof Float32Array
                    ? new THREE.Float32BufferAttribute(colors, 4)
                    : new THREE.Float32BufferAttribute(colors, 4),
            );
        }

        // Set indices - properly handle 32-bit indices
        if (indices && indices.length > 0) {
            if (indices instanceof Uint32Array) {
                // Check if WebGL supports 32-bit indices
                const canvas = document.createElement("canvas");
                const gl = canvas.getContext(
                    "webgl",
                ) as WebGLRenderingContext | null;
                const supports32BitIndices =
                    gl && gl.getExtension("OES_element_index_uint");

                if (supports32BitIndices) {
                    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
                    console.log(
                        `[ThreeJSAdapter] Using 32-bit indices for ${indices.length} indices`,
                    );
                } else {
                    console.warn(
                        "32-bit indices needed but not supported by WebGL context. Geometry may be corrupted.",
                    );
                    // Fallback to 16-bit (will likely cause rendering issues but prevents crash)
                    const clampedIndices = new Uint16Array(indices.length);
                    for (let i = 0; i < indices.length; i++) {
                        clampedIndices[i] = Math.min(indices[i], 65535);
                    }
                    geometry.setIndex(
                        new THREE.BufferAttribute(clampedIndices, 1),
                    );
                    console.log(
                        `[ThreeJSAdapter] Fallback to 16-bit indices (clamped)`,
                    );
                }
            } else if (indices instanceof Uint16Array) {
                geometry.setIndex(new THREE.BufferAttribute(indices, 1));
            } else {
                // Regular number array - let Three.js decide
                geometry.setIndex(indices);
            }
        }

        return geometry;
    }

    /**
     * Create a Three.js material
     */
    private static createMaterial(
        options: ThreeJSAdapterOptions,
        color: string | number,
    ): THREE.Material {
        const materialColor = new THREE.Color(color);

        switch (options.materialType) {
            case "standard":
                return new THREE.MeshStandardMaterial({
                    color: materialColor,
                    roughness: options.roughness,
                    metalness: options.metalness,
                    transparent: options.transparent,
                    opacity: options.opacity,
                });

            case "phong":
                return new THREE.MeshPhongMaterial({
                    color: materialColor,
                    shininess: options.shininess,
                    transparent: options.transparent,
                    opacity: options.opacity,
                });

            case "lambert":
                return new THREE.MeshLambertMaterial({
                    color: materialColor,
                    transparent: options.transparent,
                    opacity: options.opacity,
                });

            case "basic":
                return new THREE.MeshBasicMaterial({
                    color: materialColor,
                    transparent: options.transparent,
                    opacity: options.opacity,
                });

            default:
                return new THREE.MeshStandardMaterial({
                    color: materialColor,
                    roughness: options.roughness,
                    metalness: options.metalness,
                });
        }
    }

    /**
     * Update material properties of an existing mesh group
     */
    static updateMaterials(
        meshGroup: LSystemMeshGroup,
        options: Partial<ThreeJSAdapterOptions>,
    ): void {
        if (meshGroup.branches && options.branchColor !== undefined) {
            const branchMaterial = meshGroup.branches
                .material as THREE.Material;
            (branchMaterial as any).color = new THREE.Color(
                options.branchColor,
            );
        }

        if (meshGroup.leaves && options.leafColor !== undefined) {
            const leafMaterial = meshGroup.leaves.material as THREE.Material;
            (leafMaterial as any).color = new THREE.Color(options.leafColor);
        }

        // Update other material properties
        if (options.opacity !== undefined) {
            if (meshGroup.branches) {
                (meshGroup.branches.material as any).opacity = options.opacity;
            }
            if (meshGroup.leaves) {
                (meshGroup.leaves.material as any).opacity = options.opacity;
            }
        }

        if (options.transparent !== undefined) {
            if (meshGroup.branches) {
                (meshGroup.branches.material as any).transparent =
                    options.transparent;
            }
            if (meshGroup.leaves) {
                (meshGroup.leaves.material as any).transparent =
                    options.transparent;
            }
        }
    }

    /**
     * Fit camera to view the entire L-System
     */
    static fitCameraToMesh(
        meshGroup: LSystemMeshGroup,
        camera: THREE.PerspectiveCamera,
        controls?: any,
        padding: number = 1.5,
    ): void {
        const box = meshGroup.boundingBox;
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs((maxDim / 2) * Math.tan(fov * 2)) * padding;

        camera.position.set(
            center.x + cameraZ * 0.5,
            center.y + cameraZ * 0.5,
            center.z + cameraZ,
        );

        if (controls) {
            controls.target.copy(center);
            controls.update();
        }
    }

    /**
     * Export mesh to OBJ format string
     */
    static exportToOBJ(meshGroup: LSystemMeshGroup): string {
        let objContent = "# L-System Export\n";
        let vertexOffset = 0;

        const exportMesh = (mesh: THREE.Mesh, name: string) => {
            objContent += `\n# ${name}\n`;
            objContent += `o ${name}\n`;

            const geometry = mesh.geometry;
            const vertices = geometry.attributes.position.array;
            const normals = geometry.attributes.normal?.array;
            const uvs = geometry.attributes.uv?.array;

            // Export vertices
            for (let i = 0; i < vertices.length; i += 3) {
                objContent += `v ${vertices[i]} ${vertices[i + 1]} ${vertices[i + 2]}\n`;
            }

            // Export normals
            if (normals) {
                for (let i = 0; i < normals.length; i += 3) {
                    objContent += `vn ${normals[i]} ${normals[i + 1]} ${normals[i + 2]}\n`;
                }
            }

            // Export texture coordinates
            if (uvs) {
                for (let i = 0; i < uvs.length; i += 2) {
                    objContent += `vt ${uvs[i]} ${uvs[i + 1]}\n`;
                }
            }

            // Export faces
            const indices = geometry.index;
            if (indices) {
                const indexArray = indices.array;
                for (let i = 0; i < indexArray.length; i += 3) {
                    const v1 = indexArray[i] + 1 + vertexOffset;
                    const v2 = indexArray[i + 1] + 1 + vertexOffset;
                    const v3 = indexArray[i + 2] + 1 + vertexOffset;

                    if (normals && uvs) {
                        objContent += `f ${v1}/${v1}/${v1} ${v2}/${v2}/${v2} ${v3}/${v3}/${v3}\n`;
                    } else if (normals) {
                        objContent += `f ${v1}//${v1} ${v2}//${v2} ${v3}//${v3}\n`;
                    } else {
                        objContent += `f ${v1} ${v2} ${v3}\n`;
                    }
                }
            }

            vertexOffset += vertices.length / 3;
        };

        if (meshGroup.branches) {
            exportMesh(meshGroup.branches, "Branches");
        }

        if (meshGroup.leaves) {
            exportMesh(meshGroup.leaves, "Leaves");
        }

        return objContent;
    }

    /**
     * Create a simple L-System from preset
     */
    static createFromPreset(
        presetName: string,
        iterations: number = 4,
        options: ThreeJSAdapterOptions = {},
    ): LSystemMeshGroup | null {
        const presets = {
            tree: {
                axiom: "F",
                rules: "F -> F[+F]F[-F]F",
                angle: 25,
                iterations: iterations,
            },
            fern: {
                axiom: "X",
                rules: "X -> F[+X]F[-X]+X\nF -> FF",
                angle: 25,
                iterations: iterations,
            },
            bush: {
                axiom: "F",
                rules: "F -> FF+[+F-F-F]-[-F+F+F]",
                angle: 22,
                iterations: iterations,
            },
            dragon: {
                axiom: "FX",
                rules: "X -> X+YF+\nY -> -FX-Y",
                angle: 90,
                iterations: iterations,
            },
        };

        const preset = presets[presetName as keyof typeof presets];
        if (!preset) return null;

        const geometryParams: GeometryParameters = {
            length: 1.0,
            thickness: 0.05,
            tapering: 0.8,
            leafColor: [0.2, 0.8, 0.2],
        };

        return this.createMeshFromLSystem(preset, geometryParams, options);
    }

    /**
     * Dispose of all resources in a mesh group
     */
    static dispose(meshGroup: LSystemMeshGroup): void {
        if (meshGroup.branches) {
            meshGroup.branches.geometry.dispose();
            if (Array.isArray(meshGroup.branches.material)) {
                meshGroup.branches.material.forEach((material) =>
                    material.dispose(),
                );
            } else {
                meshGroup.branches.material.dispose();
            }
        }

        if (meshGroup.leaves) {
            meshGroup.leaves.geometry.dispose();
            if (Array.isArray(meshGroup.leaves.material)) {
                meshGroup.leaves.material.forEach((material) =>
                    material.dispose(),
                );
            } else {
                meshGroup.leaves.material.dispose();
            }
        }

        meshGroup.group.clear();
    }
}
