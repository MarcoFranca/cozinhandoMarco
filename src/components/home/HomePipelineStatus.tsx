import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Counts = {
    idea: number;
    tested: number;
    recorded: number;
    edited: number;
    published: number;
};

export function HomePipelineStatus({ counts }: { counts: Counts }) {
    const items = [
        { label: "Ideia", key: "idea" as const },
        { label: "Testada", key: "tested" as const },
        { label: "Gravada", key: "recorded" as const },
        { label: "Editada", key: "edited" as const },
        { label: "Publicada", key: "published" as const },
    ];

    return (
        <Card className="rounded-2xl">
            <CardHeader>
                <CardTitle>Pipeline de Produção</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {items.map((it) => (
                        <a
                            key={it.key}
                            href={`/recipes?status=${it.key}`}
                            className="transition-opacity hover:opacity-80"
                        >
                            <Badge variant="secondary" className="text-sm">
                                {it.label} <span className="ml-2 rounded bg-background px-2">{counts[it.key]}</span>
                            </Badge>
                        </a>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
