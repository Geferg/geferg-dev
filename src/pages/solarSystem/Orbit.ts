import type { Planet } from "./Planet";

export class Orbit {
    speed = 1;
    t = 0;
    origin = { x: 0, y: 0 };
    public planets: Planet[] = [];

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
