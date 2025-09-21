// components/recipes/RecipeIngredients.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, Trash2, Lightbulb, AlertTriangle, Repeat } from "lucide-react";
import type { RecipeIngredientRow } from "@/types/db";
import { TIP_TYPE_LABELS } from "@/constants/taxonomies";

type TipType = "tip" | "swap" | "alert";
type TipForUI = {
    id: string;
    recipe_ingredient_id: string | null;
    instruction_id: string | null;
    type: TipType;
    title: string | null;
    text: string;
    position: number | null;
};

const TipIcon = ({ type, className = "h-3.5 w-3.5" }: { type: TipType; className?: string }) => {
    if (type === "alert") return <AlertTriangle className={className} />;
    if (type === "swap") return <Repeat className={className} />;
    return <Lightbulb className={className} />;
};

export function RecipeIngredients({
                                      recipeId,
                                      items,
                                      tipsByIngredient = {},
                                  }: {
    recipeId: string;
    items: RecipeIngredientRow[];
    tipsByIngredient?: Record<string, TipForUI[]>;
}) {
    const UNITS = [
        "g",
        "kg",
        "ml",
        "l",
        "xíc",
        "colher",
        "colher de chá",
        "colher de sopa",
        "un",
        "pct",
        "cx",
        "lata",
        "pitada",
    ] as const;

    const [fname, setFname] = useState("");
    const [famount, setFamount] = useState("");
    const [funit, setFunit] = useState<string>("");
    const [funitOther, setFunitOther] = useState("");
    const [fnote, setFnote] = useState("");
    const [fopt, setFopt] = useState(false);

    return (
        <div className="space-y-6">
            {/* Adicionar ingrediente */}
            <Card className="rounded-2xl">
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Adicionar ingrediente (detalhado)</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        className="grid grid-cols-1 gap-2 md:grid-cols-[1.5fr_120px_220px_1fr_120px]"
                        action={async (fd) => {
                            fd.set("recipe_id", recipeId);
                            fd.set("name", fname);
                            fd.set("amount", famount);
                            const finalUnit = funit === "__OTHER__" ? funitOther : funit;
                            fd.set("unit", finalUnit);
                            fd.set("note", fnote);
                            if (fopt) fd.set("optional", "on");

                            const { addIngredientFormAction } = await import("@/app/dashboard/recipes/actions");
                            await addIngredientFormAction(fd);

                            setFname("");
                            setFamount("");
                            setFunit("");
                            setFunitOther("");
                            setFnote("");
                            setFopt(false);
                        }}
                    >
                        <Input
                            value={fname}
                            onChange={(e) => setFname(e.target.value)}
                            placeholder="Nome do ingrediente *"
                            required
                            className="h-10"
                        />
                        <Input
                            type="number"
                            min={0}
                            step="any"
                            value={famount}
                            onChange={(e) => setFamount(e.target.value)}
                            placeholder="Qtd"
                            className="h-10"
                        />
                        <div className="flex gap-2">
                            <select
                                className="h-10 w-full rounded-md border bg-background px-2 text-sm cursor-pointer"
                                value={funit}
                                onChange={(e) => setFunit(e.target.value)}
                            >
                                <option value="">Unid.</option>
                                {UNITS.map((u) => (
                                    <option key={u} value={u}>
                                        {u}
                                    </option>
                                ))}
                                <option value="__OTHER__">Outro…</option>
                            </select>
                            {funit === "__OTHER__" && (
                                <Input
                                    value={funitOther}
                                    onChange={(e) => setFunitOther(e.target.value)}
                                    placeholder="Unidade"
                                    className="h-10"
                                />
                            )}
                        </div>
                        <Input
                            value={fnote}
                            onChange={(e) => setFnote(e.target.value)}
                            placeholder="Observação (opcional)"
                            className="h-10"
                        />
                        <div className="flex items-center justify-end gap-3">
                            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                <input
                                    type="checkbox"
                                    className="cursor-pointer"
                                    checked={fopt}
                                    onChange={(e) => setFopt(e.target.checked)}
                                />
                                Opcional
                            </label>
                            <Button type="submit" className="h-10 rounded-xl cursor-pointer">
                                Adicionar
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Lista */}
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
                                <li key={it.id} className="py-3">
                                    {/* Linha de ações + edição inline */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            {/* mover */}
                                            <form
                                                action={async (fd) => {
                                                    fd.set("id", it.id);
                                                    fd.set("dir", "up");
                                                    const { moveIngredientAction } = await import("@/app/dashboard/recipes/actions");
                                                    await moveIngredientAction(fd);
                                                }}
                                            >
                                                <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 cursor-pointer">
                                                    <ArrowUp className="h-4 w-4" />
                                                </Button>
                                            </form>
                                            <form
                                                action={async (fd) => {
                                                    fd.set("id", it.id);
                                                    fd.set("dir", "down");
                                                    const { moveIngredientAction } = await import("@/app/dashboard/recipes/actions");
                                                    await moveIngredientAction(fd);
                                                }}
                                            >
                                                <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 cursor-pointer">
                                                    <ArrowDown className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </div>

                                        {/* editar inline */}
                                        <form
                                            className="flex flex-1 flex-wrap items-center gap-2"
                                            action={async (fd) => {
                                                fd.set("id", it.id);
                                                const { updateIngredientAction } = await import("@/app/dashboard/recipes/actions");
                                                await updateIngredientAction(fd);
                                            }}
                                        >
                                            <Input name="name" defaultValue={it.name} className="h-9 w-44" />
                                            <Input name="amount" defaultValue={it.amount ?? ""} placeholder="Qtd" className="h-9 w-20" />
                                            <Input name="unit" defaultValue={it.unit ?? ""} placeholder="Unid." className="h-9 w-24" />
                                            <Input name="note" defaultValue={it.note ?? ""} placeholder="Obs." className="h-9 w-48" />
                                            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                                <Checkbox name="optional" defaultChecked={it.optional} className="cursor-pointer" />
                                                Opcional
                                            </label>
                                            <Button type="submit" size="sm" variant="secondary" className="h-9 rounded-xl cursor-pointer">
                                                Salvar
                                            </Button>
                                        </form>

                                        {/* excluir */}
                                        <form
                                            action={async (fd) => {
                                                if (!confirm("Remover ingrediente?")) return;
                                                fd.set("id", it.id);
                                                const { deleteIngredientAction } = await import("@/app/dashboard/recipes/actions");
                                                await deleteIngredientAction(fd);
                                            }}
                                        >
                                            <Button type="submit" size="icon" variant="destructive" className="h-8 w-8 rounded-xl cursor-pointer">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </div>

                                    {/* Tips (Substituições/variações/avisos) */}
                                    <IngredientTipsBlock
                                        recipeId={recipeId}
                                        ingredientId={it.id}
                                        tips={tipsByIngredient[it.id] ?? []}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function IngredientTipsBlock({
                                 recipeId,
                                 ingredientId,
                                 tips,
                             }: {
    recipeId: string;
    ingredientId: string;
    tips: TipForUI[];
}) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<TipType>("swap"); // substituição é o foco
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");

    return (
        <div className="mt-2 rounded-lg border bg-muted/30 p-2">
            <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="rounded-md">Substituições & variações</Badge>
                    <span className="text-muted-foreground">Dicas específicas deste ingrediente</span>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl cursor-pointer"
                    onClick={() => setOpen((v) => !v)}
                >
                    {open ? "Fechar" : "Adicionar dica"}
                </Button>
            </div>

            {/* Lista */}
            {tips.length > 0 && (
                <ul className="space-y-2">
                    {tips.map((tip) => (
                        <li key={tip.id} className="rounded-md border bg-background px-2 py-2">
                            <div className="mb-1 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs">
                                    <TipIcon type={tip.type} />
                                    <span className="font-medium">
                    {(TIP_TYPE_LABELS as Record<string, string>)[tip.type]}
                  </span>
                                    {tip.title ? <span>• {tip.title}</span> : null}
                                </div>

                                <form
                                    action={async (fd) => {
                                        fd.set("id", tip.id);
                                        const { deleteTipAction } = await import("@/app/dashboard/recipes/actions");
                                        await deleteTipAction(fd);
                                    }}
                                >
                                    <Button size="sm" variant="ghost" className="h-7 px-2 cursor-pointer">
                                        Remover
                                    </Button>
                                </form>
                            </div>

                            {/* editar inline */}
                            <form
                                className="grid grid-cols-1 gap-2 md:grid-cols-[160px_1fr_auto]"
                                action={async (fd) => {
                                    fd.set("id", tip.id);
                                    const { updateTipAction } = await import("@/app/dashboard/recipes/actions");
                                    await updateTipAction(fd);
                                }}
                            >
                                <select
                                    name="type"
                                    defaultValue={tip.type}
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    {Object.keys(TIP_TYPE_LABELS as Record<string, string>).map((slug) => (
                                        <option key={slug} value={slug}>
                                            {(TIP_TYPE_LABELS as Record<string, string>)[slug]}
                                        </option>
                                    ))}
                                </select>
                                <Input name="title" defaultValue={tip.title ?? ""} placeholder="Título (opcional)" />
                                <Textarea
                                    name="text"
                                    defaultValue={tip.text}
                                    rows={2}
                                    className="md:col-span-3"
                                    placeholder="Texto da dica…"
                                />
                                <div className="md:col-span-3">
                                    <Button type="submit" size="sm" variant="outline" className="rounded-xl cursor-pointer">
                                        Atualizar dica
                                    </Button>
                                </div>
                            </form>
                        </li>
                    ))}
                </ul>
            )}

            {/* Form adicionar */}
            {open && (
                <form
                    className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[160px_1fr_auto]"
                    action={async (fd) => {
                        fd.set("recipe_id", recipeId);
                        fd.set("recipe_ingredient_id", ingredientId);
                        fd.set("type", type);
                        if (title) fd.set("title", title);
                        fd.set("text", text);
                        const { addTipAction } = await import("@/app/dashboard/recipes/actions");
                        await addTipAction(fd);
                        setText("");
                        setTitle("");
                        setType("swap");
                        setOpen(false);
                    }}
                >
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as TipType)}
                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    >
                        {Object.keys(TIP_TYPE_LABELS as Record<string, string>).map((slug) => (
                            <option key={slug} value={slug}>
                                {(TIP_TYPE_LABELS as Record<string, string>)[slug]}
                            </option>
                        ))}
                    </select>
                    <Input
                        placeholder="Título (opcional)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <Textarea
                        placeholder="Texto da dica…"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={2}
                        className="md:col-span-3"
                    />
                    <div className="md:col-span-3 cursor-pointer">
                        <Button type="submit" size="sm" className="rounded-xl cursor-pointer">
                            Adicionar dica
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
