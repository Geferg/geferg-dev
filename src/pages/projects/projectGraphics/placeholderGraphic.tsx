export default function PlaceholderGraphic({ accent }: { accent: string }) {
    return (
        <div className="mb-8 grid h-20 w-32 grid-cols-4 gap-2 opacity-50">
            {Array.from({ length: 12 }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-sm bg-muted transition duration-300 group-hover:scale-105"
                    style={{
                        backgroundColor: index % 5 === 0 ? accent : undefined,
                    }}
                />
            ))}
        </div>
    );
}
