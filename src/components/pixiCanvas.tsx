import { useEffect, useRef } from "react";
import { Application } from "pixi.js";

type PixiScene = (app: Application) => void | (() => void);

type Props = {
    createScene: PixiScene;
};

export function PixiCanvas({ createScene }: Props) {
    const hostRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let cancelled = false;
        let app: Application | null = null;
        let cleanupScene: void | (() => void);

        async function init() {
            const host = hostRef.current;
            if (!host) return;

            app = new Application();

            await app.init({
                resizeTo: host,
                backgroundAlpha: 0,
                antialias: true,
                autoDensity: true,
                resolution: window.devicePixelRatio,
            });

            if (cancelled) {
                app.destroy(true);
                return;
            }

            host.appendChild(app.canvas);
            app.canvas.style.display = "block";
            app.canvas.style.width = "100%";
            app.canvas.style.height = "100%";

            cleanupScene = createScene(app);
        }

        init();

        return () => {
            cancelled = true;
            cleanupScene?.();

            if (app?.renderer) {
                app.destroy(true);
            }
        };
    }, [createScene]);

    return <div ref={hostRef} className="min-h-0 flex-1 overflow-hidden" />;
}
