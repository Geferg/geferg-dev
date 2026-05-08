import iconUrl from "@/assets/self-icon-rotated-pathed-plain.svg"

export default function Footer() {
    return (
        <footer className="border-t bg-background">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <img
                        src={iconUrl}
                        alt=""
                        aria-hidden="true"
                        className="h-6 w-6 opacity-70"
                    />

                    <p className="font-medium text-muted-foreground">
                        © 2026 Kristian Klette
                    </p>
                </div>

                <nav className="flex items-center gap-6 text-sm text-muted-foreground">
                    <a
                        href="https://github.com/Geferg"
                        target="_blank"
                        rel="noreferrer"
                        className="transition-colors hover:text-foreground"
                    >
                        GitHub
                    </a>

                    <a
                        href="https://www.linkedin.com/in/kristian-klette-81762914b"
                        target="_blank"
                        rel="noreferrer"
                        className="transition-colors hover:text-foreground"
                    >
                        LinkedIn
                    </a>

                    <a
                        href="mailto:geferg.dev@gmail.com"
                        className="transition-colors hover:text-foreground"
                    >
                        Contact
                    </a>
                </nav>
            </div>
        </footer>
    );
}

