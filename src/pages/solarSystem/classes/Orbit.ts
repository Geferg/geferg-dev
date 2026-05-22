import { Graphics } from "pixi.js";
import type { Planet } from "./Planet";

export class Orbit {
    speed = 1;
    t = 0;
    origin = { x: 0, y: 0 };
    public planets: Planet[] = [];
    orbitPaths: Graphics[] = [];

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
                .stroke({ width: 1, color: 0xffffff, alpha: 0.12 });

            path.zIndex = -1;
            this.orbitPaths.push(path);
        }
    }

    updateOrbitPaths() {
        for (let i = 0; i < this.planets.length; i++) {
            const p = this.planets[i];

            if (p?.name === "Pluto") {
                continue;
            }

            const path = this.orbitPaths[i] ?? new Graphics();
            path.clear();

            path
                .ellipse(this.origin.x, this.origin.y, p!.orbit.w, p!.orbit.h)
                .stroke({ width: 1, color: 0xffffff, alpha: 0.12 });

            path.zIndex = -1;

            this.orbitPaths[i] = path;
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
}
