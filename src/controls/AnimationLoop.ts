export class AnimationLoop {
    private renderCallback: (time: number) => void;
    private animationId: number | null = null;
    private isRunning: boolean = false;

    constructor(renderCallback: (time: number) => void) {
        this.renderCallback = renderCallback;
    }

    public start(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.animate(0);
    }

    private animate = (time: number): void => {
        if (!this.isRunning) return;

        this.renderCallback(time);
        this.animationId = requestAnimationFrame(this.animate);
    }

    public stop(): void {
        if (!this.isRunning) return;

        this.isRunning = false;

        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    public isActive(): boolean {
        return this.isRunning;
    }

    public dispose(): void {
        this.stop();
    }
}
