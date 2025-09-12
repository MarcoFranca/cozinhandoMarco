import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

type Draft = { id: string; name: string; category: string; updatedAt: string };

export function HomeRecentDrafts({ items }: { items: Draft[] }) {
    return (
        <Card className="rounded-2xl">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Rascunhos Recentes</CardTitle>
                <Link href="/recipes" className="text-sm text-muted-foreground hover:underline">
                    Ver todos
                </Link>
            </CardHeader>
            <CardContent className="space-y-2">
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem rascunhos ainda.</p>
                ) : (
                    items.map((d) => (
                        <div
                            key={d.id}
                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                        >
                            <div>
                                <p className="text-sm font-medium">{d.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {d.category} • atualizado {d.updatedAt}
                                </p>
                            </div>
                            <div className="text-muted-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
