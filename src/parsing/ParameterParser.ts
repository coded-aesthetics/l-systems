/**
 * Parameter parsing utilities for L-System symbols
 */

import { ParameterizedSymbol } from '../core/LSystemState.js';

export class ParameterParser {
    private static readonly PARAM_PATTERN = /([A-Za-z+\-\[\]&^\\\/Ff])(\{[^}]+\})?/g;
    private static readonly PARAM_CONTENT = /(\w+):([^,}]+)/g;

    /**
     * Parse a string containing parameterized symbols
     * @param input - Input string with symbols like "F{color:red,length:1.5}"
     * @returns Array of parameterized symbols
     */
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

    /**
     * Convert tokens back to string representation
     * @param tokens - Array of parameterized symbols
     * @returns String representation
     */
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

    /**
     * Extract a parameter value from a parameterized symbol
     * @param symbol - The parameterized symbol
     * @param paramName - Name of the parameter to extract
     * @param defaultValue - Default value if parameter not found
     * @returns Parameter value or default
     */
    static getParameter(symbol: ParameterizedSymbol, paramName: string, defaultValue?: string): string | undefined {
        return symbol.parameters.get(paramName) ?? defaultValue;
    }

    /**
     * Set a parameter value in a parameterized symbol
     * @param symbol - The parameterized symbol to modify
     * @param paramName - Name of the parameter to set
     * @param value - Value to set
     */
    static setParameter(symbol: ParameterizedSymbol, paramName: string, value: string): void {
        symbol.parameters.set(paramName, value);
    }

    /**
     * Check if a symbol has a specific parameter
     * @param symbol - The parameterized symbol
     * @param paramName - Name of the parameter to check
     * @returns True if parameter exists
     */
    static hasParameter(symbol: ParameterizedSymbol, paramName: string): boolean {
        return symbol.parameters.has(paramName);
    }
}
