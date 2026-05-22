import { Graphics } from "pixi.js";

export type CometConfig = {
    screenWidth: number;
    screenHeight: number;
};

export class Comet {
    public graphics = new Graphics();

    private screenWidth: number;
    private screenHeight: number;

    private active = false;
    private spawnTimer = 0;
    private spawnDelay = this.getNextSpawnDelay();

    private x = 0;
    private y = 0;
    private vx = 0;
    private vy = 0;
    private age = 0;
    private lifetime = 0;

    constructor(config: CometConfig) {
        this.screenWidth = config.screenWidth;
        this.screenHeight = config.screenHeight;

        this.graphics.zIndex = -5;
    }

    update(dt: number) {
        if (!this.active) {
            this.updateSpawnTimer(dt);
            return;
        }

        this.updateMovement(dt);
        this.draw();

        if (this.age >= this.lifetime) {
            this.stop();
        }
    }

    destroy() {
        this.graphics.destroy();
    }

    private updateSpawnTimer(dt: number) {
        this.spawnTimer += dt;

        if (this.spawnTimer < this.spawnDelay) {
            return;
        }

        this.spawnTimer = 0;
        this.spawnDelay = this.getNextSpawnDelay();
        this.start();
    }

    private start() {
        const fromLeft = Math.random() > 0.5;

        this.x = fromLeft ? -80 : this.screenWidth + 80;
        this.y = Math.random() * this.screenHeight * 0.45;

        this.vx = fromLeft
            ? 220 + Math.random() * 120
            : -220 - Math.random() * 120;

        this.vy = 80 + Math.random() * 80;

        this.age = 0;
        this.lifetime = 2 + Math.random();

        this.active = true;
    }

    private updateMovement(dt: number) {
        this.age += dt;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    private draw() {
        const progress = this.age / this.lifetime;
        const alpha = Math.sin(progress * Math.PI) * 0.55;

        const speed = Math.hypot(this.vx, this.vy);
        const nx = this.vx / speed;
        const ny = this.vy / speed;

        const tailLength = 90;

        this.graphics.clear();

        this.graphics
            .moveTo(this.x - nx * tailLength, this.y - ny * tailLength)
            .lineTo(this.x, this.y)
            .stroke({
                width: 1,
                color: 0xffffff,
                alpha: alpha * 0.7,
            });

        this.graphics
            .circle(this.x, this.y, 2)
            .fill({
                color: 0xffffff,
                alpha,
            });
    }

    private stop() {
        this.active = false;
        this.graphics.clear();
    }

    private getNextSpawnDelay() {
        return 5 + Math.random() * 5;
    }
}
