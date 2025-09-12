"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Recipe } from "@/types/recipe";
import { updateRecipeAction } from "@/app/recipes/[id]/actions";

// 1) Tipamos o estado do formulário
type FormState = { ok: boolean; message: string };

const categories = [
    { value: "", label: "—" },
    { value: "Pasta", label: "Massa" },
    { value: "Meat", label: "Carne" },
    { value: "Fish", label: "Peixe" },
    { value: "Dessert", label: "Doce" },
    { value: "Sauce", label: "Molho" },
    { value: "Drink", label: "Bebida" },
    { value: "Side", label: "Acompanhamento" },
    { value: "Soup", label: "Sopa" },
] as const;

const statuses = [
    { value: "idea", label: "Ideia" },
    { value: "tested", label: "Testada" },
    { value: "recorded", label: "Gravada" },
    { value: "edited", label: "Editada" },
    { value: "published", label: "Publicada" },
] as const;

const difficulties = [
    { value: "", label: "—" },
    { value: "easy", label: "Fácil" },
    { value: "medium", label: "Médio" },
    { value: "hard", label: "Difícil" },
] as const;

export function RecipeGeneralForm({ recipe }: { recipe: Recipe }) {
    // 2) Use os genéricos: <FormState, FormData>
    const [state, formAction, isPending] = useActionState<FormState, FormData>(
        // 3) Tipar os parâmetros do reducer (prev e payload)
        async (_prev: FormState, formData: FormData): Promise<FormState> => {
            try {
                await updateRecipeAction(formData);
                return { ok: true, message: "Salvo!" };
            } catch (e: any) {
                return { ok: false, message: e?.message ?? "Erro ao salvar" };
            }
        },
        { ok: false, message: "" }
    );

    // feedback simples (pode trocar por toast)
    const [toast, setToast] = useState<string>("");
    useEffect(() => {
        if (state.message) {
            setToast(state.message);
            const t = setTimeout(() => setToast(""), 2000);
            return () => clearTimeout(t);
        }
    }, [state]);

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" defaultValue={recipe.id} />

            <div className="space-y-1">
                <label className="text-sm">Nome *</label>
                <Input name="name" defaultValue={recipe.name} required />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1">
                    <label className="text-sm">Categoria</label>
                    <select
                        name="category"
                        defaultValue={recipe.category ?? ""}
                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    >
                        {categories.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm">Status</label>
                    <select
                        name="status"
                        defaultValue={recipe.status}
                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    >
                        {statuses.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm">Dificuldade</label>
                    <select
                        name="difficulty"
                        defaultValue={recipe.difficulty ?? ""}
                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    >
                        {difficulties.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm">Tempo de preparo (min)</label>
                <Input
                    name="prep_time_minutes"
                    type="number"
                    min={0}
                    defaultValue={recipe.prep_time_minutes ?? ""}
                />
            </div>

            <div className="space-y-1">
                <label className="text-sm">Ingredientes</label>
                <textarea
                    name="ingredients"
                    defaultValue={recipe.ingredients ?? ""}
                    rows={5}
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    placeholder={`- 1 kg de batata
- 200 g de gorgonzola
- 2 cx de creme de leite`}
                />
            </div>

            <div className="space-y-1">
                <label className="text-sm">Instruções</label>
                <textarea
                    name="instructions"
                    defaultValue={recipe.instructions ?? ""}
                    rows={6}
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    placeholder={`1) Cozinhe as batatas...
2) Amasse...
3) Misture a farinha...`}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-sm">URL do YouTube</label>
                    <Input name="youtube_url" defaultValue={recipe.youtube_url ?? ""} placeholder="https://youtube.com/..." />
                </div>
                <div className="space-y-1">
                    <label className="text-sm">URL da capa</label>
                    <Input name="cover_url" defaultValue={recipe.cover_url ?? ""} placeholder="https://..." />
                </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
                <Button type="submit" className="rounded-xl" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar"}
                </Button>
                {toast && <span className="text-sm text-muted-foreground">{toast}</span>}
            </div>
        </form>
    );
}
