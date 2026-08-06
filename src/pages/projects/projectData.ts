export type ProjectCardGraphicType = "regex" | "audio" | "zmk" | "placeholder";

export type ProjectStatus = "Coming soon" | "Available";

export type ProjectCardData = {
    title: string;
    description: string;
    status: ProjectStatus;
    graphic: ProjectCardGraphicType;
    accent: string;
    path?: string;
};

export const projects: ProjectCardData[] = [
    {
        title: "Regex Workbench",
        description:
            "Paste text, write a regular expression, and inspect matches, groups, and extracted output.",
        status: "Coming soon",
        graphic: "regex",
        accent: "#E86671",
    },
    {
        title: "Audio Archive",
        description:
            "A searchable archive for stored recordings, metadata, retrieval, and playback workflows.",
        status: "Coming soon",
        graphic: "audio",
        accent: "#C678DD",
    },
    {
        title: "ZMK Layout Editor",
        description: "Design an exportable layered ZMK layout",
        status: "Available",
        graphic: "zmk",
        accent: "#36D9FF",
        path: "/projects/zmk-editor",
    },
    {
        title: "Coming Soon",
        description: "Reserved project slot.",
        status: "Coming soon",
        graphic: "placeholder",
        accent: "#8A8F98",
    },
];
