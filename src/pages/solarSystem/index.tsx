import { PixiCanvas } from "@/components/pixiCanvas";
import { createSolarSystemScene } from "./solarSystemScene";

export default function SolarSystemPage() {
    return (
        <div className="min-h-0 flex flex-1 flex-col">
            <PixiCanvas createScene={createSolarSystemScene} />
        </div>
    );
}
