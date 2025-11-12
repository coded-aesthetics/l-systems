/**
 * Symbol parsing utilities that combine parameter and color parsing
 */

import { ParameterizedSymbol } from '../core/LSystemState.js';
import { ParameterParser } from './ParameterParser.js';
import { ColorParser } from './ColorParser.js';

export class SymbolParser {
    /**
     * Parse a complete L-System string into tokens
     * @param input - L-System string
     * @returns Array of parsed symbols
     */
    static parseString(input: string): ParameterizedSymbol[] {
        return ParameterParser.parseString(input);
    }

    /**
     * Convert tokens back to string
     * @param tokens - Array of symbols
     * @returns String representation
     */
    static tokensToString(tokens: ParameterizedSymbol[]): string {
        return ParameterParser.tokensToString(tokens);
    }

    /**
     * Extract color from a symbol's parameters
     * @param symbol - The parameterized symbol
     * @param defaultColor - Default color if none specified
     * @returns RGBA color array or null
     */
    static extractColor(
        symbol: ParameterizedSymbol,
        defaultColor?: [number, number, number, number]
    ): [number, number, number, number] | null {
        const colorParam = ParameterParser.getParameter(symbol, 'color');

        if (!colorParam) {
            return defaultColor || null;
        }

        return ColorParser.parseColor(colorParam);
    }

    /**
     * Extract numeric parameter from symbol
     * @param symbol - The parameterized symbol
     * @param paramName - Parameter name to extract
     * @param defaultValue - Default value if parameter not found
     * @returns Numeric value or default
     */
    static extractNumber(
        symbol: ParameterizedSymbol,
        paramName: string,
        defaultValue?: number
    ): number | undefined {
        const param = ParameterParser.getParameter(symbol, paramName);

        if (!param) {
            return defaultValue;
        }

        const parsed = parseFloat(param);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * Extract string parameter from symbol
     * @param symbol - The parameterized symbol
     * @param paramName - Parameter name to extract
     * @param defaultValue - Default value if parameter not found
     * @returns String value or default
     */
    static extractString(
        symbol: ParameterizedSymbol,
        paramName: string,
        defaultValue?: string
    ): string | undefined {
        return ParameterParser.getParameter(symbol, paramName, defaultValue);
    }

    /**
     * Create a new symbol with parameters
     * @param symbol - Base symbol character
     * @param parameters - Parameters to add
     * @returns New parameterized symbol
     */
    static createSymbol(symbol: string, parameters?: { [key: string]: string }): ParameterizedSymbol {
        const paramMap = new Map<string, string>();

        if (parameters) {
            Object.entries(parameters).forEach(([key, value]) => {
                paramMap.set(key, value);
            });
        }

        return { symbol, parameters: paramMap };
    }

    /**
     * Clone a symbol with optional parameter modifications
     * @param symbol - Symbol to clone
     * @param modifications - Parameters to add/modify
     * @returns Cloned symbol
     */
    static cloneSymbol(
        symbol: ParameterizedSymbol,
        modifications?: { [key: string]: string }
    ): ParameterizedSymbol {
        const newParams = new Map(symbol.parameters);

        if (modifications) {
            Object.entries(modifications).forEach(([key, value]) => {
                newParams.set(key, value);
            });
        }

        return {
            symbol: symbol.symbol,
            parameters: newParams
        };
    }

    /**
     * Filter symbols by type
     * @param tokens - Array of symbols to filter
     * @param symbolTypes - Symbol characters to include
     * @returns Filtered array of symbols
     */
    static filterByType(tokens: ParameterizedSymbol[], ...symbolTypes: string[]): ParameterizedSymbol[] {
        return tokens.filter(token => symbolTypes.includes(token.symbol));
    }

    /**
     * Count symbols of specific types
     * @param tokens - Array of symbols to count
     * @param symbolTypes - Symbol characters to count
     * @returns Count of matching symbols
     */
    static countSymbols(tokens: ParameterizedSymbol[], ...symbolTypes: string[]): number {
        return this.filterByType(tokens, ...symbolTypes).length;
    }

    /**
     * Get the base symbol character from a full symbol string
     * @param symbolString - Full symbol string (e.g., "F{color:red}")
     * @returns Base symbol character (e.g., "F")
     */
    static getBaseSymbol(symbolString: string): string {
        const match = symbolString.match(/^([A-Za-z+\-\[\]&^\\\/Ff])/);
        return match ? match[1] : symbolString.charAt(0);
    }

    /**
     * Validate that a symbol string is properly formatted
     * @param symbolString - Symbol string to validate
     * @returns True if valid
     */
    static isValidSymbol(symbolString: string): boolean {
        try {
            const parsed = this.parseString(symbolString);
            return parsed.length > 0;
        } catch {
            return false;
        }
    }
}
