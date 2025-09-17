// components/home/HomeUpcomingRecordings.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Item = { id: string; recipeId: string; date: string; recipeName: string; status: string };

export function HomeUpcomingRecordings({ items }: { items: Item[] }) {
    return (
        <Card className="rounded-2xl">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Próximas Gravações (7 dias)</CardTitle>
                <a href="/calendar" className="text-sm text-muted-foreground hover:underline">
                    Ver calendário
                </a>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma gravação agendada ainda.</p>
                ) : (
                    items.map((it) => (
                        <a
                            key={it.id}
                            href={`/recipes/${it.recipeId}?tab=recording`}
                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                        >
                            <div>
                                <p className="text-sm font-medium">{it.recipeName}</p>
                                <p className="text-xs text-muted-foreground">{it.status}</p>
                            </div>
                            <span className="text-sm">
                {new Date(it.date).toLocaleDateString("pt-BR")}
              </span>
                        </a>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
