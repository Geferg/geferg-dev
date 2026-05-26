import ProjectCard from "./projectCard";
import { projects } from "./projectData";

export default function ProjectsPage() {
    return (
        <main className="bg-background px-6 py-24 text-foreground">
            <section className="mx-auto max-w-6xl">
                <header className="mb-10">
                    <p className="mb-2 font-mono text-sm text-muted-foreground">
                        ~/projects
                    </p>

                    <h1 className="text-4xl font-semibold tracking-tight">
                        Projects
                    </h1>

                    <p className="mt-3 max-w-2xl text-muted-foreground">
                        Small tools, experiments, and systems built around practical workflows.
                    </p>
                </header>

                <div className="grid gap-5 md:grid-cols-2">
                    {projects.map((project, index) => (
                        <ProjectCard
                            key={`${project.title}-${index}`}
                            project={project}
                        />
                    ))}
                </div>
            </section>
        </main>
    );
}
