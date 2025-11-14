#!/usr/bin/env node

/**
 * L-Systems Complete System Test
 *
 * This script tests the entire L-Systems application including:
 * - Frontend build process
 * - API server functionality
 * - Plant CRUD operations
 * - Example frontend integration
 */

const { exec, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const API_BASE_URL = "http://localhost:5001";
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};

function log(message, color = "reset") {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function execAsync(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject({ error, stdout, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

class SystemTester {
    constructor() {
        this.apiServer = null;
        this.testResults = {
            build: false,
            api: false,
            crud: false,
            migration: false,
            examples: false,
        };
    }

    async runTests() {
        log("\n🌱 L-Systems Complete System Test", "cyan");
        log("================================\n", "cyan");

        try {
            await this.testBuild();
            await this.testApiServer();
            await this.testCrudOperations();
            await this.testMigration();
            await this.testExamples();

            this.printSummary();
        } catch (error) {
            log(`\n❌ Test suite failed: ${error.message}`, "red");
            process.exit(1);
        } finally {
            await this.cleanup();
        }
    }

    async testBuild() {
        log("1. Testing Frontend Build Process...", "blue");

        try {
            const { stdout, stderr } = await execAsync("npm run build");

            // Check if dist files were created
            const indexExists = fs.existsSync("./dist/index.js");
            const apiClientExists = fs.existsSync(
                "./dist/services/ApiClient.js",
            );
            const apiWrapperExists = fs.existsSync("./dist/api-wrapper.js");

            if (indexExists && apiClientExists && apiWrapperExists) {
                log("   ✅ Frontend build successful", "green");
                log("   ✅ All required files generated", "green");
                this.testResults.build = true;
            } else {
                throw new Error("Missing required build files");
            }
        } catch (error) {
            log("   ❌ Frontend build failed", "red");
            log(
                `   Error: ${error.error?.message || error.stderr || error}`,
                "red",
            );
            throw error;
        }
    }

    async testApiServer() {
        log("\n2. Testing API Server...", "blue");

        try {
            // Start API server
            this.apiServer = spawn("python", ["app.py"], {
                cwd: "./api",
                stdio: ["ignore", "pipe", "pipe"],
            });

            log("   Starting Flask API server...", "yellow");

            // Wait for server to start
            await sleep(3000);

            // Test health check
            const response = await fetch(`${API_BASE_URL}/api/health`);
            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status}`);
            }

            const health = await response.json();
            if (health.status === "healthy") {
                log("   ✅ API server started successfully", "green");
                log(
                    `   ✅ Health check passed (timestamp: ${health.timestamp})`,
                    "green",
                );
                this.testResults.api = true;
            } else {
                throw new Error("Health check returned unhealthy status");
            }
        } catch (error) {
            log("   ❌ API server test failed", "red");
            log(`   Error: ${error.message}`, "red");
            throw error;
        }
    }

    async testCrudOperations() {
        log("\n3. Testing CRUD Operations...", "blue");

        const testPlant = {
            name: "Test Plant",
            axiom: "F",
            rules: "F -> F[+F]F[-F]F",
            iterations: 4,
            angle: 25,
            angleVariation: 0,
            lengthVariation: 0,
            lengthTapering: 1.0,
            leafProbability: 0,
            leafGenerationThreshold: 0,
            length: 1.0,
            thickness: 0.1,
            tapering: 0.8,
        };

        try {
            // Test CREATE
            log("   Testing plant creation...", "yellow");
            const createResponse = await fetch(`${API_BASE_URL}/api/plants`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(testPlant),
            });

            if (!createResponse.ok) {
                throw new Error(`Create failed: ${createResponse.status}`);
            }

            const createdPlant = await createResponse.json();
            log("   ✅ Plant created successfully", "green");

            // Test READ
            log("   Testing plant retrieval...", "yellow");
            const readResponse = await fetch(
                `${API_BASE_URL}/api/plants/${encodeURIComponent(testPlant.name)}`,
            );

            if (!readResponse.ok) {
                throw new Error(`Read failed: ${readResponse.status}`);
            }

            const retrievedPlant = await readResponse.json();
            if (
                retrievedPlant.axiom === testPlant.axiom &&
                retrievedPlant.rules === testPlant.rules
            ) {
                log("   ✅ Plant retrieved successfully", "green");
            } else {
                throw new Error("Retrieved plant data does not match");
            }

            // Test LIST
            log("   Testing plant list...", "yellow");
            const listResponse = await fetch(`${API_BASE_URL}/api/plants`);

            if (!listResponse.ok) {
                throw new Error(`List failed: ${listResponse.status}`);
            }

            const plants = await listResponse.json();
            if (Array.isArray(plants) && plants.length > 0) {
                log(
                    `   ✅ Plant list retrieved (${plants.length} plants)`,
                    "green",
                );
            } else {
                throw new Error("Plant list is empty or invalid");
            }

            // Test DELETE
            log("   Testing plant deletion...", "yellow");
            const deleteResponse = await fetch(
                `${API_BASE_URL}/api/plants/name/${encodeURIComponent(testPlant.name)}`,
                {
                    method: "DELETE",
                },
            );

            if (!deleteResponse.ok) {
                throw new Error(`Delete failed: ${deleteResponse.status}`);
            }

            log("   ✅ Plant deleted successfully", "green");
            this.testResults.crud = true;
        } catch (error) {
            log("   ❌ CRUD operations test failed", "red");
            log(`   Error: ${error.message}`, "red");
            throw error;
        }
    }

    async testMigration() {
        log("\n4. Testing Migration Functionality...", "blue");

        const mockLocalStoragePlants = [
            {
                name: "Migration Test Plant",
                timestamp: Date.now(),
                axiom: "X",
                rules: "X -> F[+X]F[-X]+X",
                iterations: 3,
                angle: 30,
                angleVariation: 5,
                lengthVariation: 0.1,
                lengthTapering: 0.9,
                leafProbability: 0.7,
                leafThreshold: 2,
                length: 1.0,
                thickness: 0.05,
                tapering: 0.8,
                segments: 8,
                leafColor: "#228b22",
                zoom: 5.0,
                rotationSpeed: 0.5,
                manualRotationX: 0,
                manualRotationY: 0,
                panX: 0,
                panY: 0,
                autoRotation: 0,
            },
        ];

        try {
            log("   Testing plant migration...", "yellow");
            const migrationResponse = await fetch(
                `${API_BASE_URL}/api/plants/migrate`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plants: mockLocalStoragePlants }),
                },
            );

            if (!migrationResponse.ok) {
                throw new Error(
                    `Migration failed: ${migrationResponse.status}`,
                );
            }

            const result = await migrationResponse.json();
            if (result.migrated_count > 0) {
                log(
                    `   ✅ Migration successful (${result.migrated_count} plants migrated)`,
                    "green",
                );

                // Verify migrated plant
                const checkResponse = await fetch(
                    `${API_BASE_URL}/api/plants/${encodeURIComponent("Migration Test Plant")}`,
                );
                if (checkResponse.ok) {
                    log("   ✅ Migrated plant verified", "green");
                } else {
                    throw new Error("Migrated plant not found");
                }

                // Cleanup
                await fetch(
                    `${API_BASE_URL}/api/plants/name/${encodeURIComponent("Migration Test Plant")}`,
                    {
                        method: "DELETE",
                    },
                );

                this.testResults.migration = true;
            } else {
                throw new Error("No plants were migrated");
            }
        } catch (error) {
            log("   ❌ Migration test failed", "red");
            log(`   Error: ${error.message}`, "red");
            throw error;
        }
    }

    async testExamples() {
        log("\n5. Testing Example Files...", "blue");

        try {
            // Check if example files exist and contain API integration
            const threeJsExample = fs.readFileSync(
                "./example-threejs.html",
                "utf8",
            );
            const babylonExample = fs.readFileSync(
                "./example-babylonjs.html",
                "utf8",
            );

            const hasThreeJsIntegration =
                threeJsExample.includes("refreshPlantList") &&
                threeJsExample.includes("loadSavedPlant") &&
                threeJsExample.includes("API_BASE_URL");

            const hasBabylonIntegration =
                babylonExample.includes("refreshPlantList") &&
                babylonExample.includes("loadSavedPlant") &&
                babylonExample.includes("API_BASE_URL");

            if (hasThreeJsIntegration) {
                log("   ✅ Three.js example has API integration", "green");
            } else {
                throw new Error("Three.js example missing API integration");
            }

            if (hasBabylonIntegration) {
                log("   ✅ Babylon.js example has API integration", "green");
            } else {
                throw new Error("Babylon.js example missing API integration");
            }

            // Check if main index.html exists
            if (fs.existsSync("./index.html")) {
                log("   ✅ Main application file exists", "green");
            } else {
                throw new Error("Main application file not found");
            }

            this.testResults.examples = true;
        } catch (error) {
            log("   ❌ Example files test failed", "red");
            log(`   Error: ${error.message}`, "red");
            throw error;
        }
    }

    printSummary() {
        log("\n📊 Test Results Summary", "cyan");
        log("======================", "cyan");

        const results = [
            { name: "Frontend Build", status: this.testResults.build },
            { name: "API Server", status: this.testResults.api },
            { name: "CRUD Operations", status: this.testResults.crud },
            { name: "Migration", status: this.testResults.migration },
            { name: "Example Files", status: this.testResults.examples },
        ];

        const passed = results.filter((r) => r.status).length;
        const total = results.length;

        results.forEach((result) => {
            const status = result.status ? "✅ PASS" : "❌ FAIL";
            const color = result.status ? "green" : "red";
            log(`${result.name.padEnd(20)} ${status}`, color);
        });

        log(
            `\nOverall: ${passed}/${total} tests passed`,
            passed === total ? "green" : "red",
        );

        if (passed === total) {
            log(
                "\n🎉 All systems operational! Your L-Systems application is ready to use.",
                "green",
            );
            log("\nTo get started:", "cyan");
            log("1. Start the API server: cd api && ./start.sh", "cyan");
            log("2. Open index.html in your browser", "cyan");
            log("3. Create and save your first plant configuration", "cyan");
        } else {
            log(
                "\n⚠️ Some tests failed. Please check the errors above.",
                "yellow",
            );
        }
    }

    async cleanup() {
        if (this.apiServer) {
            log("\n🧹 Cleaning up...", "yellow");
            this.apiServer.kill("SIGTERM");
            await sleep(1000);
        }
    }
}

// Check if we have the required dependencies
async function checkDependencies() {
    const requiredFiles = [
        "package.json",
        "tsconfig.json",
        "src/index.ts",
        "api/app.py",
        "api/requirements.txt",
        "index.html",
        "example-threejs.html",
        "example-babylonjs.html",
    ];

    const missing = requiredFiles.filter((file) => !fs.existsSync(file));

    if (missing.length > 0) {
        log("❌ Missing required files:", "red");
        missing.forEach((file) => log(`   - ${file}`, "red"));
        process.exit(1);
    }

    // Check if node-fetch is available
    try {
        require("node-fetch");
    } catch (error) {
        log("⚠️ Installing node-fetch for testing...", "yellow");
        await execAsync("npm install node-fetch@2");
    }
}

// Main execution
if (require.main === module) {
    (async () => {
        try {
            await checkDependencies();
            const tester = new SystemTester();
            await tester.runTests();
        } catch (error) {
            log(`\n💥 Test setup failed: ${error.message}`, "red");
            process.exit(1);
        }
    })();
}

module.exports = SystemTester;
