/**
 * Pure L-System string generation engine
 * Handles axiom, iterations, and rule application without geometry concerns
 */

import { LSystemRule, LSystemConfig, GenerationState } from "./LSystemState.js";
import { RuleProcessor } from "./RuleProcessor.js";
import { SymbolParser } from "../parsing/SymbolParser.js";

export class LSystemEngine {
    private axiom: string;
    private ruleProcessor: RuleProcessor;
    private config: LSystemConfig;
    private currentIteration: number;
    private generationHistory: string[];

    constructor(
        axiom: string,
        rules: LSystemRule[],
        config: Partial<LSystemConfig> = {},
    ) {
        this.axiom = axiom;
        this.ruleProcessor = new RuleProcessor(rules);
        this.currentIteration = 0;
        this.generationHistory = [axiom];

        // Set default configuration
        this.config = {
            angle: 25,
            angleVariation: 0,
            lengthVariation: 0,
            lengthTapering: 0.95,
            leafProbability: 0.7,
            leafGenerationThreshold: 3,
            ...config,
        };

        // Add default leaf behavior if no explicit leaf rules exist
        if (!this.ruleProcessor.hasRules("L")) {
            this.ruleProcessor.addRule({ from: "L", to: "L" });
        }
    }

    /**
     * Generate L-System string for specified number of iterations
     * @param iterations - Number of iterations to perform
     * @returns Final generated string
     */
    public generate(iterations: number): string {
        let current = this.axiom;
        this.currentIteration = 0;
        this.generationHistory = [current];

        console.log(`Starting L-System generation with axiom: "${current}"`);

        for (let i = 0; i < iterations; i++) {
            current = this.iterate(current, i);
            this.currentIteration = i + 1;
            this.generationHistory.push(current);

            // Log progress for debugging
            const preview =
                current.length > 100
                    ? `${current.substring(0, 100)}...`
                    : current;
            console.log(`Iteration ${i + 1}: "${preview}"`);

            // Count specific symbols for monitoring
            const leafCount = this.countSymbol(current, "L");
            console.log(`Leaf symbols (L) in iteration ${i + 1}: ${leafCount}`);
        }

        return current;
    }

    /**
     * Perform a single iteration of the L-System
     * @param input - Current string state
     * @param iteration - Current iteration number
     * @returns Next iteration string
     */
    private iterate(input: string, iteration: number): string {
        return this.ruleProcessor.processString(input, iteration);
    }

    /**
     * Get the current generation string
     * @returns Current L-System string
     */
    public getCurrentGeneration(): string {
        return (
            this.generationHistory[this.generationHistory.length - 1] ||
            this.axiom
        );
    }

    /**
     * Get generation string at specific iteration
     * @param iteration - Iteration number (0 = axiom)
     * @returns Generation string or null if not available
     */
    public getGenerationAtIteration(iteration: number): string | null {
        if (iteration < 0 || iteration >= this.generationHistory.length) {
            return null;
        }
        return this.generationHistory[iteration];
    }

    /**
     * Get the current iteration number
     * @returns Current iteration
     */
    public getCurrentIteration(): number {
        return this.currentIteration;
    }

    /**
     * Get the axiom (initial string)
     * @returns Axiom string
     */
    public getAxiom(): string {
        return this.axiom;
    }

    /**
     * Set a new axiom and reset generation history
     * @param axiom - New axiom string
     */
    public setAxiom(axiom: string): void {
        this.axiom = axiom;
        this.currentIteration = 0;
        this.generationHistory = [axiom];
    }

    /**
     * Get current configuration
     * @returns Configuration object
     */
    public getConfig(): LSystemConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     * @param newConfig - Partial configuration to merge
     */
    public updateConfig(newConfig: Partial<LSystemConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Add new rules to the system
     * @param rules - Rules to add
     */
    public addRules(rules: LSystemRule[]): void {
        rules.forEach((rule) => this.ruleProcessor.addRule(rule));
    }

    /**
     * Check if the system has rules for a specific symbol
     * @param symbol - Symbol to check
     * @returns True if rules exist
     */
    public hasRules(symbol: string): boolean {
        return this.ruleProcessor.hasRules(symbol);
    }

    /**
     * Count occurrences of a symbol in a string
     * @param str - String to search
     * @param symbol - Symbol to count
     * @returns Number of occurrences
     */
    public countSymbol(str: string, symbol: string): number {
        const tokens = SymbolParser.parseString(str);
        return SymbolParser.countSymbols(tokens, symbol);
    }

    /**
     * Get statistics about the current system
     * @returns System statistics
     */
    public getStatistics(): {
        currentLength: number;
        totalIterations: number;
        ruleStats: ReturnType<RuleProcessor["getStatistics"]>;
        symbolCounts: { [symbol: string]: number };
    } {
        const current = this.getCurrentGeneration();
        const tokens = SymbolParser.parseString(current);

        // Count each symbol type
        const symbolCounts: { [symbol: string]: number } = {};
        tokens.forEach((token) => {
            const symbol = token.symbol;
            symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
        });

        return {
            currentLength: current.length,
            totalIterations: this.currentIteration,
            ruleStats: this.ruleProcessor.getStatistics(),
            symbolCounts,
        };
    }

    /**
     * Reset the system to initial state
     */
    public reset(): void {
        this.currentIteration = 0;
        this.generationHistory = [this.axiom];
    }

    /**
     * Validate that the current string is properly formatted
     * @returns True if valid
     */
    public validate(): boolean {
        try {
            const current = this.getCurrentGeneration();
            return SymbolParser.isValidSymbol(current);
        } catch {
            return false;
        }
    }

    /**
     * Create a copy of this engine with the same configuration
     * @returns New LSystemEngine instance
     */
    public clone(): LSystemEngine {
        // Note: This creates a shallow copy of rules
        // For deep cloning, we'd need to serialize/deserialize the rule processor
        return new LSystemEngine(this.axiom, [], this.config);
    }
}
