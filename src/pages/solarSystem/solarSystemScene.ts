import { Application, Graphics, Ticker, Container } from "pixi.js";

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

    let globalSpeed = 0.3;
    let earthSpeed = 1;
    let plutoSpeed = 0.5;

    worldLayer.sortableChildren = true;
    sun.position.set(centerX, centerY);

    app.stage.addChild(worldLayer);
    worldLayer.addChild(earth);
    worldLayer.addChild(sun);
    worldLayer.addChild(pluto);

    let time = 0;
    const animate = (ticker: Ticker) => {
        const dt = ticker.deltaMS / 1000;
        time += dt;

        pluto.x = centerX + Math.sin(globalSpeed * plutoSpeed * time + Math.PI / 2) * 700;
        pluto.y = centerY + Math.cos(globalSpeed * plutoSpeed * time + Math.PI / 2) * 250;

        earth.x = centerX + Math.sin(globalSpeed * earthSpeed * time) * 400;
        earth.y = centerY + Math.cos(globalSpeed * earthSpeed * time) * 100;

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
