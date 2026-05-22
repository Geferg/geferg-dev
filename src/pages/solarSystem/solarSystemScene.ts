import { Application, Graphics, Ticker, Container } from "pixi.js";
import { Planet } from "./Planet";
import { Orbit } from "./Orbit";

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

function createStarField(width: number, height: number, count = 160) {
    const stars = new Graphics();

    for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 1.4 + 0.2;
        const alpha = Math.random() * 0.45 + 0.15;

        stars
            .circle(x, y, radius)
            .fill({ color: 0xffffff, alpha });
    }

    stars.zIndex = -10;
    return stars;
}

export function createSolarSystemScene(app: Application) {
    const maxOrbitX = app.screen.width * 0.5;
    const maxOrbitY = app.screen.height * 0.45;
    const worldLayer = new Container();

    // Define planets
    let sun = new Planet({
        name: "The Sun",
        radius: 100,
        fill: PLANET_COLORS.sun,
        orbit: {
            w: 0,
            h: 0,
            offset: 0,
        }
    });

    let mercury = new Planet({
        name: "Mercury",
        radius: 12,
        fill: PLANET_COLORS.mercury,
        speed: 47.4,
        orbit: {
            w: 0.13 * maxOrbitX,
            h: 0.13 * 300,
            offset: Math.random() * Math.PI * 2,
        },
    });

    let venus = new Planet({
        name: "Venus",
        radius: 17,
        fill: PLANET_COLORS.venus,
        speed: 35,
        orbit: {
            w: 0.17 * maxOrbitX,
            h: 0.17 * 300,
            offset: Math.random() * Math.PI * 2,
        },
    });

    let earth = new Planet({
        name: "Earth",
        radius: 18,
        fill: PLANET_COLORS.earth,
        speed: 29.8,
        orbit: {
            w: 0.24 * maxOrbitX,
            h: 0.24 * 300,
            offset: Math.random() * Math.PI * 2,
        },
    });


    let mars = new Planet({
        name: "Mars",
        radius: 12,
        fill: PLANET_COLORS.mars,
        speed: 24.1,
        orbit: {
            w: 0.31 * maxOrbitX,
            h: 0.31 * 300,
            offset: Math.random() * Math.PI * 2,
        },
    });

    let jupiter = new Planet({
        name: "Jupiter",
        radius: 75,
        fill: PLANET_COLORS.jupiter,
        speed: 13.1,
        orbit: {
            w: 0.42 * maxOrbitX,
            h: 0.42 * 300,
            offset: Math.random() * Math.PI * 2,
        },
    });

    let saturn = new Planet({
        name: "Saturn",
        radius: 75,
        fill: PLANET_COLORS.saturn,
        speed: 9.7,
        orbit: {
            w: 0.62 * maxOrbitX,
            h: 0.62 * 300,
            offset: Math.random() * Math.PI * 2,
        },
    });

    let uranus = new Planet({
        name: "Uranus",
        radius: 32,
        fill: PLANET_COLORS.uranus,
        speed: 6.8,
        orbit: {
            w: 0.8 * maxOrbitX,
            h: 0.8 * 300,
            offset: Math.random() * Math.PI * 2,
        },
    });

    let neptune = new Planet({
        name: "Neptune",
        radius: 31,
        fill: PLANET_COLORS.neptune,
        speed: 5.4,
        orbit: {
            w: 0.92 * maxOrbitX,
            h: 0.92 * 300,
            offset: Math.random() * Math.PI * 2,
        },
    });

    let pluto = new Planet({
        name: "Pluto",
        radius: 7,
        fill: PLANET_COLORS.pluto,
        speed: 4.7,
        orbit: {
            w: 1.1 * maxOrbitX,
            h: 1.1 * 300,
            offset: Math.random() * Math.PI * 2,
        },
    });

    // Construct the solar system
    sun.setPosition(app.screen.width / 2, app.screen.height / 2);
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

    sun.updateGraphics();
    sunOrbit.createOrbitPaths();

    // Starfield
    const starfield = createStarField(app.screen.width, app.screen.height);

    // Add everything to the world
    worldLayer.sortableChildren = true;
    app.stage.addChild(worldLayer);
    worldLayer.addChild(sun.graphics);
    for (const p of sunOrbit.planets) {
        worldLayer.addChild(p.graphics);
    }

    for (const path of sunOrbit.orbitPaths) {
        worldLayer.addChild(path);
    }

    worldLayer.addChild(starfield);

    // Main animation loop
    const animate = (ticker: Ticker) => {
        const dt = ticker.deltaMS / 1000;

        for (const p of sunOrbit.planets) {
            p.visualScale = 0.25 + (p.y / app.screen.height) * 1.5;
        }

        sunOrbit.update(dt);
    };

    app.ticker.add(animate);

    // Destructor
    return () => {
        app.ticker.remove(animate);
        sun.graphics.destroy();
        for (const p of sunOrbit.planets) {
            p.graphics.destroy();
        }
        for (const path of sunOrbit.orbitPaths) {
            path.destroy();
        }
        starfield.destroy();
    };
}
