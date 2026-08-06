import type { ProjectCardGraphicType } from "../projectData";

import AudioGraphic from "./audioGraphic";
import PlaceholderGraphic from "./placeholderGraphic";
import RegexGraphic from "./regexGraphic";

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
        default: return <PlaceholderGraphic accent={accent} />;
    }
}
