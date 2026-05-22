import { Graphics, Text } from "pixi.js";

export type OrbitConfig = {
    w: number;
    h: number;
    offset?: number;
};

export type PlanetConfig = {
    name: string;
    radius: number;
    orbit: OrbitConfig;
    fill?: string;
    speed?: number
    scale?: number;
    glow?: {
        color: number;
        radiusMultiplier?: number;
        alpha?: number;
    };
    ring?: {
        color: number;
        width?: number;
        alpha?: number;
        radiusXMultiplier?: number;
        radiusYMultiplier?: number;
    }
};

type ResolvedOrbitConfig = {
    w: number;
    h: number;
    offset: number;
};

export class Planet {
    public name: string;
    public planetRadius: number;
    public fill: string;
    public orbit: ResolvedOrbitConfig;
    public planetSpeed: number;
    public graphics: Graphics;
    public visualScale: number;
    public isHovered: boolean;
    public label: Text;
    public glow?: Graphics;
    public ring?: Graphics;
    x = 1;
    y = 1;

    constructor(config: PlanetConfig) {
        this.name = config.name;
        this.planetRadius = config.radius;
        this.fill = config.fill ?? "#AAAAAAAA";
        this.planetSpeed = config.speed ?? 1;
        this.visualScale = config.scale ?? 1;
        this.isHovered = false;

        this.orbit = {
            w: config.orbit.w,
            h: config.orbit.h,
            offset: config.orbit.offset ?? Math.PI,
        }

        // Main planet graphics
        this.graphics = new Graphics()
            .circle(0, 0, config.radius)
            .fill(this.fill);

        // Glow
        if (config.glow) {
            const radiusMultiplier = config.glow.radiusMultiplier ?? 1.8;
            const alpha = config.glow.alpha ?? 0.16;

            this.glow = new Graphics()
                .circle(0, 0, this.planetRadius * radiusMultiplier)
                .fill({
                    color: config.glow?.color,
                    alpha,
                });

            this.glow.zIndex = -2;
        }

        // Ring
        if (config.ring) {
            const width = config.ring.width ?? 2;
            const alpha = config.ring.alpha ?? 0.5;
            const radiusXMultiplier = config.ring.radiusXMultiplier ?? 1.7;
            const radiusYMultiplier = config.ring.radiusYMultiplier ?? 0.45;

            this.ring = new Graphics()
                .ellipse(
                    0,
                    0,
                    this.planetRadius * radiusXMultiplier,
                    this.planetRadius * radiusYMultiplier,
                )
                .stroke({
                    width,
                    color: config.ring.color,
                    alpha,
                });
        }


        // Hover
        this.graphics.eventMode = "static";
        this.graphics.cursor = "pointer";

        this.graphics.on("pointerenter", () => {
            this.isHovered = true;
        })
        this.graphics.on("pointerleave", () => {
            this.isHovered = false;
        })

        this.label = new Text({
            text: this.name,
            style: {
                fill: 0xffffff,
                fontSize: 13,
                fontFamily: "monospace",
            },
        });
        this.label.alpha = 0;
        this.label.anchor.set(0.5);
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

    updateGraphics() {
        this.graphics.position.set(this.x, this.y);
        this.graphics.scale.set(this.visualScale);
        this.graphics.zIndex = this.y;

        if (this.glow) {
            this.glow.position.set(this.x, this.y);
            this.glow.scale.set(this.visualScale);
        }

        if (this.ring) {
            this.ring.position.set(this.x, this.y);
            this.ring.scale.set(this.visualScale);
            this.ring.zIndex = this.graphics.zIndex + 0.5;
        }

        this.label.position.set(this.x, this.y - this.planetRadius * this.visualScale - 12);
        this.label.alpha = this.isHovered ? 0.85 : 0;
        this.label.zIndex = this.graphics.zIndex + 1;
    }
}
