import { CameraController } from "./CameraController.js";

export class InputHandler {
    private canvas: HTMLCanvasElement;
    private cameraController: CameraController;

    // Mouse state
    private isDragging: boolean = false;
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;

    // Event listeners (stored for cleanup)
    private eventListeners: Array<{
        element: EventTarget;
        event: string;
        listener: EventListener;
    }> = [];

    constructor(canvas: HTMLCanvasElement, cameraController: CameraController) {
        this.canvas = canvas;
        this.cameraController = cameraController;
        this.setupEventListeners();
    }

    public setupEventListeners(): void {
        // Mouse wheel zoom
        const wheelHandler = (e: Event) => this.handleWheel(e as WheelEvent);
        this.canvas.addEventListener("wheel", wheelHandler, { passive: false });
        this.eventListeners.push({
            element: this.canvas,
            event: "wheel",
            listener: wheelHandler,
        });

        // Mouse drag controls
        const mouseDownHandler = (e: Event) =>
            this.handleMouseDown(e as MouseEvent);
        const mouseMoveHandler = (e: Event) =>
            this.handleMouseMove(e as MouseEvent);
        const mouseUpHandler = (e: Event) =>
            this.handleMouseUp(e as MouseEvent);

        this.canvas.addEventListener("mousedown", mouseDownHandler);
        this.canvas.addEventListener("mousemove", mouseMoveHandler);
        window.addEventListener("mouseup", mouseUpHandler);
        this.canvas.addEventListener("mouseleave", mouseUpHandler);

        this.eventListeners.push(
            {
                element: this.canvas,
                event: "mousedown",
                listener: mouseDownHandler,
            },
            {
                element: this.canvas,
                event: "mousemove",
                listener: mouseMoveHandler,
            },
            { element: window, event: "mouseup", listener: mouseUpHandler },
            {
                element: this.canvas,
                event: "mouseleave",
                listener: mouseUpHandler,
            },
        );

        // Touch controls for mobile
        const touchStartHandler = (e: Event) =>
            this.handleTouchStart(e as TouchEvent);
        const touchMoveHandler = (e: Event) =>
            this.handleTouchMove(e as TouchEvent);
        const touchEndHandler = (e: Event) =>
            this.handleTouchEnd(e as TouchEvent);

        this.canvas.addEventListener("touchstart", touchStartHandler, {
            passive: false,
        });
        this.canvas.addEventListener("touchmove", touchMoveHandler, {
            passive: false,
        });
        this.canvas.addEventListener("touchend", touchEndHandler, {
            passive: false,
        });

        this.eventListeners.push(
            {
                element: this.canvas,
                event: "touchstart",
                listener: touchStartHandler,
            },
            {
                element: this.canvas,
                event: "touchmove",
                listener: touchMoveHandler,
            },
            {
                element: this.canvas,
                event: "touchend",
                listener: touchEndHandler,
            },
        );

        // Keyboard handlers for Alt key cursor management
        const keyDownHandler = (e: Event) =>
            this.handleKeyDown(e as KeyboardEvent);
        const keyUpHandler = (e: Event) => this.handleKeyUp(e as KeyboardEvent);

        document.addEventListener("keydown", keyDownHandler);
        document.addEventListener("keyup", keyUpHandler);

        this.eventListeners.push(
            { element: document, event: "keydown", listener: keyDownHandler },
            { element: document, event: "keyup", listener: keyUpHandler },
        );

        // Setup zoom slider integration if it exists
        this.setupZoomSliderIntegration();

        // Set initial cursor
        this.canvas.style.cursor = "grab";
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (e.altKey && !this.isDragging) {
            this.canvas.style.cursor = "move";
        }
    }

    private handleKeyUp(e: KeyboardEvent): void {
        if (!e.altKey && !this.isDragging) {
            this.canvas.style.cursor = "grab";
        }
    }

    private handleWheel(e: WheelEvent): void {
        e.preventDefault();

        const zoomSpeed = 0.1;
        const delta = e.deltaY > 0 ? 1 : -1;
        const currentZoom = this.cameraController.getZoom();
        const newZoom = Math.max(
            1.0,
            Math.min(30.0, currentZoom + delta * zoomSpeed),
        );

        this.cameraController.setZoom(newZoom);
        this.updateZoomDisplay(newZoom);
    }

    private handleMouseDown(e: MouseEvent): void {
        if (e.button === 0) {
            // Left mouse button
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            if (e.altKey) {
                this.canvas.style.cursor = "move";
            } else {
                this.canvas.style.cursor = "grabbing";
            }
            e.preventDefault();
        }
    }

    private handleMouseMove(e: MouseEvent): void {
        if (this.isDragging) {
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;

            if (e.altKey) {
                // Pan mode when Alt is held
                const panSensitivity = 0.005;
                const zoom = this.cameraController.getZoom();
                this.cameraController.addPan(
                    deltaX * panSensitivity * zoom * 0.2,
                    -deltaY * panSensitivity * zoom * 0.2,
                );
                this.canvas.style.cursor = "move";
            } else {
                // Rotate based on mouse movement
                const sensitivity = 0.01;
                this.cameraController.addManualRotation(
                    deltaY * sensitivity,
                    deltaX * sensitivity,
                );
                this.canvas.style.cursor = "grabbing";
            }

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        } else {
            // Update cursor based on Alt key state when not dragging
            if (e.altKey) {
                this.canvas.style.cursor = "move";
            } else {
                this.canvas.style.cursor = "grab";
            }
        }
    }

    private handleMouseUp(e: MouseEvent): void {
        if (e.button === 0 || e.type === "mouseleave") {
            this.isDragging = false;
            if ((e as MouseEvent).altKey) {
                this.canvas.style.cursor = "move";
            } else {
                this.canvas.style.cursor = "grab";
            }
        }
    }

    private handleTouchStart(e: TouchEvent): void {
        e.preventDefault();

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.isDragging = true;
            this.lastMouseX = touch.clientX;
            this.lastMouseY = touch.clientY;
        }
    }

    private handleTouchMove(e: TouchEvent): void {
        e.preventDefault();

        if (!this.isDragging || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - this.lastMouseX;
        const deltaY = touch.clientY - this.lastMouseY;

        const sensitivity = 0.01;
        this.cameraController.addManualRotation(
            deltaY * sensitivity,
            deltaX * sensitivity,
        );

        this.lastMouseX = touch.clientX;
        this.lastMouseY = touch.clientY;
    }

    private handleTouchEnd(e: TouchEvent): void {
        e.preventDefault();
        this.isDragging = false;
    }

    private setupZoomSliderIntegration(): void {
        const zoomSlider = document.getElementById(
            "zoomSlider",
        ) as HTMLInputElement;

        if (zoomSlider) {
            const sliderHandler = () => {
                const zoomValue = parseFloat(zoomSlider.value);
                this.cameraController.setZoom(zoomValue);
                this.updateZoomDisplay(zoomValue);
            };

            zoomSlider.addEventListener("input", sliderHandler);
            this.eventListeners.push({
                element: zoomSlider,
                event: "input",
                listener: sliderHandler,
            });
        }
    }

    private updateZoomDisplay(zoomValue: number): void {
        // Update the zoom slider in the UI if it exists
        const zoomSlider = document.getElementById("zoom") as HTMLInputElement;
        if (zoomSlider) {
            zoomSlider.value = zoomValue.toString();
            // Update the display value
            const zoomDisplay = document.getElementById(
                "zoom-value",
            ) as HTMLElement;
            if (zoomDisplay) {
                zoomDisplay.textContent = zoomValue.toFixed(1);
            }
        }
    }

    public dispose(): void {
        // Remove all event listeners
        for (const { element, event, listener } of this.eventListeners) {
            element.removeEventListener(event, listener);
        }
        this.eventListeners = [];

        // Reset canvas cursor
        this.canvas.style.cursor = "";
    }
}
