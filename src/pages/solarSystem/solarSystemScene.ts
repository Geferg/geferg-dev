import {
    Application,
    Container,
    Graphics,
    Text,
    Ticker,
} from "pixi.js";

import { Comet } from "./classes/Comet";
import { Orbit } from "./classes/Orbit";
import { Planet } from "./classes/Planet";

const REFERENCE_WIDTH = 2560;
const REFERENCE_ORBIT_HEIGHT = 300;

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
const REFERENCE_ASPECT_RATIO = 16 / 9;
const DEPTH_STRENGTH = 0.75;

function getDepthStrength(width: number, height: number) {
    const aspectRatio = width / height;
    return DEPTH_STRENGTH * (aspectRatio / REFERENCE_ASPECT_RATIO);
}

function getWidthScale(width: number) {
    return Math.min(1, width / REFERENCE_WIDTH);
}

function createStarField(
    width: number,
    height: number,
    count = 160,
) {
    const graphics = new Graphics();

    // Normalized coordinates preserve the same star layout across resizes.
    const stars = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        radius: Math.random() * 1.4 + 0.2,
        alpha: Math.random() * 0.45 + 0.15,
    }));

    const resize = (newWidth: number, newHeight: number) => {
        graphics.clear();

        for (const star of stars) {
            graphics
                .circle(
                    star.x * newWidth,
                    star.y * newHeight,
                    star.radius,
                )
                .fill({
                    color: 0xffffff,
                    alpha: star.alpha,
                });
        }
    };

    resize(width, height);

    graphics.zIndex = -10;

    return {
        graphics,
        resize,
    };
}

function createTerminalWelcome(app: Application) {
    const fullText = "Welcome to my orbit";
    const fontSize = 32;
    const monospaceWidthRatio = 0.6;
    const charsPerSecond = 18;

    const estimatedTextWidth =
        fullText.length * fontSize * monospaceWidthRatio;

    const container = new Container();

    const text = new Text({
        text: "",
        style: {
            fill: 0x2ad4ff,
            fontSize,
            fontFamily: "monospace",
        },
    });

    const cursor = new Text({
        text: "_",
        style: {
            fill: 0x2ad4ff,
            fontSize,
            fontFamily: "monospace",
        },
    });

    container.position.set(
        app.screen.width / 2 - estimatedTextWidth / 2,
        32,
    );

    container.addChild(text);
    container.addChild(cursor);

    let elapsed = 0;

    return {
        container,
        cursor,
        estimatedTextWidth,

        update(dt: number) {
            elapsed += dt;

            const visibleChars = Math.min(
                fullText.length,
                Math.floor(elapsed * charsPerSecond),
            );

            text.text = fullText.slice(0, visibleChars);
            cursor.position.set(text.width + 8, 0);

            cursor.alpha =
                Math.floor(performance.now() / 500) % 2 === 0
                    ? 1
                    : 0;
        },
    };
}

export function createSolarSystemScene(app: Application) {
    // Perspective uses the initial viewport height so vertical resizing
    // cannot change apparent planet size.
    const perspectiveReferenceHeight = app.screen.height;

    let screenWidth = app.screen.width;
    let screenHeight = app.screen.height;
    let widthScale = getWidthScale(screenWidth);

    const maxOrbitX = screenWidth * 0.5;

    const worldLayer = new Container();

    const backgroundLayer = new Container();
    const orbitLayer = new Container();
    const backPlanetLayer = new Container();
    const sunLayer = new Container();
    const frontPlanetLayer = new Container();
    const labelLayer = new Container();

    backgroundLayer.zIndex = 0;
    orbitLayer.zIndex = 1;
    backPlanetLayer.zIndex = 2;
    sunLayer.zIndex = 3;
    frontPlanetLayer.zIndex = 4;
    labelLayer.zIndex = 5;

    worldLayer.sortableChildren = true;
    sunLayer.sortableChildren = true;

    worldLayer.addChild(backgroundLayer);
    worldLayer.addChild(orbitLayer);
    worldLayer.addChild(backPlanetLayer);
    worldLayer.addChild(sunLayer);
    worldLayer.addChild(frontPlanetLayer);
    worldLayer.addChild(labelLayer);

    const sun = new Planet({
        name: "The Sun",
        radius: 100,
        fill: PLANET_COLORS.sun,
        orbit: {
            w: 0,
            h: 0,
            offset: 0,
        },
        glow: {
            color: 0xffaa33,
            radiusMultiplier: 1.3,
            alpha: 0.12,
        },
    });

    const mercury = new Planet({
        name: "Mercury",
        radius: 12,
        fill: PLANET_COLORS.mercury,
        speed: 47.4,
        orbit: {
            w: 0.13 * maxOrbitX,
            h: 0.13 * REFERENCE_ORBIT_HEIGHT,
            offset: Math.random() * Math.PI * 2,
        },
    });

    const venus = new Planet({
        name: "Venus",
        radius: 17,
        fill: PLANET_COLORS.venus,
        speed: 35,
        orbit: {
            w: 0.17 * maxOrbitX,
            h: 0.17 * REFERENCE_ORBIT_HEIGHT,
            offset: Math.random() * Math.PI * 2,
        },
    });

    const earth = new Planet({
        name: "Earth",
        radius: 18,
        fill: PLANET_COLORS.earth,
        speed: 29.8,
        orbit: {
            w: 0.24 * maxOrbitX,
            h: 0.24 * REFERENCE_ORBIT_HEIGHT,
            offset: Math.random() * Math.PI * 2,
        },
    });

    const mars = new Planet({
        name: "Mars",
        radius: 12,
        fill: PLANET_COLORS.mars,
        speed: 24.1,
        orbit: {
            w: 0.31 * maxOrbitX,
            h: 0.31 * REFERENCE_ORBIT_HEIGHT,
            offset: Math.random() * Math.PI * 2,
        },
    });

    const jupiter = new Planet({
        name: "Jupiter",
        radius: 75,
        fill: PLANET_COLORS.jupiter,
        speed: 13.1,
        orbit: {
            w: 0.42 * maxOrbitX,
            h: 0.42 * REFERENCE_ORBIT_HEIGHT,
            offset: Math.random() * Math.PI * 2,
        },
    });

    const saturn = new Planet({
        name: "Saturn",
        radius: 75,
        fill: PLANET_COLORS.saturn,
        speed: 9.7,
        orbit: {
            w: 0.62 * maxOrbitX,
            h: 0.62 * REFERENCE_ORBIT_HEIGHT,
            offset: Math.random() * Math.PI * 2,
        },
        ring: {
            color: 0xf4deb3,
            width: 2,
            alpha: 0.45,
            radiusXMultiplier: 1.55,
            radiusYMultiplier: 0.35,
        },
    });

    const uranus = new Planet({
        name: "Uranus",
        radius: 32,
        fill: PLANET_COLORS.uranus,
        speed: 6.8,
        orbit: {
            w: 0.8 * maxOrbitX,
            h: 0.8 * REFERENCE_ORBIT_HEIGHT,
            offset: Math.random() * Math.PI * 2,
        },
    });

    const neptune = new Planet({
        name: "Neptune",
        radius: 31,
        fill: PLANET_COLORS.neptune,
        speed: 5.4,
        orbit: {
            w: 0.92 * maxOrbitX,
            h: 0.92 * REFERENCE_ORBIT_HEIGHT,
            offset: Math.random() * Math.PI * 2,
        },
    });

    const pluto = new Planet({
        name: "Pluto",
        radius: 7,
        fill: PLANET_COLORS.pluto,
        speed: 4.7,
        orbit: {
            w: 1.1 * maxOrbitX,
            h: 1.1 * REFERENCE_ORBIT_HEIGHT,
            offset: Math.random() * Math.PI * 2,
        },
    });

    const orbitScales = new Map<Planet, number>([
        [mercury, 0.13],
        [venus, 0.17],
        [earth, 0.24],
        [mars, 0.31],
        [jupiter, 0.42],
        [saturn, 0.62],
        [uranus, 0.8],
        [neptune, 0.92],
        [pluto, 1.1],
    ]);

    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    sun.setPosition(centerX, centerY);

    const sunOrbit = new Orbit(centerX, centerY);
    sunOrbit.speed = 0.01;

    for (const planet of orbitScales.keys()) {
        sunOrbit.planets.push(planet);
    }

    sunOrbit.createOrbitPaths();
    sunOrbit.createSunOverlayPaths(
        sun.planetRadius * widthScale,
    );
    sunOrbit.updatePlanetPositions();

    const starfield = createStarField(
        screenWidth,
        screenHeight,
    );

    const comet = new Comet({
        screenWidth,
        screenHeight,
    });

    const welcome = createTerminalWelcome(app);

    app.stage.addChild(welcome.container);
    app.stage.addChild(worldLayer);

    if (sun.glow) {
        sunLayer.addChild(sun.glow);
    }

    sunLayer.addChild(sun.graphics);

    for (const path of sunOrbit.sunOverlayPaths) {
        path.zIndex = 9999;
        sunLayer.addChild(path);
    }

    for (const path of sunOrbit.orbitPaths) {
        orbitLayer.addChild(path);
    }

    sunLayer.addChild(sun.label);

    for (const planet of sunOrbit.planets) {
        if (planet.ring) {
            backPlanetLayer.addChild(planet.ring);
        }

        if (planet.glow) {
            backPlanetLayer.addChild(planet.glow);
        }

        backPlanetLayer.addChild(planet.graphics);
        labelLayer.addChild(planet.label);
    }

    backgroundLayer.addChild(starfield.graphics);
    backgroundLayer.addChild(comet.graphics);

    const redrawOrbitPaths = () => {
        for (const path of sunOrbit.orbitPaths) {
            path.removeFromParent();
            path.destroy();
        }

        for (const path of sunOrbit.sunOverlayPaths) {
            path.removeFromParent();
            path.destroy();
        }

        sunOrbit.orbitPaths = [];
        sunOrbit.sunOverlayPaths = [];

        sunOrbit.createOrbitPaths();
        sunOrbit.createSunOverlayPaths(
            sun.planetRadius * widthScale,
        );

        for (const path of sunOrbit.orbitPaths) {
            orbitLayer.addChild(path);
        }

        for (const path of sunOrbit.sunOverlayPaths) {
            path.zIndex = 9999;
            sunLayer.addChild(path);
        }
    };

    const resizeScene = (
        width: number,
        height: number,
    ) => {
        widthScale = getWidthScale(width);

        const centerX = width / 2;
        const centerY = height / 2;
        const maxOrbitX = width * 0.5;

        sunOrbit.origin.x = centerX;
        sunOrbit.origin.y = centerY;

        sun.setPosition(centerX, centerY);

        for (const [planet, scale] of orbitScales) {
            planet.orbit.w = scale * maxOrbitX;
            planet.orbit.h = scale * REFERENCE_ORBIT_HEIGHT;
        }

        sunOrbit.updatePlanetPositions();

        sun.visualScale = widthScale;
        sun.updateGraphics();

        redrawOrbitPaths();

        welcome.container.position.set(
            width / 2 - welcome.estimatedTextWidth / 2,
            32,
        );

        starfield.resize(width, height);
    };

    const animate = (ticker: Ticker) => {
        if (
            app.screen.width !== screenWidth ||
            app.screen.height !== screenHeight
        ) {
            screenWidth = app.screen.width;
            screenHeight = app.screen.height;

            resizeScene(screenWidth, screenHeight);
        }

        const dt = ticker.deltaMS / 1000;

        sunOrbit.t += dt;
        sunOrbit.updatePlanetPositions();

        sun.visualScale = widthScale;
        sun.updateGraphics();

        const depthStrength = getDepthStrength(
            screenWidth,
            screenHeight,
        );

        for (const planet of sunOrbit.planets) {
            const orbitDepth =
                (planet.y - sunOrbit.origin.y) /
                REFERENCE_ORBIT_HEIGHT;

            planet.visualScale =
                widthScale *
                (1.1 + orbitDepth * depthStrength);
        }

        sunOrbit.updatePlanetGraphics();

        welcome.update(dt);
        comet.update(dt);

        for (const planet of sunOrbit.planets) {
            const targetLayer =
                planet.y < sunOrbit.origin.y
                    ? backPlanetLayer
                    : frontPlanetLayer;

            if (planet.graphics.parent !== targetLayer) {
                targetLayer.addChild(planet.graphics);
            }

            if (
                planet.ring &&
                planet.ring.parent !== targetLayer
            ) {
                targetLayer.addChild(planet.ring);
            }

            if (
                planet.glow &&
                planet.glow.parent !== targetLayer
            ) {
                targetLayer.addChild(planet.glow);
            }
        }
    };

    app.ticker.add(animate);

    return () => {
        app.ticker.remove(animate);

        sun.graphics.destroy();
        sun.label.destroy();
        sun.glow?.destroy();

        for (const planet of sunOrbit.planets) {
            planet.graphics.destroy();
            planet.label.destroy();
            planet.ring?.destroy();
            planet.glow?.destroy();
        }

        for (const path of sunOrbit.orbitPaths) {
            path.destroy();
        }

        for (const path of sunOrbit.sunOverlayPaths) {
            path.destroy();
        }

        starfield.graphics.destroy();
        welcome.container.destroy();
        comet.destroy();
    };
}
