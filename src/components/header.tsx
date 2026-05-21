import logoUrl from "@/assets/self-logo-pathed-plain.svg"

export default function Header() {
    return (
        <header className="border-b bg-card">
            <div className="mx-auto flex min-h-24 w-full max-w-5xl items-center justify-between px-8">
                <a href="/" className="group flex items-center gap-4">
                    <img
                        src={logoUrl}
                        alt="Kristian Klette"
                        className="h-12 w-auto"
                    />

                    <div>
                        <p className="text-lg font-medium tracking-tight">
                            Kristian Klette
                        </p>

                        <p className="text-sm text-muted-foreground">
                            Engineering · Software · Systems
                        </p>
                    </div>
                </a>

                <nav className="hidden items-center gap-8 text-base text-muted-foreground md:flex">

                    <a
                        href="/algorithms"
                        className="transition-colors hover:text-foreground"
                    >
                        Algorithms
                    </a>

                    <a
                        href="/projects"
                        className="transition-colors hover:text-foreground"
                    >
                        Projects
                    </a>
                </nav>
            </div>
        </header>
    );
}
