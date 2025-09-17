"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, STATUSES, DIFFICULTIES } from "@/constants/taxonomies";
import { updateRecipeMetaAction } from "@/app/recipes/actions";

export function RecipeMetaForm({
                                   recipe,
                                   onSaved,
                               }: {
    recipe: {
        id: string;
        name: string;
        category: string | null;
        status: string;
        difficulty: string | null;
        prep_time_minutes: number | null;
    };
    onSaved?: () => void; // 👈 novo
}) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    async function onSubmit(formData: FormData) {
        startTransition(async () => {
            await updateRecipeMetaAction(formData);
            router.refresh();     // 👈 força re-fetch do Server Component
            onSaved?.();          // 👈 fecha modal (ou colapsado)
        });
    }

    return (
        <form action={onSubmit} className="space-y-3">
            <input type="hidden" name="id" value={recipe.id} />

            <div className="space-y-1">
                <label className="text-sm font-medium">Nome</label>
                <Input name="name" defaultValue={recipe.name} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Categoria</label>
                    <select
                        name="category"
                        defaultValue={recipe.category ?? ""}
                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    >
                        <option value="">—</option>
                        {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Status</label>
                    <select
                        name="status"
                        defaultValue={recipe.status}
                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    >
                        {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Dificuldade</label>
                    <select
                        name="difficulty"
                        defaultValue={recipe.difficulty ?? ""}
                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    >
                        <option value="">—</option>
                        {DIFFICULTIES.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Tempo de preparo (min)</label>
                    <Input type="number" name="prep_time_minutes" defaultValue={recipe.prep_time_minutes ?? ""} min={0} />
                </div>
            </div>

            <Button type="submit" disabled={isPending} className="rounded-xl">
                {isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
        </form>
    );
}
