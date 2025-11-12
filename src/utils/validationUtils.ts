/**
 * Validation utilities for L-System input validation
 */

import { LSystemRule, LSystemConfig } from '../core/LSystemState.js';
import { SymbolParser } from '../parsing/SymbolParser.js';
import { ColorParser } from '../parsing/ColorParser.js';

export class ValidationUtils {
    /**
     * Validate an L-System axiom string
     * @param axiom - Axiom string to validate
     * @returns Validation result with errors if any
     */
    static validateAxiom(axiom: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!axiom || typeof axiom !== 'string') {
            errors.push('Axiom must be a non-empty string');
            return { isValid: false, errors };
        }

        if (axiom.trim().length === 0) {
            errors.push('Axiom cannot be empty or whitespace only');
        }

        // Check if axiom can be parsed
        if (!SymbolParser.isValidSymbol(axiom)) {
            errors.push('Axiom contains invalid symbol syntax');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate L-System rules
     * @param rules - Array of rules to validate
     * @returns Validation result with errors if any
     */
    static validateRules(rules: LSystemRule[]): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!Array.isArray(rules)) {
            errors.push('Rules must be an array');
            return { isValid: false, errors };
        }

        rules.forEach((rule, index) => {
            if (!rule.from || typeof rule.from !== 'string') {
                errors.push(`Rule ${index}: 'from' must be a non-empty string`);
            } else if (!SymbolParser.isValidSymbol(rule.from)) {
                errors.push(`Rule ${index}: 'from' contains invalid symbol syntax`);
            }

            if (!rule.to || typeof rule.to !== 'string') {
                errors.push(`Rule ${index}: 'to' must be a non-empty string`);
            } else if (!SymbolParser.isValidSymbol(rule.to)) {
                errors.push(`Rule ${index}: 'to' contains invalid symbol syntax`);
            }

            if (rule.probability !== undefined) {
                if (typeof rule.probability !== 'number' ||
                    rule.probability < 0 || rule.probability > 1) {
                    errors.push(`Rule ${index}: probability must be a number between 0 and 1`);
                }
            }

            if (rule.condition !== undefined && typeof rule.condition !== 'function') {
                errors.push(`Rule ${index}: condition must be a function`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate L-System configuration
     * @param config - Configuration object to validate
     * @returns Validation result with errors if any
     */
    static validateConfig(config: Partial<LSystemConfig>): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (config.angle !== undefined) {
            if (typeof config.angle !== 'number' || isNaN(config.angle)) {
                errors.push('Angle must be a valid number');
            } else if (config.angle < 0 || config.angle > 360) {
                errors.push('Angle must be between 0 and 360 degrees');
            }
        }

        if (config.angleVariation !== undefined) {
            if (typeof config.angleVariation !== 'number' || isNaN(config.angleVariation)) {
                errors.push('Angle variation must be a valid number');
            } else if (config.angleVariation < 0 || config.angleVariation > 180) {
                errors.push('Angle variation must be between 0 and 180 degrees');
            }
        }

        if (config.lengthVariation !== undefined) {
            if (typeof config.lengthVariation !== 'number' || isNaN(config.lengthVariation)) {
                errors.push('Length variation must be a valid number');
            } else if (config.lengthVariation < 0 || config.lengthVariation > 100) {
                errors.push('Length variation must be between 0 and 100 percent');
            }
        }

        if (config.leafProbability !== undefined) {
            if (typeof config.leafProbability !== 'number' || isNaN(config.leafProbability)) {
                errors.push('Leaf probability must be a valid number');
            } else if (config.leafProbability < 0 || config.leafProbability > 1) {
                errors.push('Leaf probability must be between 0 and 1');
            }
        }

        if (config.leafGenerationThreshold !== undefined) {
            if (typeof config.leafGenerationThreshold !== 'number' ||
                isNaN(config.leafGenerationThreshold) ||
                !Number.isInteger(config.leafGenerationThreshold)) {
                errors.push('Leaf generation threshold must be a valid integer');
            } else if (config.leafGenerationThreshold < 0) {
                errors.push('Leaf generation threshold must be non-negative');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate color string
     * @param colorString - Color string to validate
     * @returns Validation result
     */
    static validateColor(colorString: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!colorString || typeof colorString !== 'string') {
            errors.push('Color must be a non-empty string');
            return { isValid: false, errors };
        }

        const parsed = ColorParser.parseColor(colorString);
        if (!parsed) {
            errors.push(`Invalid color format: "${colorString}"`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate numeric range
     * @param value - Value to validate
     * @param min - Minimum allowed value
     * @param max - Maximum allowed value
     * @param name - Name for error messages
     * @returns Validation result
     */
    static validateRange(
        value: number,
        min: number,
        max: number,
        name: string
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`${name} must be a valid number`);
        } else if (value < min || value > max) {
            errors.push(`${name} must be between ${min} and ${max}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate iterations count
     * @param iterations - Number of iterations
     * @returns Validation result
     */
    static validateIterations(iterations: number): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (typeof iterations !== 'number' ||
            isNaN(iterations) ||
            !Number.isInteger(iterations)) {
            errors.push('Iterations must be a valid integer');
        } else if (iterations < 0) {
            errors.push('Iterations must be non-negative');
        } else if (iterations > 20) {
            errors.push('Iterations should not exceed 20 to prevent performance issues');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate L-System string length for performance
     * @param lSystemString - L-System string to check
     * @param maxLength - Maximum allowed length
     * @returns Validation result
     */
    static validateStringLength(
        lSystemString: string,
        maxLength: number = 100000
    ): { isValid: boolean; errors: string[]; warnings: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (lSystemString.length > maxLength) {
            errors.push(`L-System string too long (${lSystemString.length} > ${maxLength})`);
        } else if (lSystemString.length > maxLength * 0.8) {
            warnings.push(`L-System string is very long (${lSystemString.length}), this may impact performance`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Sanitize user input string
     * @param input - Input string to sanitize
     * @param maxLength - Maximum allowed length
     * @returns Sanitized string
     */
    static sanitizeInput(input: string, maxLength: number = 1000): string {
        if (typeof input !== 'string') {
            return '';
        }

        return input
            .trim()
            .substring(0, maxLength)
            .replace(/[^\w\s\{\}\[\]\+\-\^\\\/:,#]/g, ''); // Keep only safe characters
    }

    /**
     * Validate complete L-System configuration
     * @param axiom - Axiom string
     * @param rules - Rules array
     * @param config - Configuration object
     * @param iterations - Number of iterations
     * @returns Complete validation result
     */
    static validateComplete(
        axiom: string,
        rules: LSystemRule[],
        config: Partial<LSystemConfig>,
        iterations: number
    ): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
        details: {
            axiom: ReturnType<typeof ValidationUtils.validateAxiom>;
            rules: ReturnType<typeof ValidationUtils.validateRules>;
            config: ReturnType<typeof ValidationUtils.validateConfig>;
            iterations: ReturnType<typeof ValidationUtils.validateIterations>;
        }
    } {
        const axiomResult = this.validateAxiom(axiom);
        const rulesResult = this.validateRules(rules);
        const configResult = this.validateConfig(config);
        const iterationsResult = this.validateIterations(iterations);

        const allErrors = [
            ...axiomResult.errors,
            ...rulesResult.errors,
            ...configResult.errors,
            ...iterationsResult.errors
        ];

        return {
            isValid: allErrors.length === 0,
            errors: allErrors,
            warnings: [], // Could add warnings from individual validations
            details: {
                axiom: axiomResult,
                rules: rulesResult,
                config: configResult,
                iterations: iterationsResult
            }
        };
    }
}
