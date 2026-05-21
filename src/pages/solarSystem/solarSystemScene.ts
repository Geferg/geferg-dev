import { Application, Graphics, Ticker, Container } from "pixi.js";

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

    update(dt: number) {
        this.t += dt;
        this.updatePlanetPositions();
        this.updatePlanetGraphics();
    }

    updatePlanetPositions() {
        for (const p of this.planets) {
            p.x = this.origin.x + Math.cos(this.speed * p.planetSpeed * this.t + p.orbit.offset) * p.orbit.w;
            p.y = this.origin.y + Math.sin(this.speed * p.planetSpeed * this.t + p.orbit.offset) * p.orbit.h;
        }
    }

    updatePlanetGraphics() {
        for (const p of this.planets) {
            p.updateGraphics();
        }
    }
}

class Planet {
    public x = 1;
    public y = 1;
    public graphics: Graphics;

    constructor(
        public name: string,
        public planetRadius: number,
        public orbit = { w: 400, h: 100, offset: Math.PI },
        public planetSpeed: number = 1,
        public fill: string = "#AAAAAAAA",
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

    updateGraphics() {
        this.graphics.position.set(this.x, this.y);
    }

}

export function createSolarSystemScene(app: Application) {
    const centerX = app.screen.width / 2;
    const centerY = app.screen.height / 2;

    const worldLayer = new Container();

    const earth = new Graphics()
        .circle(0, 0, 40)
        .fill("#2AD4FF");

    const sun = new Graphics()
        .circle(0, 0, 90)
        .fill("#AA7700");

    const pluto = new Graphics()
        .circle(0, 0, 6)
        .fill("999999");

    let saturn = new Planet("saturn", 60);
    saturn.x = 200;
    saturn.y = 200;


    let saturnOrbit = new Orbit(saturn.x, saturn.y);

    let hyperion = new Planet("hyperion", 9, { w: 100, h: 100, offset: 0 });
    saturnOrbit.planets.push(hyperion);


    let globalSpeed = 0.3;
    let earthSpeed = 1;
    let plutoSpeed = 0.5;

    worldLayer.sortableChildren = true;
    sun.position.set(centerX, centerY);

    app.stage.addChild(worldLayer);
    worldLayer.addChild(earth);
    worldLayer.addChild(sun);
    worldLayer.addChild(pluto);
    worldLayer.addChild(saturn.graphics);

    for (const p of saturnOrbit.planets) {
        worldLayer.addChild(p.graphics);
    }

    let time = 0;
    const animate = (ticker: Ticker) => {
        const dt = ticker.deltaMS / 1000;
        time += dt;

        pluto.x = centerX + Math.sin(globalSpeed * plutoSpeed * time + Math.PI / 2) * 700;
        pluto.y = centerY + Math.cos(globalSpeed * plutoSpeed * time + Math.PI / 2) * 250;

        earth.x = centerX + Math.sin(globalSpeed * earthSpeed * time) * 400;
        earth.y = centerY + Math.cos(globalSpeed * earthSpeed * time) * 100;

        saturn.updateGraphics();
        saturnOrbit.update(dt);

        earth.zIndex = earth.y;
        sun.zIndex = sun.y;
        pluto.zIndex = pluto.y;
    };

    app.ticker.add(animate);

    return () => {
        app.ticker.remove(animate);
        earth.destroy();
        sun.destroy();
    };
}
