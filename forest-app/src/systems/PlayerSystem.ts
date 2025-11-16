import * as THREE from "three";

export class PlayerSystem {
    constructor(scene, camera, controls, ground) {
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.ground = ground;

        // Movement physics variables
        this.gravity = -30;
        this.jumpForce = 10;
        this.groundLevel = -2;
        this.flyMode = false;
        this.raycaster = new THREE.Raycaster();
        this.jumpCooldown = 0;
        this.isLanding = false;
        this.landingTime = 0;

        // Stamina system
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaRegenRate = 20;
        this.runStaminaDrain = 30;
        this.jumpStaminaCost = 15;

        // Footstep system
        this.lastFootstepTime = 0;
        this.footstepInterval = 0.5; // Time between footsteps when walking
        this.runFootstepInterval = 0.3; // Time between footsteps when running
        this.totalDistanceMoved = 0;

        // Sprint toggle
        this.sprintToggled = false;
        this.autoRun = false;

        // Environmental feedback
        this.lastTerrainType = "normal";
        this.windEffect = new THREE.Vector3();
        this.bobAmount = 0;
        this.bobSpeed = 0;

        // Movement state
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;
        this.canJump = true;
        this.isRunning = false;
        this.onGround = true;

        // Head bobbing
        this.bobAmplitude = 0.02;
        this.bobFrequency = 8;
        this.bobTime = 0;

        this.clock = new THREE.Clock();
        this.setupControls();
    }

    setupControls() {
        // Keyboard controls are now handled via the global event system
        // through ForestGenerator.onKeyDown() -> PlayerSystem.onKeyDown()
        // This prevents duplicate event listeners and conflicts

        document.addEventListener("keyup", (event) => {
            switch (event.code) {
                case "ArrowUp":
                case "KeyW":
                    this.moveForward = false;
                    break;
                case "ArrowLeft":
                case "KeyA":
                    this.moveLeft = false;
                    break;
                case "ArrowDown":
                case "KeyS":
                    this.moveBackward = false;
                    break;
                case "ArrowRight":
                case "KeyD":
                    this.moveRight = false;
                    break;
                case "Space":
                    if (this.flyMode) {
                        this.moveUp = false;
                    }
                    break;
                case "KeyC":
                    this.moveDown = false;
                    break;
                case "ShiftLeft":
                case "ShiftRight":
                    if (!this.sprintToggled) {
                        this.isRunning = false;
                    }
                    break;
            }
        });
    }

    updateMovement() {
        const delta = this.clock.getDelta();
        this.lastFootstepTime += delta;

        // Update head bobbing
        this.updateHeadBob(delta);

        // Handle stamina system
        if (
            this.isRunning &&
            !this.flyMode &&
            (this.moveForward ||
                this.moveBackward ||
                this.moveLeft ||
                this.moveRight)
        ) {
            // Drain stamina when running
            this.stamina = Math.max(
                0,
                this.stamina - this.runStaminaDrain * delta,
            );
            if (this.stamina <= 0) {
                this.isRunning = false; // Force stop running when exhausted
            }
        } else {
            // Regenerate stamina when not running
            this.stamina = Math.min(
                this.maxStamina,
                this.stamina + this.staminaRegenRate * delta,
            );
        }
        this.updateStaminaBar();

        // Adjust speed based on stamina
        let speed = 10; // Base walking speed
        if (this.isRunning && this.stamina > 0) {
            speed = 20; // Running speed
        } else if (this.stamina < 20) {
            speed = 15; // Tired walking speed
        }

        // Update jump cooldown and landing effects
        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= delta;
        }

        if (this.isLanding) {
            this.landingTime -= delta;
            if (this.landingTime <= 0) {
                this.isLanding = false;
            }
        }

        // Get camera direction vectors
        const cameraObject = this.controls.getObject();
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);

        // Get forward direction from camera
        cameraObject.getWorldDirection(forward);

        // For ground movement, ignore Y component of forward vector
        if (!this.flyMode) {
            forward.y = 0;
            forward.normalize();
        }

        // Get right direction (perpendicular to forward)
        right.crossVectors(forward, up).normalize();

        // Calculate horizontal movement vector based on input
        const movement = new THREE.Vector3();

        if (this.moveForward) {
            movement.add(forward.clone().multiplyScalar(speed * delta));
        }
        if (this.moveBackward) {
            movement.add(forward.clone().multiplyScalar(-speed * delta));
        }
        if (this.moveLeft) {
            movement.add(right.clone().multiplyScalar(-speed * delta));
        }
        if (this.moveRight) {
            movement.add(right.clone().multiplyScalar(speed * delta));
        }

        // Handle vertical movement based on mode
        if (this.flyMode) {
            // In fly mode, allow direct up/down movement
            if (this.moveUp) {
                movement.add(up.clone().multiplyScalar(speed * delta));
            }
            if (this.moveDown) {
                movement.add(up.clone().multiplyScalar(-speed * delta));
            }
        } else {
            // In walking mode, apply gravity and ground collision
            this.velocity.y += this.gravity * delta;

            // Get ground height at current and next position
            const currentPos = cameraObject.position;
            const nextX = currentPos.x + movement.x;
            const nextZ = currentPos.z + movement.z;

            const groundHeight = this.getGroundHeight(nextX, nextZ);
            const minHeight = groundHeight + 1.6; // Player eye height above ground

            // Apply vertical velocity
            const newY = currentPos.y + this.velocity.y * delta;

            if (newY <= minHeight) {
                // Hit ground - landing detection
                const wasInAir = !this.onGround;
                cameraObject.position.y = minHeight;
                this.velocity.y = 0;
                this.onGround = true;
                this.canJump = true;

                // Landing feedback
                if (wasInAir && !this.flyMode) {
                    this.isLanding = true;
                    this.landingTime = 0.1;
                    // Add subtle camera shake on landing
                    const shakeMagnitude = Math.min(
                        Math.abs(this.velocity.y) * 0.01,
                        0.1,
                    );
                    cameraObject.position.x +=
                        (Math.random() - 0.5) * shakeMagnitude;
                    cameraObject.position.z +=
                        (Math.random() - 0.5) * shakeMagnitude;
                }
            } else {
                // In air
                movement.y = this.velocity.y * delta;
                this.onGround = false;
            }
        }

        // Apply horizontal movement to camera with boundary checking
        const oldPosition = cameraObject.position.clone();
        const newPosition = cameraObject.position.clone().add(movement);

        // Keep player within world bounds (ground is 2000x2000 centered at origin)
        const worldBounds = 900; // Leave some margin from the 1000 radius
        newPosition.x = Math.max(
            -worldBounds,
            Math.min(worldBounds, newPosition.x),
        );
        newPosition.z = Math.max(
            -worldBounds,
            Math.min(worldBounds, newPosition.z),
        );

        cameraObject.position.copy(newPosition);

        // Handle footstep effects
        if (!this.flyMode && this.onGround) {
            const horizontalMovement = new THREE.Vector3(
                newPosition.x - oldPosition.x,
                0,
                newPosition.z - oldPosition.z,
            );
            const distanceMoved = horizontalMovement.length();

            if (distanceMoved > 0.01) {
                // Only if actually moving
                this.totalDistanceMoved += distanceMoved;

                const currentInterval = this.isRunning
                    ? this.runFootstepInterval
                    : this.footstepInterval;

                if (this.lastFootstepTime >= currentInterval) {
                    this.playFootstep();
                    this.lastFootstepTime = 0;
                }
            }
        }

        // Add subtle wind effect in fly mode
        if (this.flyMode && Math.random() < 0.01) {
            this.windEffect.set(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.02,
            );
            cameraObject.position.add(this.windEffect);
        }
    }

    updateHeadBob(delta) {
        if (
            !this.flyMode &&
            this.onGround &&
            (this.moveForward ||
                this.moveBackward ||
                this.moveLeft ||
                this.moveRight)
        ) {
            this.bobTime += delta * this.bobFrequency;
            const bobOffset = Math.sin(this.bobTime) * this.bobAmplitude;

            // Apply subtle head bob to camera position
            const cameraObject = this.controls.getObject();
            const baseY =
                this.getGroundHeight(
                    cameraObject.position.x,
                    cameraObject.position.z,
                ) + 1.6;
            cameraObject.position.y = baseY + bobOffset;
        } else {
            this.bobTime = 0;
        }
    }

    getGroundHeight(x, z) {
        // Cast ray downward to find ground height
        this.raycaster.set(
            new THREE.Vector3(x, 100, z),
            new THREE.Vector3(0, -1, 0),
        );
        const intersects = this.raycaster.intersectObject(this.ground, true);

        if (intersects.length > 0) {
            return intersects[0].point.y;
        }

        // Return default ground level if no intersection found
        return this.groundLevel;
    }

    toggleFlyMode() {
        this.flyMode = !this.flyMode;

        // Reset velocity when switching modes
        this.velocity.set(0, 0, 0);

        // Show mode indicator
        const indicator = document.getElementById("fly-mode-indicator");
        if (indicator) {
            indicator.textContent = this.flyMode ? "FLY MODE" : "WALK MODE";
            indicator.style.color = this.flyMode ? "#00ff00" : "#ffffff";
        }

        console.log(`${this.flyMode ? "Fly" : "Walk"} mode activated`);
        return this.flyMode;
    }

    toggleSprintMode() {
        this.sprintToggled = !this.sprintToggled;
        if (this.sprintToggled) {
            this.isRunning = true;
            console.log("Sprint mode toggled ON - you will run continuously");
        } else {
            this.isRunning = false;
            console.log("Sprint mode toggled OFF - hold Shift to run");
        }
    }

    updateStaminaBar() {
        const staminaFill = document.getElementById("stamina-fill");
        const staminaBar = document.getElementById("stamina-bar");

        if (staminaFill && staminaBar) {
            const percentage = (this.stamina / this.maxStamina) * 100;
            staminaFill.style.width = percentage + "%";

            // Change color based on stamina level
            if (percentage > 60) {
                staminaFill.style.background =
                    "linear-gradient(90deg, #00ff00, #7fff00)";
            } else if (percentage > 30) {
                staminaFill.style.background =
                    "linear-gradient(90deg, #ffff00, #ffa500)";
            } else {
                staminaFill.style.background =
                    "linear-gradient(90deg, #ff4500, #ff0000)";
            }

            // Hide stamina bar when full and not running
            if (percentage >= 100 && !this.isRunning) {
                staminaBar.style.opacity = "0.3";
            } else {
                staminaBar.style.opacity = "1";
            }
        }
    }

    playFootstep() {
        // Visual footstep effect - create small dust particles
        if (this.scene && this.ground) {
            const cameraPos = this.controls.getObject().position;
            const groundHeight = this.getGroundHeight(cameraPos.x, cameraPos.z);

            // Create small particle effect at foot level
            const particleCount = 3;
            for (let i = 0; i < particleCount; i++) {
                const particle = this.createDustParticle(
                    cameraPos.x + (Math.random() - 0.5) * 0.5,
                    groundHeight + 0.1,
                    cameraPos.z + (Math.random() - 0.5) * 0.5,
                );
                this.scene.add(particle);

                // Remove particle after animation
                setTimeout(() => {
                    this.scene.remove(particle);
                    particle.geometry?.dispose();
                    particle.material?.dispose();
                }, 1000);
            }
        }

        // Audio footstep (placeholder - could be implemented with Web Audio API)
        // this.playFootstepSound();
    }

    createDustParticle(x, y, z) {
        const geometry = new THREE.SphereGeometry(0.02, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0x8b4513,
            transparent: true,
            opacity: 0.6,
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.set(x, y, z);

        // Animate the particle
        const initialY = y;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / 1.0; // 1 second duration

            if (progress < 1) {
                particle.position.y =
                    initialY + Math.sin(progress * Math.PI) * 0.2;
                particle.material.opacity = 0.6 * (1 - progress);
                requestAnimationFrame(animate);
            }
        };
        animate();

        return particle;
    }

    initializePlayerPosition() {
        const cameraObject = this.controls.getObject();
        cameraObject.position.set(0, 1.6, 50);
        this.velocity.set(0, 0, 0);
    }

    update(delta) {
        this.updateMovement();
    }

    async init() {
        // Initialize player system
        console.log("PlayerSystem initialized");
    }

    onKeyDown(event) {
        switch (event.code) {
            case "ArrowUp":
            case "KeyW":
                this.moveForward = true;
                break;
            case "ArrowLeft":
            case "KeyA":
                this.moveLeft = true;
                break;
            case "ArrowDown":
            case "KeyS":
                this.moveBackward = true;
                break;
            case "ArrowRight":
            case "KeyD":
                this.moveRight = true;
                break;
            case "Space":
                event.preventDefault();
                if (
                    !this.flyMode &&
                    this.onGround &&
                    this.canJump &&
                    this.jumpCooldown <= 0 &&
                    this.stamina >= this.jumpStaminaCost
                ) {
                    this.velocity.y = this.jumpForce;
                    this.onGround = false;
                    this.canJump = false;
                    this.jumpCooldown = 0.3; // 300ms cooldown
                    this.isLanding = false;
                    this.stamina -= this.jumpStaminaCost;
                    this.updateStaminaBar();
                } else if (this.flyMode) {
                    this.moveUp = true;
                }
                break;
            case "KeyC":
                this.moveDown = true;
                break;
            case "ShiftLeft":
            case "ShiftRight":
                if (this.sprintToggled) {
                    this.sprintToggled = false;
                    this.isRunning = false;
                } else {
                    this.isRunning = true;
                }
                break;
            case "KeyF":
                console.log("F key pressed - toggling fly mode");
                this.toggleFlyMode();
                break;
            case "KeyR":
                this.toggleSprintMode();
                break;
            case "KeyH":
                // Show tutorial - delegate to ForestGenerator which will call UISystem
                if (
                    (window as any).forestGenerator &&
                    (window as any).forestGenerator.uiSystem
                ) {
                    (window as any).forestGenerator.uiSystem.showTutorial();
                }
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case "ArrowUp":
            case "KeyW":
                this.moveForward = false;
                break;
            case "ArrowLeft":
            case "KeyA":
                this.moveLeft = false;
                break;
            case "ArrowDown":
            case "KeyS":
                this.moveBackward = false;
                break;
            case "ArrowRight":
            case "KeyD":
                this.moveRight = false;
                break;
            case "Space":
                if (this.flyMode) {
                    this.moveUp = false;
                }
                break;
            case "KeyC":
                this.moveDown = false;
                break;
            case "ShiftLeft":
            case "ShiftRight":
                if (!this.sprintToggled) {
                    this.isRunning = false;
                }
                break;
        }
    }

    getStats() {
        return {
            stamina: this.stamina,
            maxStamina: this.maxStamina,
            flyMode: this.flyMode,
            onGround: this.onGround,
            isRunning: this.isRunning,
            position: this.camera
                ? {
                      x: this.camera.position.x,
                      y: this.camera.position.y,
                      z: this.camera.position.z,
                  }
                : { x: 0, y: 0, z: 0 },
        };
    }

    dispose() {
        // Clean up event listeners and resources
        // Note: In a production app, you'd want to store references to the event listeners
        // to properly remove them here
        console.log("PlayerSystem disposed");
    }
}
