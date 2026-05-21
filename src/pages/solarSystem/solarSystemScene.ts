import { Application, Graphics, Ticker, Container } from "pixi.js";

const PLANET_COLORS = {
    sun: "#FFAA33",

    mercury: "#B5B7C0",
    venus: "#F2C27B",
    earth: "#2AD4FF",
    mars: "#FF6B4A",

    jupiter: "#F0B27A",
    saturn: "#F4DEB3",
    uranus: "#7EFFFF",
    neptune: "#5B7FFF",

    moon: "#F0F0F0",

    pluto: "#B08A7A",
};

class Orbit {
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

    update(dt: number, screenHeight: number) {
        this.t += dt;
        this.updatePlanetPositions();
        this.updatePlanetGraphics(screenHeight);
    }

    updatePlanetPositions() {
        for (const p of this.planets) {
            const x = this.origin.x + Math.cos(this.speed * p.planetSpeed * this.t + p.orbit.offset) * p.orbit.w;
            const y = this.origin.y + Math.sin(this.speed * p.planetSpeed * this.t + p.orbit.offset) * p.orbit.h;
            p.setPosition(x, y);
        }
    }

    updatePlanetGraphics(screenHeight: number) {
        for (const p of this.planets) {
            p.updateGraphics(screenHeight);
        }
    }
}

class Planet {
    public graphics: Graphics;
    x = 1;
    y = 1;

    constructor(
        public name: string,
        public planetRadius: number,
        public fill: string = "#AAAAAAAA",
        public orbit = { w: 400, h: 100, offset: Math.PI },
        public planetSpeed: number = 1,
    ) {
        this.graphics = new Graphics()
            .circle(0, 0, planetRadius)
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

export function createSolarSystemScene(app: Application) {
    const maxOrbitX = app.screen.width * 0.5;
    const maxOrbitY = app.screen.height * 0.45;
    const worldLayer = new Container();

    let sun = new Planet("The Sun", 100, PLANET_COLORS.sun);
    sun.setPosition(app.screen.width / 2, app.screen.height / 2);

    let mercury = new Planet("Mercury", 12, PLANET_COLORS.mercury, { w: maxOrbitX * 0.13, h: 300 * 0.13, offset: Math.random() * Math.PI * 2 }, 47.4);
    let venus = new Planet("Venus", 17, PLANET_COLORS.venus, { w: maxOrbitX * 0.17, h: 300 * 0.17, offset: Math.random() * Math.PI * 2 }, 35);
    let earth = new Planet("Earth", 18, PLANET_COLORS.earth, { w: maxOrbitX * 0.24, h: 300 * 0.24, offset: Math.random() * Math.PI * 2 }, 29.8);
    let mars = new Planet("Mars", 12, PLANET_COLORS.mars, { w: maxOrbitX * 0.31, h: 300 * 0.31, offset: Math.random() * Math.PI * 2 }, 24.1);
    let jupiter = new Planet("Jupiter", 75, PLANET_COLORS.jupiter, { w: maxOrbitX * 0.42, h: 300 * 0.42, offset: Math.random() * Math.PI * 2 }, 13.1);
    let saturn = new Planet("Saturn", 75, PLANET_COLORS.saturn, { w: maxOrbitX * 0.62, h: 300 * 0.62, offset: Math.random() * Math.PI * 2 }, 9.7);
    let uranus = new Planet("Uranus", 32, PLANET_COLORS.uranus, { w: maxOrbitX * 0.8, h: 300 * 0.8, offset: Math.random() * Math.PI * 2 }, 6.8);
    let neptune = new Planet("Neptune", 31, PLANET_COLORS.neptune, { w: maxOrbitX * 0.92, h: 300 * 0.92, offset: Math.random() * Math.PI * 2 }, 5.4);
    let pluto = new Planet("Pluto", 7, PLANET_COLORS.pluto, { w: maxOrbitX * 1.1, h: 300 * 1.1, offset: Math.random() * Math.PI * 2 }, 4.7);

    let sunOrbit = new Orbit(sun.x, sun.y);
    sunOrbit.speed = 0.01;
    sunOrbit.planets.push(mercury);
    sunOrbit.planets.push(venus);
    sunOrbit.planets.push(earth);
    sunOrbit.planets.push(mars);
    sunOrbit.planets.push(jupiter);
    sunOrbit.planets.push(saturn);
    sunOrbit.planets.push(uranus);
    sunOrbit.planets.push(neptune);
    sunOrbit.planets.push(pluto);

    worldLayer.sortableChildren = true;
    app.stage.addChild(worldLayer);
    worldLayer.addChild(sun.graphics);
    for (const p of sunOrbit.planets) {
        worldLayer.addChild(p.graphics);
    }

    sun.updateGraphics(app.screen.height);
    const animate = (ticker: Ticker) => {
        const dt = ticker.deltaMS / 1000;

        sunOrbit.update(dt, app.screen.height);
    };

    app.ticker.add(animate);

    return () => {
        app.ticker.remove(animate);
        sun.graphics.destroy();
        for (const p of sunOrbit.planets) {
            p.graphics.destroy();
        }
    };
}
