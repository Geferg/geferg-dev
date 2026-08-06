import AudioGraphic from "./audioGraphic";
import PlaceholderGraphic from "./placeholderGraphic";
import RegexGraphic from "./regexGraphic";
import ZmkGraphic from "./zmkGraphic";

import type { ProjectCardGraphicType } from "../projectData";

type ProjectCardGraphicProps = {
    type: ProjectCardGraphicType;
    accent: string;
    active: boolean;
};

export default function ProjectGraphic({
    type,
    accent,
    active,
}: ProjectCardGraphicProps) {
    switch (type) {
        case "regex": return <RegexGraphic accent={accent} />;
        case "audio": return <AudioGraphic accent={accent} />;
        case "zmk": return <ZmkGraphic active={active} />;
        default: return <PlaceholderGraphic accent={accent} />;
    }
}
