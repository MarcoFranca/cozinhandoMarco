// components/recipes/RecipeInstructions.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    ArrowDown,
    ArrowUp,
    Trash2,
    Plus,
    Wand2,
    Lightbulb,
    AlertTriangle,
    Repeat,
} from "lucide-react";
import type { RecipeInstructionRow } from "@/types/db";
import { TECHNIQUE_LABELS, TIP_TYPE_LABELS } from "@/constants/taxonomies";

type TipType = "tip" | "swap" | "alert";

export type TipForUI = {
    id: string;
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

export function RecipeInstructions({
                                       recipeId,
                                       items,
                                       tipsByInstruction = {},
                                       techniqueById = {},
                                   }: {
    recipeId: string;
    items: (RecipeInstructionRow & { technique_id?: string | null })[];
    tipsByInstruction?: Record<string, TipForUI[]>;
    techniqueById?: Record<string, { slug: string; label: string }>;
}) {
    // form "adicionar passo"
    const [text, setText] = useState("");
    const [dur, setDur] = useState("");
    const [techSlug, setTechSlug] = useState("");

    return (
        <div className="space-y-6">
            {/* Criar passo (agora alinhado) */}
            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle>Adicionar passo</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_150px_240px_120px]"
                        action={async (fd) => {
                            fd.set("recipe_id", recipeId);
                            fd.set("text", text);
                            fd.set("duration_minutes", dur);
                            if (techSlug) fd.set("technique_slug", techSlug);
                            const { addInstructionAction } = await import("@/app/dashboard/recipes/actions");
                            await addInstructionAction(fd);
                            setText("");
                            setDur("");
                            setTechSlug("");
                        }}
                    >
                        {/* textarea com altura do input e resize opcional */}
                        <Textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Descreva o passo..."
                            rows={1}
                            className="h-10 min-h-10 resize-y"
                        />

                        <Input
                            type="number"
                            min={0}
                            value={dur}
                            onChange={(e) => setDur(e.target.value)}
                            placeholder="Duração (min)"
                            className="h-10"
                        />

                        {/* Técnica (opcional) */}
                        <div className="flex items-center gap-2">
                            <Wand2 className="h-4 w-4 opacity-70" />
                            <select
                                value={techSlug}
                                onChange={(e) => setTechSlug(e.target.value)}
                                className="h-10 w-full rounded-md border bg-background px-2 text-sm"
                            >
                                <option value="">— Técnica —</option>
                                {Object.entries(TECHNIQUE_LABELS as Record<string, string>).map(([slug, label]) => (
                                    <option key={slug} value={slug}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Button type="submit" className="h-10 rounded-xl">
                            <Plus className="mr-2 h-4 w-4" /> Adicionar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Lista de passos */}
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
                                <InstructionItem
                                    key={it.id}
                                    idx={idx}
                                    it={it}
                                    recipeId={recipeId}
                                    tips={tipsByInstruction[it.id] ?? []}
                                    techniqueLabel={
                                        it.technique_id ? techniqueById[it.technique_id]?.label ?? null : null
                                    }
                                />
                            ))}
                        </ol>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function InstructionItem({
                             it,
                             idx,
                             recipeId,
                             tips,
                             techniqueLabel,
                         }: {
    it: RecipeInstructionRow & { technique_id?: string | null };
    idx: number;
    recipeId: string;
    tips: TipForUI[];
    techniqueLabel: string | null;
}) {
    // edição inline
    const [techSlug, setTechSlug] = useState<string>("");
    // tips
    const [showTipForm, setShowTipForm] = useState(false);
    const [tipType, setTipType] = useState<TipType>("tip");
    const [tipTitle, setTipTitle] = useState("");
    const [tipText, setTipText] = useState("");

    return (
        <li className="rounded-xl border p-3">
            {/* Header do passo */}
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span className="inline-block rounded bg-muted px-2 py-0.5">Passo {idx + 1}</span>
                    {it.duration_minutes != null ? <span>• {it.duration_minutes} min</span> : null}
                    {techniqueLabel ? (
                        <Badge variant="secondary" className="rounded-md">
                            {techniqueLabel}
                        </Badge>
                    ) : null}
                </div>
                <div className="flex items-center gap-1">
                    <form
                        action={async (fd) => {
                            fd.set("id", it.id);
                            fd.set("dir", "up");
                            const { moveInstructionAction } = await import("@/app/dashboard/recipes/actions");
                            await moveInstructionAction(fd);
                        }}
                    >
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                            <ArrowUp className="h-4 w-4" />
                        </Button>
                    </form>
                    <form
                        action={async (fd) => {
                            fd.set("id", it.id);
                            fd.set("dir", "down");
                            const { moveInstructionAction } = await import("@/app/dashboard/recipes/actions");
                            await moveInstructionAction(fd);
                        }}
                    >
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                            <ArrowDown className="h-4 w-4" />
                        </Button>
                    </form>
                    <form
                        action={async (fd) => {
                            if (!confirm("Remover passo?")) return;
                            fd.set("id", it.id);
                            const { deleteInstructionAction } = await import("@/app/dashboard/recipes/actions");
                            await deleteInstructionAction(fd);
                        }}
                    >
                        <Button size="icon" variant="destructive" className="h-8 w-8 rounded-xl">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>

            {/* Editar passo + técnica (alinhado) */}
            <form
                className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px_240px_120px]"
                action={async (fd) => {
                    fd.set("id", it.id);
                    if (techSlug === "_clear_") {
                        fd.set("technique_slug", ""); // zera
                    } else if (techSlug !== "") {
                        fd.set("technique_slug", techSlug);
                    }
                    const { updateInstructionAction } = await import("@/app/dashboard/recipes/actions");
                    await updateInstructionAction(fd);
                    setTechSlug("");
                }}
            >
                <Textarea name="text" defaultValue={it.text} rows={1} className="h-10 min-h-10 resize-y" />
                <Input
                    name="duration_minutes"
                    type="number"
                    min={0}
                    defaultValue={it.duration_minutes ?? ""}
                    placeholder="min"
                    className="h-10"
                />
                <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 opacity-70" />
                    <select
                        value={techSlug}
                        onChange={(e) => setTechSlug(e.target.value)}
                        className="h-10 w-full rounded-md border bg-background px-2 text-sm"
                    >
                        <option value="">— Técnica (manter/alterar) —</option>
                        {Object.entries(TECHNIQUE_LABELS as Record<string, string>).map(([slug, label]) => (
                            <option key={slug} value={slug}>
                                {label}
                            </option>
                        ))}
                        <option value="_clear_">— Limpar técnica —</option>
                    </select>
                </div>
                <Button type="submit" size="sm" variant="secondary" className="h-10 rounded-xl">
                    Salvar
                </Button>
            </form>

            {/* Tips da etapa */}
            <div className="mt-3 space-y-2">
                {/* Listagem de tips (se houver) */}
                {tips.length > 0 && (
                    <ul className="space-y-2">
                        {tips.map((tip) => (
                            <li key={tip.id} className="rounded-md border px-2 py-2">
                                <div className="mb-1 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs">
                                        <TipIcon type={tip.type} />
                                        <span className="font-medium">
                      {(TIP_TYPE_LABELS as Record<string, string>)[tip.type]}
                    </span>
                                        {tip.title ? <span>• {tip.title}</span> : null}
                                    </div>
                                    {/* remover */}
                                    <form
                                        action={async (fd) => {
                                            fd.set("id", tip.id);
                                            const { deleteTipAction } = await import("@/app/dashboard/recipes/actions");
                                            await deleteTipAction(fd);
                                        }}
                                    >
                                        <Button size="sm" variant="ghost" className="h-7 px-2">
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
                                        <Button type="submit" size="sm" variant="outline" className="rounded-xl">
                                            Atualizar dica
                                        </Button>
                                    </div>
                                </form>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Adicionar dica */}
                <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-xl px-2 text-xs"
                    onClick={() => setShowTipForm((v) => !v)}
                >
                    {showTipForm ? "Cancelar dica" : "Adicionar dica"}
                </Button>

                {showTipForm && (
                    <form
                        className="grid grid-cols-1 gap-2 md:grid-cols-[160px_1fr_auto]"
                        action={async (fd) => {
                            fd.set("recipe_id", recipeId);
                            fd.set("instruction_id", it.id);
                            fd.set("type", tipType);
                            if (tipTitle) fd.set("title", tipTitle);
                            fd.set("text", tipText);
                            const { addTipAction } = await import("@/app/dashboard/recipes/actions");
                            await addTipAction(fd);
                            setTipText("");
                            setTipTitle("");
                            setTipType("tip");
                            setShowTipForm(false);
                        }}
                    >
                        <select
                            value={tipType}
                            onChange={(e) => setTipType(e.target.value as TipType)}
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
                            value={tipTitle}
                            onChange={(e) => setTipTitle(e.target.value)}
                        />
                        <Textarea
                            placeholder="Texto da dica…"
                            value={tipText}
                            onChange={(e) => setTipText(e.target.value)}
                            rows={2}
                            className="md:col-span-3"
                        />
                        <div className="md:col-span-3">
                            <Button type="submit" size="sm" className="rounded-xl">
                                Adicionar dica
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </li>
    );
}
