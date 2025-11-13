/**
 * Simple test script to verify color mode functionality
 * Run with: node test-color-modes.js
 */

import { ColorParser } from "./dist/parsing/ColorParser.js";
import { ParameterParser } from "./dist/parsing/ParameterParser.js";
import { LSystem } from "./dist/lib/index.js";

console.log("🎨 Testing Color Mode Functionality\n");

// Test 1: Color Parser
console.log("1. Testing ColorParser...");
const testColors = [
    "#ff0000",
    "red",
    "autumn_red",
    "#FF69B4",
    "leaf_green",
    "bark_brown",
    "invalid_color",
];

testColors.forEach((color) => {
    const parsed = ColorParser.parseColor(color);
    if (parsed) {
        console.log(
            `   ✅ ${color} -> [${parsed.map((c) => c.toFixed(2)).join(", ")}]`,
        );
    } else {
        console.log(`   ❌ ${color} -> null (expected for invalid colors)`);
    }
});

// Test 2: Parameter Parser
console.log("\n2. Testing ParameterParser...");
const testStrings = [
    "F{color:red}",
    "L{color:#ff0000}",
    "F{color:autumn_red,length:1.5}",
    "F[+L{color:blue}][-F{color:green}]",
];

testStrings.forEach((str) => {
    const tokens = ParameterParser.parseString(str);
    console.log(`   Input: ${str}`);
    tokens.forEach((token) => {
        console.log(`     Symbol: ${token.symbol}`);
        if (token.parameters.size > 0) {
            token.parameters.forEach((value, key) => {
                console.log(`       ${key}: ${value}`);
            });
        }
    });
    console.log("");
});

// Test 3: L-System with colors
console.log("3. Testing L-System with parameterized colors...");
try {
    const lsystem = new LSystem(
        "F",
        [
            {
                from: "F",
                to: "F{color:red}[+F{color:green}L{color:blue}][-F{color:yellow}L{color:orange}]",
            },
        ],
        25,
        0,
        0,
        0.8,
        2,
    );

    const generated = lsystem.generate(2);
    console.log(
        `   Generated string: ${generated.substring(0, 100)}${generated.length > 100 ? "..." : ""}`,
    );
    console.log(`   Length: ${generated.length}`);

    // Test geometry generation
    const geometry = lsystem.interpretToGeometry();
    console.log(`   Branch vertices: ${geometry.vertices.length / 3}`);
    console.log(
        `   Branch colors: ${geometry.colors ? geometry.colors.length / 4 : 0}`,
    );
    console.log(`   Leaf vertices: ${geometry.leafVertices.length / 3}`);
    console.log(
        `   Leaf colors: ${geometry.leafColors ? geometry.leafColors.length / 4 : 0}`,
    );

    // Check if colors are properly applied
    if (geometry.colors && geometry.colors.length > 0) {
        console.log(`   ✅ Branch colors applied successfully`);
        console.log(
            `     First color: [${geometry.colors
                .slice(0, 4)
                .map((c) => c.toFixed(2))
                .join(", ")}]`,
        );
    } else {
        console.log(`   ❌ No branch colors found`);
    }

    if (geometry.leafColors && geometry.leafColors.length > 0) {
        console.log(`   ✅ Leaf colors applied successfully`);
        console.log(
            `     First leaf color: [${geometry.leafColors
                .slice(0, 4)
                .map((c) => c.toFixed(2))
                .join(", ")}]`,
        );
    } else {
        console.log(`   ❌ No leaf colors found`);
    }
} catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
}

// Test 4: Color conversion
console.log("\n4. Testing color conversion...");
const rgbaColor = [1, 0.5, 0, 1];
const hexColor = ColorParser.rgbaToHex(...rgbaColor);
console.log(`   RGBA [${rgbaColor.join(", ")}] -> ${hexColor}`);

const backToRgba = ColorParser.parseColor(hexColor);
if (backToRgba) {
    console.log(
        `   ${hexColor} -> [${backToRgba.map((c) => c.toFixed(2)).join(", ")}]`,
    );
    console.log(`   ✅ Round-trip conversion successful`);
} else {
    console.log(`   ❌ Round-trip conversion failed`);
}

// Test 5: Named colors
console.log("\n5. Testing named colors...");
const namedColors = ColorParser.getNamedColorNames();
console.log(`   Available named colors: ${namedColors.length}`);
namedColors.forEach((name) => {
    const color = ColorParser.parseColor(name);
    if (color) {
        console.log(
            `   ${name}: [${color.map((c) => c.toFixed(2)).join(", ")}]`,
        );
    }
});

console.log("\n🎉 Color mode testing complete!");
console.log("\n📝 To test in browsers:");
console.log("   1. Open example-threejs.html");
console.log(
    '   2. Select "Rainbow Tree", "Autumn Tree", or "Tropical Plant" presets',
);
console.log(
    '   3. Toggle Color Mode between "Default" and "Parameterized Colors"',
);
console.log("   4. Notice the difference in rendering!");
