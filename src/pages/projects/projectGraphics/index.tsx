import AudioGraphic from "./audioGraphic";
import PlaceholderGraphic from "./placeholderGraphic";
import RegexGraphic from "./regexGraphic";

import type { ProjectCardGraphicType } from "../projectData";

type ProjectCardGraphicProps = {
    type: ProjectCardGraphicType;
    accent: string;
};

export default function ProjectGraphic({ type, accent }: ProjectCardGraphicProps) {
    switch (type) {
        case "regex": return <RegexGraphic accent={accent} />;
        case "audio": return <AudioGraphic accent={accent} />;
        default: return <PlaceholderGraphic accent={accent} />;
    }
}
