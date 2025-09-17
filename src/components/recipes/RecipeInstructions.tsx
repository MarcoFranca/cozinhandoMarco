// components/recipes/RecipeInstructions.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, ArrowUp, Trash2, Plus } from "lucide-react";
import type { RecipeInstructionRow } from "@/types/db";

export function RecipeInstructions({ recipeId, items }: { recipeId: string; items: RecipeInstructionRow[] }) {
    const [text, setText] = useState("");
    const [dur, setDur] = useState("");

    return (
        <div className="space-y-6">
            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle>Adicionar passo</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px_auto]"
                        action={async (fd) => {
                            fd.set("recipe_id", recipeId);
                            fd.set("text", text);
                            fd.set("duration_minutes", dur);
                            const { addInstructionAction } = await import("@/app/recipes/actions");
                            await addInstructionAction(fd);
                            setText(""); setDur("");
                        }}
                    >
                        <Textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Descreva o passo..."
                            rows={2}
                        />
                        <Input
                            type="number"
                            min={0}
                            value={dur}
                            onChange={(e) => setDur(e.target.value)}
                            placeholder="Duração (min)"
                        />
                        <Button type="submit" className="rounded-xl">
                            <Plus className="mr-2 h-4 w-4" /> Adicionar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle>Passos ({items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma instrução ainda.</p>
                    ) : (
                        <ol className="space-y-3">
                            {items.map((it, idx) => (
                                <li key={it.id} className="rounded-lg border p-3">
                                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <span className="inline-block rounded bg-muted px-2 py-0.5">Passo {idx + 1}</span>
                                            {it.duration_minutes != null ? <span>• {it.duration_minutes} min</span> : null}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <form action={async (fd) => {
                                                fd.set("id", it.id); fd.set("dir", "up");
                                                const { moveInstructionAction } = await import("@/app/recipes/actions");
                                                await moveInstructionAction(fd);
                                            }}>
                                                <Button size="icon" variant="ghost"><ArrowUp className="h-4 w-4" /></Button>
                                            </form>
                                            <form action={async (fd) => {
                                                fd.set("id", it.id); fd.set("dir", "down");
                                                const { moveInstructionAction } = await import("@/app/recipes/actions");
                                                await moveInstructionAction(fd);
                                            }}>
                                                <Button size="icon" variant="ghost"><ArrowDown className="h-4 w-4" /></Button>
                                            </form>
                                            <form action={async (fd) => {
                                                if (!confirm("Remover passo?")) return;
                                                fd.set("id", it.id);
                                                const { deleteInstructionAction } = await import("@/app/recipes/actions");
                                                await deleteInstructionAction(fd);
                                            }}>
                                                <Button size="icon" variant="destructive" className="rounded-xl"><Trash2 className="h-4 w-4" /></Button>
                                            </form>
                                        </div>
                                    </div>

                                    {/* editar inline */}
                                    <form
                                        className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px_auto]"
                                        action={async (fd) => {
                                            fd.set("id", it.id);
                                            const { updateInstructionAction } = await import("@/app/recipes/actions");
                                            await updateInstructionAction(fd);
                                        }}
                                    >
                                        <Textarea name="text" defaultValue={it.text} rows={2} />
                                        <Input name="duration_minutes" type="number" min={0} defaultValue={it.duration_minutes ?? ""} placeholder="min" />
                                        <Button type="submit" size="sm" variant="secondary" className="rounded-xl">Salvar</Button>
                                    </form>
                                </li>
                            ))}
                        </ol>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
