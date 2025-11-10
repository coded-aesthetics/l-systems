export interface LSystemRule {
    from: string;
    to: string;
}
export interface LSystemState {
    position: [number, number, number];
    direction: [number, number, number];
    up: [number, number, number];
    right: [number, number, number];
    length: number;
    thickness: number;
    depth: number;
}
export declare class LSystem {
    private axiom;
    private rules;
    private angle;
    private angleVariation;
    private iterations;
    constructor(axiom: string, rules: LSystemRule[], angle?: number, angleVariation?: number);
    setAngle(angle: number): void;
    setAngleVariation(variation: number): void;
    private getVariedAngle;
    generate(iterations: number): string;
    private iterate;
    interpretToGeometry(lSystemString: string, initialLength?: number, initialThickness?: number, tapering?: number): {
        vertices: number[];
        normals: number[];
        uvs: number[];
        depths: number[];
        heights: number[];
        indices: number[];
    };
    static parseRules(rulesText: string): LSystemRule[];
}
//# sourceMappingURL=LSystem.d.ts.map