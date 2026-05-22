import { Graphics } from "pixi.js";

export type OrbitConfig = {
    w: number;
    h: number;
    offset?: number;
}

export type PlanetConfig = {
    name: string;
    radius: number;
    orbit: OrbitConfig;
    fill?: string;
    speed?: number;
}

export class Planet {
    public name: string;
    public planetRadius: number;
    public fill: string;
    public orbit: Required<OrbitConfig>;
    public planetSpeed: number;
    public graphics: Graphics;
    x = 1;
    y = 1;

    constructor(config: PlanetConfig) {
        this.name = config.name;
        this.planetRadius = config.radius;
        this.fill = config.fill ?? "#AAAAAAAA";
        this.planetSpeed = config.speed ?? 1;
        this.orbit = {
            w: config.orbit.w,
            h: config.orbit.h,
            offset: config.orbit.offset ?? Math.PI,
        }
        this.graphics = new Graphics()
            .circle(0, 0, config.radius)
            .fill(this.fill);
    }

    get position() {
        return {
            x: this.x,
            y: this.y
        };
    }

    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    updateGraphics(screenHeight: number) {
        this.graphics.position.set(this.x, this.y);
        this.graphics.scale.set(0.25 + (this.y / screenHeight) * 1.5);
        this.graphics.zIndex = this.y;
    }
}
