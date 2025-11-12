/**
 * Mathematical utilities for vector and matrix operations
 * Used for 3D transformations in L-System rendering
 */

// Type definitions
export type Vec3 = [number, number, number];
export type Mat4 = Float32Array;
export type Mat3 = Float32Array;

// Vector operations
export const VectorUtils = {
    /**
     * Normalize a 3D vector
     */
    normalize(v: Vec3): Vec3 {
        const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
    },

    /**
     * Calculate cross product of two 3D vectors
     */
    cross(a: Vec3, b: Vec3): Vec3 {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
        ];
    },

    /**
     * Calculate dot product of two 3D vectors
     */
    dot(a: Vec3, b: Vec3): number {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    },

    /**
     * Rotate a vector around an axis by a given angle (Rodrigues' rotation formula)
     */
    rotateVector(v: Vec3, axis: Vec3, angle: number): Vec3 {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dot = VectorUtils.dot(v, axis);

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
    },

    /**
     * Add two 3D vectors
     */
    add(a: Vec3, b: Vec3): Vec3 {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    },

    /**
     * Subtract two 3D vectors
     */
    subtract(a: Vec3, b: Vec3): Vec3 {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    },

    /**
     * Scale a 3D vector by a scalar
     */
    scale(v: Vec3, s: number): Vec3 {
        return [v[0] * s, v[1] * s, v[2] * s];
    },

    /**
     * Calculate the length/magnitude of a 3D vector
     */
    length(v: Vec3): number {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    },

    /**
     * Calculate distance between two 3D points
     */
    distance(a: Vec3, b: Vec3): number {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const dz = b[2] - a[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },
};

// 4x4 Matrix operations
export const Mat4Utils = {
    /**
     * Create a new identity matrix
     */
    identity(): Mat4 {
        const out = new Float32Array(16);
        out.fill(0);
        out[0] = out[5] = out[10] = out[15] = 1;
        return out;
    },

    /**
     * Set a matrix to identity
     */
    setIdentity(out: Mat4): void {
        out.fill(0);
        out[0] = out[5] = out[10] = out[15] = 1;
    },

    /**
     * Translate a matrix
     */
    translate(out: Mat4, a: Mat4, v: Vec3): void {
        const x = v[0],
            y = v[1],
            z = v[2];

        if (a === out) {
            out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
            out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
            out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
            out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        } else {
            for (let i = 0; i < 12; i++) out[i] = a[i];
            out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
            out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
            out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
            out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        }
    },

    /**
     * Rotate a matrix around the X-axis
     */
    rotateX(out: Mat4, a: Mat4, rad: number): void {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a10 = a[4],
            a11 = a[5],
            a12 = a[6],
            a13 = a[7];
        const a20 = a[8],
            a21 = a[9],
            a22 = a[10],
            a23 = a[11];

        if (a !== out) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
        }

        out[4] = a10 * c + a20 * s;
        out[5] = a11 * c + a21 * s;
        out[6] = a12 * c + a22 * s;
        out[7] = a13 * c + a23 * s;
        out[8] = a20 * c - a10 * s;
        out[9] = a21 * c - a11 * s;
        out[10] = a22 * c - a12 * s;
        out[11] = a23 * c - a13 * s;
    },

    /**
     * Rotate a matrix around the Y-axis
     */
    rotateY(out: Mat4, a: Mat4, rad: number): void {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a00 = a[0],
            a01 = a[1],
            a02 = a[2],
            a03 = a[3];
        const a20 = a[8],
            a21 = a[9],
            a22 = a[10],
            a23 = a[11];

        if (a !== out) {
            out[4] = a[4];
            out[5] = a[5];
            out[6] = a[6];
            out[7] = a[7];
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
        }

        out[0] = a00 * c - a20 * s;
        out[1] = a01 * c - a21 * s;
        out[2] = a02 * c - a22 * s;
        out[3] = a03 * c - a23 * s;
        out[8] = a00 * s + a20 * c;
        out[9] = a01 * s + a21 * c;
        out[10] = a02 * s + a22 * c;
        out[11] = a03 * s + a23 * c;
    },

    /**
     * Multiply two 4x4 matrices
     */
    multiply(out: Mat4, a: Mat4, b: Mat4): void {
        const a00 = a[0],
            a01 = a[1],
            a02 = a[2],
            a03 = a[3];
        const a10 = a[4],
            a11 = a[5],
            a12 = a[6],
            a13 = a[7];
        const a20 = a[8],
            a21 = a[9],
            a22 = a[10],
            a23 = a[11];
        const a30 = a[12],
            a31 = a[13],
            a32 = a[14],
            a33 = a[15];

        let b0 = b[0],
            b1 = b[1],
            b2 = b[2],
            b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[4];
        b1 = b[5];
        b2 = b[6];
        b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[8];
        b1 = b[9];
        b2 = b[10];
        b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[12];
        b1 = b[13];
        b2 = b[14];
        b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    },

    /**
     * Create a perspective projection matrix
     */
    perspective(
        out: Mat4,
        fovy: number,
        aspect: number,
        near: number,
        far: number,
    ): void {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);

        out.fill(0);
        out[0] = f / aspect;
        out[5] = f;
        out[10] = (far + near) * nf;
        out[11] = -1;
        out[14] = 2 * far * near * nf;
    },

    /**
     * Copy a matrix
     */
    copy(out: Mat4, a: Mat4): void {
        for (let i = 0; i < 16; i++) {
            out[i] = a[i];
        }
    },
};

// 3x3 Matrix operations
export const Mat3Utils = {
    /**
     * Create a new identity matrix
     */
    identity(): Mat3 {
        const out = new Float32Array(9);
        out.fill(0);
        out[0] = out[4] = out[8] = 1;
        return out;
    },

    /**
     * Set a matrix to identity
     */
    setIdentity(out: Mat3): void {
        out.fill(0);
        out[0] = out[4] = out[8] = 1;
    },

    /**
     * Create a normal matrix from a 4x4 model-view matrix
     */
    normalFromMat4(out: Mat3, a: Mat4): void {
        const a00 = a[0],
            a01 = a[1],
            a02 = a[2];
        const a10 = a[4],
            a11 = a[5],
            a12 = a[6];
        const a20 = a[8],
            a21 = a[9],
            a22 = a[10];

        const b01 = a22 * a11 - a12 * a21;
        const b11 = -a22 * a10 + a12 * a20;
        const b21 = a21 * a10 - a11 * a20;

        let det = a00 * b01 + a01 * b11 + a02 * b21;

        if (!det) {
            this.setIdentity(out);
            return;
        }
        det = 1.0 / det;

        out[0] = b01 * det;
        out[1] = (-a22 * a01 + a02 * a21) * det;
        out[2] = (a12 * a01 - a02 * a11) * det;
        out[3] = b11 * det;
        out[4] = (a22 * a00 - a02 * a20) * det;
        out[5] = (-a12 * a00 + a02 * a10) * det;
        out[6] = b21 * det;
        out[7] = (-a21 * a00 + a01 * a20) * det;
        out[8] = (a11 * a00 - a01 * a10) * det;
    },

    /**
     * Copy a matrix
     */
    copy(out: Mat3, a: Mat3): void {
        for (let i = 0; i < 9; i++) {
            out[i] = a[i];
        }
    },
};

// Convenience function exports for backward compatibility and ease of use
export const normalize = (v: Vec3): Vec3 => VectorUtils.normalize(v);
export const cross = (a: Vec3, b: Vec3): Vec3 => VectorUtils.cross(a, b);
export const dot = (a: Vec3, b: Vec3): number => VectorUtils.dot(a, b);
export const rotateVector = (v: Vec3, axis: Vec3, angle: number): Vec3 =>
    VectorUtils.rotateVector(v, axis, angle);
