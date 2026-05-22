import { Graphics } from "pixi.js";
import type { Planet } from "./Planet";

export class Orbit {
    speed = 1;
    t = 0;
    origin = { x: 0, y: 0 };
    public planets: Planet[] = [];
    orbitPaths: Graphics[] = [];
    public sunOverlayPaths: Graphics[] = [];

    constructor(
        x: number,
        y: number,
    ) {
        this.origin.x = x;
        this.origin.y = y;
    }

    update(dt: number) {
        this.t += dt;
        this.updatePlanetPositions();
        this.updatePlanetGraphics();
    }

    createOrbitPaths() {
        this.orbitPaths = [];

        for (const p of this.planets) {
            if (p.name === "Pluto") {
                continue;
            }

            const path = new Graphics()
                .ellipse(this.origin.x, this.origin.y, p.orbit.w, p.orbit.h)
                .stroke({
                    width: 1,
                    color: 0xffffff,
                    alpha: 0.12,
                });

            this.orbitPaths.push(path);
        }
    }

    createSunOverlayPaths(sunRadius: number) {
        this.sunOverlayPaths = [];

        for (const p of this.planets) {
            if (p.name === "Pluto") {
                continue;
            }

            const path = new Graphics();
            this.drawSunOverlayArc(path, p, sunRadius);

            this.sunOverlayPaths.push(path);
        }
    }

    updatePlanetPositions() {
        for (const p of this.planets) {
            const x = this.origin.x + Math.cos(this.speed * p.planetSpeed * this.t + p.orbit.offset) * p.orbit.w;
            const y = this.origin.y + Math.sin(this.speed * p.planetSpeed * this.t + p.orbit.offset) * p.orbit.h;
            p.setPosition(x, y);
        }
    }

    updatePlanetGraphics() {
        for (const p of this.planets) {
            p.updateGraphics();
        }
    }

    private drawSunOverlayArc(path: Graphics, planet: Planet, sunRadius: number) {
        const steps = 240;
        const radius = sunRadius * 1.03;

        path.clear();

        let drawing = false;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const angle = t * Math.PI * 2;

            const x = this.origin.x + Math.cos(angle) * planet.orbit.w;
            const y = this.origin.y + Math.sin(angle) * planet.orbit.h;

            const dx = x - this.origin.x;
            const dy = y - this.origin.y;

            const insideSun = Math.hypot(dx, dy) <= radius;
            const lowerHalf = y >= this.origin.y;

            if (!insideSun || !lowerHalf) {
                drawing = false;
                continue;
            }

            if (!drawing) {
                path.moveTo(x, y);
                drawing = true;
            } else {
                path.lineTo(x, y);
            }
        }

        path.stroke({
            width: 1,
            color: 0xffffff,
            alpha: 0.24,
        });
    }
}
