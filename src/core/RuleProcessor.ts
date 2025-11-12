/**
 * Rule processing utilities for L-System rule management and application
 */

import { LSystemRule, GenerationState, ParameterizedSymbol } from './LSystemState.js';
import { SymbolParser } from '../parsing/SymbolParser.js';

export class RuleProcessor {
    private rules: Map<string, string[]>;
    private parameterizedRules: Map<string, string[]>;
    private conditionalRules: Map<string, LSystemRule[]>;

    constructor(rules: LSystemRule[]) {
        this.rules = new Map();
        this.parameterizedRules = new Map();
        this.conditionalRules = new Map();

        this.processRules(rules);
    }

    /**
     * Process and organize rules by type
     * @param rules - Array of L-System rules
     */
    private processRules(rules: LSystemRule[]): void {
        rules.forEach((rule) => {
            const baseSymbol = SymbolParser.getBaseSymbol(rule.from);

            // Handle conditional rules separately
            if (rule.condition) {
                if (!this.conditionalRules.has(baseSymbol)) {
                    this.conditionalRules.set(baseSymbol, []);
                }
                this.conditionalRules.get(baseSymbol)!.push(rule);
                return;
            }

            // Group basic rules by symbol
            if (!this.rules.has(baseSymbol)) {
                this.rules.set(baseSymbol, []);
            }
            this.rules.get(baseSymbol)!.push(rule.to);

            // Store parameterized rules for direct lookup
            if (!this.parameterizedRules.has(rule.from)) {
                this.parameterizedRules.set(rule.from, []);
            }
            this.parameterizedRules.get(rule.from)!.push(rule.to);
        });
    }

    /**
     * Apply rules to a single symbol
     * @param symbol - Symbol to process
     * @param state - Current generation state
     * @returns Replacement string or original symbol
     */
    public applyRules(symbol: ParameterizedSymbol, state?: GenerationState): string {
        const fullSymbol = SymbolParser.tokensToString([symbol]);
        const baseSymbol = symbol.symbol;

        // First try conditional rules if state is provided
        if (state && this.conditionalRules.has(baseSymbol)) {
            const conditionalRules = this.conditionalRules.get(baseSymbol)!;

            for (const rule of conditionalRules) {
                if (rule.condition!(state)) {
                    // Check probability if specified
                    if (rule.probability && Math.random() > rule.probability) {
                        continue;
                    }
                    return rule.to;
                }
            }
        }

        // Try exact parameterized rule match first
        let ruleOptions = this.parameterizedRules.get(fullSymbol);

        // If no exact match, try base symbol rules
        if (!ruleOptions) {
            ruleOptions = this.rules.get(baseSymbol);
        }

        if (ruleOptions && ruleOptions.length > 0) {
            // Filter by probability if specified
            const availableRules = ruleOptions.filter(() => {
                // For now, assume all rules have equal probability
                // TODO: Add probability support to basic rules
                return true;
            });

            if (availableRules.length === 0) {
                return fullSymbol; // No rules passed probability check
            }

            // Choose a random rule if multiple exist
            const selectedRule = availableRules[Math.floor(Math.random() * availableRules.length)];
            return selectedRule;
        }

        // No rule found, return original symbol
        return fullSymbol;
    }

    /**
     * Apply rules to an entire string
     * @param input - Input L-System string
     * @param iteration - Current iteration number
     * @returns Processed string
     */
    public processString(input: string, iteration: number = 0): string {
        const tokens = SymbolParser.parseString(input);
        let result = "";

        tokens.forEach((token, index) => {
            const state: GenerationState = {
                iteration,
                depth: 0, // TODO: Calculate actual depth
                position: index
            };

            result += this.applyRules(token, state);
        });

        return result;
    }

    /**
     * Get all rules for a specific symbol
     * @param symbol - Symbol to get rules for (base symbol)
     * @returns Array of replacement strings
     */
    public getRulesForSymbol(symbol: string): string[] {
        return this.rules.get(symbol) || [];
    }

    /**
     * Check if rules exist for a symbol
     * @param symbol - Symbol to check
     * @returns True if rules exist
     */
    public hasRules(symbol: string): boolean {
        const baseSymbol = SymbolParser.getBaseSymbol(symbol);
        return this.rules.has(baseSymbol) ||
               this.parameterizedRules.has(symbol) ||
               this.conditionalRules.has(baseSymbol);
    }

    /**
     * Add a new rule to the processor
     * @param rule - Rule to add
     */
    public addRule(rule: LSystemRule): void {
        this.processRules([rule]);
    }

    /**
     * Remove all rules for a symbol
     * @param symbol - Symbol to remove rules for
     */
    public removeRulesForSymbol(symbol: string): void {
        const baseSymbol = SymbolParser.getBaseSymbol(symbol);
        this.rules.delete(baseSymbol);
        this.parameterizedRules.delete(symbol);
        this.conditionalRules.delete(baseSymbol);
    }

    /**
     * Get statistics about loaded rules
     * @returns Rule statistics
     */
    public getStatistics(): {
        totalRules: number;
        basicRules: number;
        parameterizedRules: number;
        conditionalRules: number;
        symbolsCovered: number;
    } {
        const basicRuleCount = Array.from(this.rules.values()).reduce((sum, rules) => sum + rules.length, 0);
        const parameterizedRuleCount = Array.from(this.parameterizedRules.values()).reduce((sum, rules) => sum + rules.length, 0);
        const conditionalRuleCount = Array.from(this.conditionalRules.values()).reduce((sum, rules) => sum + rules.length, 0);

        const allSymbols = new Set([
            ...this.rules.keys(),
            ...Array.from(this.parameterizedRules.keys()).map(s => SymbolParser.getBaseSymbol(s)),
            ...this.conditionalRules.keys()
        ]);

        return {
            totalRules: basicRuleCount + parameterizedRuleCount + conditionalRuleCount,
            basicRules: basicRuleCount,
            parameterizedRules: parameterizedRuleCount,
            conditionalRules: conditionalRuleCount,
            symbolsCovered: allSymbols.size
        };
    }

    /**
     * Parse rule strings from text format
     * @param ruleText - Multi-line text with rules (format: "from -> to")
     * @returns Array of parsed rules
     */
    public static parseRules(ruleText: string): LSystemRule[] {
        const rules: LSystemRule[] = [];
        const lines = ruleText.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
                continue;
            }

            // Parse rule format: "from -> to" or "from : to"
            const separators = ['->', ':'];
            let from = '', to = '';

            for (const separator of separators) {
                if (trimmed.includes(separator)) {
                    const parts = trimmed.split(separator).map(p => p.trim());
                    if (parts.length >= 2) {
                        from = parts[0];
                        to = parts.slice(1).join(separator).trim();
                        break;
                    }
                }
            }

            if (from && to) {
                rules.push({ from, to });
            }
        }

        return rules;
    }
}
