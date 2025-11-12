/**
 * Debug script to verify geometry parameters are working correctly
 * This tests that length, thickness, and tapering actually affect the generated geometry
 * Run with: node debug-geometry.js
 */

import { LSystem } from "./dist/LSystem.js";

console.log("🔍 Debugging Geometry Parameters...\n");

try {
    // Create a simple L-System for testing
    const lsystem = new LSystem(
        "F", // Simple axiom
        [{ from: "F", to: "F[+F][-F]" }], // Simple branching rule
        90, // 90-degree angles for clear differences
        0, // No variation for consistent results
        0, // No length variation for consistent results
        0, // No leaves to focus on branches
        10, // High leaf threshold to avoid leaves
    );

    // Generate a simple structure
    const lsystemString = lsystem.generate(1); // "F[+F][-F]"
    console.log(`Generated string: "${lsystemString}"`);

    console.log("\n📏 Testing Length Parameter:");

    // Test with small length
    const geo1 = lsystem.interpretToGeometry(
        lsystemString,
        0.5,
        0.1,
        0.8,
        [1, 0, 0],
    );
    console.log(
        `Length 0.5: First vertex at [${geo1.vertices[0].toFixed(3)}, ${geo1.vertices[1].toFixed(3)}, ${geo1.vertices[2].toFixed(3)}]`,
    );

    // Test with large length
    const geo2 = lsystem.interpretToGeometry(
        lsystemString,
        2.0,
        0.1,
        0.8,
        [1, 0, 0],
    );
    console.log(
        `Length 2.0: First vertex at [${geo2.vertices[0].toFixed(3)}, ${geo2.vertices[1].toFixed(3)}, ${geo2.vertices[2].toFixed(3)}]`,
    );

    // Calculate some positions to verify length scaling
    const maxY1 = Math.max(...geo1.vertices.filter((_, i) => i % 3 === 1));
    const maxY2 = Math.max(...geo2.vertices.filter((_, i) => i % 3 === 1));
    console.log(
        `Max Y coordinate - Length 0.5: ${maxY1.toFixed(3)}, Length 2.0: ${maxY2.toFixed(3)}`,
    );
    console.log(
        `Ratio: ${(maxY2 / maxY1).toFixed(2)} (should be ~4.0 if length scaling works)`,
    );

    console.log("\n🔧 Testing Thickness Parameter:");

    // Test with thin branches
    const geo3 = lsystem.interpretToGeometry(
        lsystemString,
        1.0,
        0.05,
        0.8,
        [0, 1, 0],
    );

    // Test with thick branches
    const geo4 = lsystem.interpretToGeometry(
        lsystemString,
        1.0,
        0.3,
        0.8,
        [0, 1, 0],
    );

    // Check radial distance from center (thickness indicator)
    const getRadialDistance = (vertices, index) => {
        const x = vertices[index * 3];
        const z = vertices[index * 3 + 2];
        return Math.sqrt(x * x + z * z);
    };

    const radius1 = getRadialDistance(geo3.vertices, 0);
    const radius2 = getRadialDistance(geo4.vertices, 0);
    console.log(`Thickness 0.05: Radial distance ${radius1.toFixed(4)}`);
    console.log(`Thickness 0.30: Radial distance ${radius2.toFixed(4)}`);
    console.log(
        `Ratio: ${(radius2 / radius1).toFixed(2)} (should be ~6.0 if thickness scaling works)`,
    );

    console.log("\n🎯 Testing Tapering Parameter:");

    // Test with no tapering (same thickness throughout)
    const geo5 = lsystem.interpretToGeometry(
        lsystemString,
        1.0,
        0.2,
        1.0,
        [0, 0, 1],
    );

    // Test with heavy tapering
    const geo6 = lsystem.interpretToGeometry(
        lsystemString,
        1.0,
        0.2,
        0.5,
        [0, 0, 1],
    );

    console.log(`No tapering (1.0): ${geo5.vertices.length / 3} vertices`);
    console.log(`Heavy tapering (0.5): ${geo6.vertices.length / 3} vertices`);

    // Check thickness variation within the first cylinder segment
    // Each cylinder has multiple ring pairs, check first vs second ring
    const segments = 8; // Should match the segments in addCylinder

    // For no tapering: first ring vs second ring should be similar
    const firstRingRadius5 = getRadialDistance(geo5.vertices, 0);
    const secondRingRadius5 = getRadialDistance(
        geo5.vertices,
        2 * (segments + 1),
    );

    // For heavy tapering: first ring vs second ring should be different
    const firstRingRadius6 = getRadialDistance(geo6.vertices, 0);
    const secondRingRadius6 = getRadialDistance(
        geo6.vertices,
        2 * (segments + 1),
    );

    console.log(
        `No tapering - First ring: ${firstRingRadius5.toFixed(4)}, Later ring: ${secondRingRadius5.toFixed(4)}`,
    );
    console.log(
        `Heavy tapering - First ring: ${firstRingRadius6.toFixed(4)}, Later ring: ${secondRingRadius6.toFixed(4)}`,
    );

    const taperingRatio = secondRingRadius6 / firstRingRadius6;
    console.log(
        `Tapering ratio: ${taperingRatio.toFixed(3)} (should be < 1.0 for heavy tapering)`,
    );

    console.log("\n🎨 Testing Leaf Color Parameter:");

    // Generate system with leaves
    const leafSystem = new LSystem(
        "FL", // Axiom with a leaf
        [], // No rules, keep it simple
        25, // angle
        0, // No variation
        0, // No variation
        1.0, // Always generate leaves
        0, // Low threshold for leaves
    );

    const leafString = leafSystem.generate(0); // Just "FL"

    const geoRed = leafSystem.interpretToGeometry(
        leafString,
        1.0,
        0.1,
        0.8,
        [1, 0, 0],
    );
    const geoBlue = leafSystem.interpretToGeometry(
        leafString,
        1.0,
        0.1,
        0.8,
        [0, 0, 1],
    );

    if (geoRed.leafColors.length > 0 && geoBlue.leafColors.length > 0) {
        console.log(
            `Red leaves: R=${geoRed.leafColors[0].toFixed(2)}, G=${geoRed.leafColors[1].toFixed(2)}, B=${geoRed.leafColors[2].toFixed(2)}`,
        );
        console.log(
            `Blue leaves: R=${geoBlue.leafColors[0].toFixed(2)}, G=${geoBlue.leafColors[1].toFixed(2)}, B=${geoBlue.leafColors[2].toFixed(2)}`,
        );
    } else {
        console.log("No leaf colors found - leaves might not be generating");
    }

    console.log("\n📊 Summary:");

    // Check if parameters are working
    const lengthWorks = Math.abs(maxY2 / maxY1 - 4.0) < 1.0; // Should be close to 4x
    const thicknessWorks = Math.abs(radius2 / radius1 - 6.0) < 2.0; // Should be close to 6x
    const taperingWorks = taperingRatio < 0.9; // Should be significantly less than 1.0

    console.log(
        `✓ Length parameter: ${lengthWorks ? "WORKING" : "NOT WORKING"}`,
    );
    console.log(
        `✓ Thickness parameter: ${thicknessWorks ? "WORKING" : "NOT WORKING"}`,
    );
    console.log(
        `✓ Tapering parameter: ${taperingWorks ? "WORKING" : "NOT WORKING"}`,
    );

    if (lengthWorks && thicknessWorks && taperingWorks) {
        console.log("\n🎉 All geometry parameters are working correctly!");
    } else {
        console.log(
            "\n❌ Some geometry parameters are not working as expected.",
        );
        console.log(
            "This explains why the UI controls don't affect the plant appearance.",
        );
    }
} catch (error) {
    console.error("❌ Debug failed:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
}
