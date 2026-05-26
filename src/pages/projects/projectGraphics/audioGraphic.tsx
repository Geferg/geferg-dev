const audioBars = [18, 34, 24, 52, 30, 64, 26, 44, 20, 36, 28, 58] as const;

export default function AudioGraphic({ accent }: { accent: string }) {
    return (
        <div className="mb-8 flex h-20 items-end gap-1.5">
            {audioBars.map((height, index) => {
                const isAccentBar = index % 4 === 1;

                return (
                    <div
                        key={index}
                        className="w-2 rounded-full bg-muted transition-all duration-300 group-hover:opacity-100"
                        style={{
                            height,
                            backgroundColor: isAccentBar ? accent : undefined,
                            opacity: isAccentBar ? 0.7 : 0.35,
                            transitionDelay: `${index * 20}ms`,
                        }}
                    />
                );
            })}
        </div>
    );
}
