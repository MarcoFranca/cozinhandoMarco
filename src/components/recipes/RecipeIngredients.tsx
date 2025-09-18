// components/recipes/RecipeIngredients.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { RecipeIngredientRow } from "@/types/db";

export function RecipeIngredients({ recipeId, items }: { recipeId: string; items: RecipeIngredientRow[] }) {
    const UNITS = [
        "g","kg","ml","l","xíc","colher","colher de chá","colher de sopa","un","pct","cx","lata","pitada",
    ] as const;

    const [fname, setFname] = useState("");
    const [famount, setFamount] = useState("");
    const [funit, setFunit] = useState<string>("");
    const [funitOther, setFunitOther] = useState("");
    const [fnote, setFnote] = useState("");
    const [fopt, setFopt] = useState(false);

    return (
        <div className="space-y-6">
            <Card className="rounded-2xl">
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Adicionar ingrediente (detalhado)</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        className="grid grid-cols-1 gap-2 md:grid-cols-[1.5fr_120px_160px_1fr_auto]"
                        action={async (fd) => {
                            fd.set("recipe_id", recipeId);
                            fd.set("name", fname);
                            fd.set("amount", famount);
                            const finalUnit = funit === "__OTHER__" ? funitOther : funit;
                            fd.set("unit", finalUnit);
                            fd.set("note", fnote);
                            if (fopt) fd.set("optional", "on");

                            const { addIngredientFormAction } = await import("../../app/dashboard/recipes/actions");
                            await addIngredientFormAction(fd);

                            setFname(""); setFamount(""); setFunit(""); setFunitOther(""); setFnote(""); setFopt(false);
                        }}
                    >
                        <Input
                            value={fname}
                            onChange={(e) => setFname(e.target.value)}
                            placeholder="Nome do ingrediente *"
                            required
                        />
                        <Input
                            type="number"
                            min={0}
                            step="any"
                            value={famount}
                            onChange={(e) => setFamount(e.target.value)}
                            placeholder="Qtd"
                        />
                        <div className="flex gap-2">
                            <select
                                className="h-9 w-full rounded-md border bg-background px-2 text-sm cursor-pointer"
                                value={funit}
                                onChange={(e) => setFunit(e.target.value)}
                            >
                                <option value="">Unid.</option>
                                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                <option value="__OTHER__">Outro…</option>
                            </select>
                            {funit === "__OTHER__" && (
                                <Input
                                    value={funitOther}
                                    onChange={(e) => setFunitOther(e.target.value)}
                                    placeholder="Unidade"
                                />
                            )}
                        </div>
                        <Input
                            value={fnote}
                            onChange={(e) => setFnote(e.target.value)}
                            placeholder="Observação (opcional)"
                        />
                        <div className="flex items-center justify-end gap-3">
                            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                <input
                                    type="checkbox"
                                    className='cursor-pointer'
                                    checked={fopt}
                                    onChange={(e) => setFopt(e.target.checked)}
                                />
                                Opcional
                            </label>
                            <Button type="submit" className="rounded-xl cursor-pointer">Adicionar</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle>Ingredientes ({items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum ingrediente ainda.</p>
                    ) : (
                        <ul className="divide-y">
                            {items.map((it) => (
                                <li key={it.id} className="flex flex-wrap items-center gap-2 py-3">
                                    <div className="flex items-center gap-2">
                                        {/* mover */}
                                        <form action={async (fd) => {
                                            fd.set("id", it.id);
                                            fd.set("dir", "up");
                                            const { moveIngredientAction } = await import("../../app/dashboard/recipes/actions");
                                            await moveIngredientAction(fd);
                                        }}>
                                            <Button type="submit" size="icon" variant="ghost" className="cursor-pointer"><ArrowUp className="h-4 w-4" /></Button>
                                        </form>
                                        <form action={async (fd) => {
                                            fd.set("id", it.id);
                                            fd.set("dir", "down");
                                            const { moveIngredientAction } = await import("../../app/dashboard/recipes/actions");
                                            await moveIngredientAction(fd);
                                        }}>
                                            <Button type="submit" size="icon" variant="ghost" className="cursor-pointer"><ArrowDown className="h-4 w-4" /></Button>
                                        </form>
                                    </div>

                                    {/* editar inline */}
                                    <form
                                        className="flex flex-1 flex-wrap items-center gap-2"
                                        action={async (fd) => {
                                            fd.set("id", it.id);
                                            const { updateIngredientAction } = await import("../../app/dashboard/recipes/actions");
                                            await updateIngredientAction(fd);
                                        }}
                                    >
                                        <Input name="name" defaultValue={it.name} className="w-40" />
                                        <Input name="amount" defaultValue={it.amount ?? ""} placeholder="Qtd" className="w-20" />
                                        <Input name="unit" defaultValue={it.unit ?? ""} placeholder="Unid." className="w-24" />
                                        <Input name="note" defaultValue={it.note ?? ""} placeholder="Obs." className="w-40" />
                                        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                            <Checkbox name="optional" defaultChecked={it.optional} className="cursor-pointer" />
                                            Opcional
                                        </label>
                                        <Button type="submit" size="sm" variant="secondary" className="rounded-xl cursor-pointer">Salvar</Button>
                                    </form>

                                    {/* excluir */}
                                    <form
                                        action={async (fd) => {
                                            if (!confirm("Remover ingrediente?")) return;
                                            fd.set("id", it.id);
                                            const { deleteIngredientAction } = await import("../../app/dashboard/recipes/actions");
                                            await deleteIngredientAction(fd);
                                        }}
                                    >
                                        <Button type="submit" size="icon" variant="destructive" className="rounded-xl cursor-pointer">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </form>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
