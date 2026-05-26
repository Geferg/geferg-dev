import type { CSSProperties } from "react";

const regexLines = [
    ["DA22KQMH507AB4L0Z81PNY8ACQN4LT2"],
    ["LCY<PWT2HL", "TARGET", "M7DCAPQL7M8VVK1"],
    ["BUA46DFK92TXR9", "FOUND", "5ZWLPDOM41QZ"],
];

const regexMatches = new Set(["TARGET", "FOUND"]);

export default function RegexGraphic({ accent }: { accent: string }) {
    return (
        <div
            className="mb-5 h-16 overflow-hidden font-mono text-[15px] leading-none tracking-[0.11em] text-foreground/35 sm:text-[16px]"
            style={{ "--project-accent": accent } as CSSProperties}
        >
            <div className="space-y-1">
                {regexLines.map((line, lineIndex) => (
                    <div
                        key={lineIndex}
                        className="whitespace-nowrap transition-transform duration-300 group-hover:translate-x-0.5"
                        style={{
                            transitionDelay: `${lineIndex * 30}ms`,
                        }}
                    >
                        {line.map((chunk, chunkIndex) => {
                            const isMatch = regexMatches.has(chunk);

                            return (
                                <span
                                    key={`${lineIndex}-${chunkIndex}`}
                                    className={
                                        isMatch
                                            ? "px-0.5 text-foreground/35 transition-colors duration-300 group-hover:text-(--project-accent)"
                                            : undefined
                                    }
                                >
                                    {chunk}
                                </span>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
