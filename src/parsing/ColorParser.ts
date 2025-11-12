/**
 * Color parsing utilities for L-System symbols
 */

export class ColorParser {
    private static readonly namedColors: { [key: string]: [number, number, number, number] } = {
        red: [1, 0, 0, 1],
        green: [0, 1, 0, 1],
        blue: [0, 0, 1, 1],
        brown: [0.4, 0.2, 0.1, 1],
        leaf_green: [0.3, 0.7, 0.2, 1],
        bark_brown: [0.3, 0.15, 0.05, 1],
        autumn_red: [0.7, 0.2, 0.1, 1],
        autumn_orange: [0.8, 0.4, 0.1, 1],
        autumn_yellow: [0.9, 0.7, 0.2, 1],
        dark_green: [0.1, 0.3, 0.1, 1],
    };

    /**
     * Parse a color string into RGBA values
     * @param colorString - Color string (hex, named color, etc.)
     * @returns RGBA array [r, g, b, a] with values 0-1, or null if invalid
     */
    static parseColor(colorString: string): [number, number, number, number] | null {
        // Remove # if present
        const cleanColor = colorString.startsWith("#")
            ? colorString.slice(1)
            : colorString;

        // Handle named colors
        if (this.namedColors[cleanColor.toLowerCase()]) {
            return this.namedColors[cleanColor.toLowerCase()];
        }

        // Handle hex colors
        if (cleanColor.match(/^[0-9A-Fa-f]+$/)) {
            if (cleanColor.length === 6) {
                // RGB format
                const r = parseInt(cleanColor.slice(0, 2), 16) / 255;
                const g = parseInt(cleanColor.slice(2, 4), 16) / 255;
                const b = parseInt(cleanColor.slice(4, 6), 16) / 255;
                return [r, g, b, 1];
            } else if (cleanColor.length === 8) {
                // RGBA format
                const r = parseInt(cleanColor.slice(0, 2), 16) / 255;
                const g = parseInt(cleanColor.slice(2, 4), 16) / 255;
                const b = parseInt(cleanColor.slice(4, 6), 16) / 255;
                const a = parseInt(cleanColor.slice(6, 8), 16) / 255;
                return [r, g, b, a];
            } else if (cleanColor.length === 3) {
                // Short RGB format (e.g., "f0a" -> "ff00aa")
                const r = parseInt(cleanColor.charAt(0).repeat(2), 16) / 255;
                const g = parseInt(cleanColor.charAt(1).repeat(2), 16) / 255;
                const b = parseInt(cleanColor.charAt(2).repeat(2), 16) / 255;
                return [r, g, b, 1];
            }
        }

        return null;
    }

    /**
     * Convert RGBA values to hex string
     * @param r - Red component (0-1)
     * @param g - Green component (0-1)
     * @param b - Blue component (0-1)
     * @param a - Alpha component (0-1), optional
     * @returns Hex color string
     */
    static rgbaToHex(r: number, g: number, b: number, a?: number): string {
        const toHex = (value: number): string => {
            const hex = Math.round(value * 255).toString(16).padStart(2, '0');
            return hex;
        };

        const hex = `${toHex(r)}${toHex(g)}${toHex(b)}`;
        if (a !== undefined && a !== 1) {
            return `#${hex}${toHex(a)}`;
        }
        return `#${hex}`;
    }

    /**
     * Get a random color from the named colors
     * @returns Random RGBA color array
     */
    static getRandomNamedColor(): [number, number, number, number] {
        const colorNames = Object.keys(this.namedColors);
        const randomName = colorNames[Math.floor(Math.random() * colorNames.length)];
        return this.namedColors[randomName];
    }

    /**
     * Get all available named colors
     * @returns Array of color names
     */
    static getNamedColorNames(): string[] {
        return Object.keys(this.namedColors);
    }

    /**
     * Check if a color string is a valid named color
     * @param colorString - Color string to check
     * @returns True if it's a valid named color
     */
    static isNamedColor(colorString: string): boolean {
        return this.namedColors.hasOwnProperty(colorString.toLowerCase());
    }

    /**
     * Interpolate between two colors
     * @param color1 - First color [r, g, b, a]
     * @param color2 - Second color [r, g, b, a]
     * @param t - Interpolation factor (0-1)
     * @returns Interpolated color
     */
    static interpolateColors(
        color1: [number, number, number, number],
        color2: [number, number, number, number],
        t: number
    ): [number, number, number, number] {
        const clampedT = Math.max(0, Math.min(1, t));
        return [
            color1[0] + (color2[0] - color1[0]) * clampedT,
            color1[1] + (color2[1] - color1[1]) * clampedT,
            color1[2] + (color2[2] - color1[2]) * clampedT,
            color1[3] + (color2[3] - color1[3]) * clampedT,
        ];
    }
}
