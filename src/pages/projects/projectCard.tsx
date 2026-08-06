import { useState } from "react";

import type { ProjectCardData } from "./projectData";
import ProjectGraphic from "./projectGraphics";

type ProjectCardProps = {
    project: ProjectCardData;
};

export default function ProjectCard({ project }: ProjectCardProps) {
    const [isPointerActive, setIsPointerActive] = useState(false);
    const [isFocusActive, setIsFocusActive] = useState(false);

    const isActive = isPointerActive || isFocusActive;

    const card = (
        <article
            data-active={isActive ? "true" : "false"}
            onPointerEnter={() => setIsPointerActive(true)}
            onPointerLeave={() => setIsPointerActive(false)}
            onPointerCancel={() => setIsPointerActive(false)}
            className={[
                "group relative h-64 overflow-hidden rounded-2xl border bg-card p-6",
                "translate-y-0 transition-[transform,border-color,box-shadow] duration-300 ease-out",
                isActive
                    ? "-translate-y-0.5 border-foreground/20 shadow-lg"
                    : "border-border shadow-sm",
            ].join(" ")}
        >
            <div
                className={[
                    "pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out",
                    isActive ? "opacity-20" : "opacity-10",
                ].join(" ")}
                style={{
                    background: `radial-gradient(circle at 82% 18%, ${project.accent}, transparent 36%)`,
                }}
            />

            <div className="relative z-10 flex h-full flex-col">
                <ProjectGraphic
                    type={project.graphic}
                    accent={project.accent}
                    active={isActive}
                />

                <div className="mt-auto">
                    <div className="mb-3 inline-flex rounded-full border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground">
                        {project.status}
                    </div>

                    <h2 className="text-2xl font-medium tracking-tight">
                        {project.title}
                    </h2>

                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                        {project.description}
                    </p>
                </div>
            </div>
        </article>
    );

    if (!project.path) {
        return card;
    }

    return (
        <a
            href={project.path}
            onFocus={() => setIsFocusActive(true)}
            onBlur={() => setIsFocusActive(false)}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
            {card}
        </a>
    );
}
