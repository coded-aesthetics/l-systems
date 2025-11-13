/**
 * L-Systems Tree Generator Library
 *
 * A lightweight library for generating 3D tree structures using L-Systems (Lindenmayer Systems).
 * Provides WebGL-ready geometry data that can be easily integrated into any 3D framework.
 *
 * @example
 * ```typescript
 * import { LSystemsLibrary } from 'l-systems-trees';
 *
 * const config = {
 *     axiom: "F",
 *     rules: "F -> F[+F]F[-F]F",
 *     iterations: 4,
 *     angle: 25
 * };
 *
 * const treeGeometry = LSystemsLibrary.generateTree(config, {
 *     length: 1.0,
 *     thickness: 0.05,
 *     tapering: 0.8,
 *     leafColor: [0.2, 0.8, 0.2]
 * });
 * ```
 */

// Core library exports
export {
    LSystemsLibrary,
    type LSystemConfig,
    type GeometryParameters,
    type TreeGeometry,
    type LSystemRule,
    type GeometryData,
} from "./LSystemsLibrary.js";

// Import for internal use in utility functions
import { LSystemsLibrary } from "./LSystemsLibrary.js";

// Three.js adapter exports
export {
    ThreeJSAdapter,
    type ThreeJSAdapterOptions,
    type LSystemMeshGroup,
} from "./adapters/ThreeJSAdapter.js";

// Babylon.js adapter exports
export {
    BabylonJSAdapter,
    type BabylonJSAdapterOptions,
    type BabylonMeshGroup,
} from "./adapters/BabylonJSAdapter.js";

// Utility exports for advanced usage
export { LSystemGenerator } from "../core/LSystemGenerator.js";
export { LSystem } from "../core/LSystem.js";
export type {
    LSystemState,
    LSystemConfig as CoreLSystemConfig,
} from "../core/LSystemState.js";

// Version
export const VERSION = "1.0.0";

/**
 * Quick utility functions for common use cases
 */
export const LSystemsUtils = {
    /**
     * Parse rule string into rule objects
     */
    parseRules: (ruleString: string) => {
        return LSystemsLibrary.parseRules(ruleString);
    },

    /**
     * Generate tree geometry with minimal configuration
     */
    quickTree: (iterations: number = 4) => {
        return LSystemsLibrary.generateTree({
            axiom: "F",
            rules: "F -> F[+F]F[-F]F",
            iterations,
            angle: 25,
        });
    },

    /**
     * Generate fern geometry with minimal configuration
     */
    quickFern: (iterations: number = 5) => {
        return LSystemsLibrary.generateTree({
            axiom: "X",
            rules: "X -> F[+X]F[-X]+X\nF -> FF",
            iterations,
            angle: 25,
        });
    },

    /**
     * Generate bush geometry with minimal configuration
     */
    quickBush: (iterations: number = 4) => {
        return LSystemsLibrary.generateTree({
            axiom: "F",
            rules: "F -> FF+[+F-F-F]-[-F+F+F]",
            iterations,
            angle: 22,
        });
    },
};
