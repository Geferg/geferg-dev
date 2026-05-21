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

    let speed = 1;

    worldLayer.sortableChildren = true;
    sun.position.set(centerX, centerY);

    app.stage.addChild(worldLayer);
    worldLayer.addChild(earth);
    worldLayer.addChild(sun);

    let time = 0;
    const animate = (ticker: Ticker) => {
        const dt = ticker.deltaMS / 1000;
        time += dt;


        earth.x = centerX + Math.sin(speed * time / 2) * 400;
        earth.y = centerY + Math.cos(speed * time / 2) * 100;

        earth.zIndex = earth.y;
        sun.zIndex = sun.y;
    };

    app.ticker.add(animate);

    return () => {
        app.ticker.remove(animate);
        earth.destroy();
        sun.destroy();
    };
}
