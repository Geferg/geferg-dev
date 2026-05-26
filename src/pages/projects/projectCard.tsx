import type { ProjectCardData } from "./projectData";
import ProjectGraphic from "./projectGraphics";

type ProjectCardProps = {
    project: ProjectCardData;
};

export default function ProjectCard({ project }: ProjectCardProps) {
    const card = (
        <article className="group relative h-64 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg">
            <div
                className="pointer-events-none absolute inset-0 opacity-10 transition-opacity duration-300 group-hover:opacity-20"
                style={{
                    background: `radial-gradient(circle at 82% 18%, ${project.accent}, transparent 36%)`,
                }}
            />

            <div className="relative z-10 flex h-full flex-col">
                <ProjectGraphic
                    type={project.graphic}
                    accent={project.accent}
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
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
            {card}
        </a>
    );
}
