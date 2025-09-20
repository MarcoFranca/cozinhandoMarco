// src/components/recipes/RecipeAdvancedTaxonomiesSheet.tsx
"use client";

import * as React from "react";
import { useTransition } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    CUISINE_LABELS,
    DIET_LABELS,
    TECHNIQUE_LABELS,
    OCCASION_LABELS,
} from "@/constants/taxonomies";
import { SlidersHorizontal } from "lucide-react";

type Option = { slug: string; label: string };
const mapToOptions = (rec: Record<string, string>) =>
    Object.entries(rec).map(([slug, label]) => ({ slug, label }));

const CUISINE_OPTIONS: Option[] = mapToOptions(CUISINE_LABELS as Record<string, string>);
const DIET_OPTIONS: Option[] = mapToOptions(DIET_LABELS as Record<string, string>);
const TECH_OPTIONS: Option[] = mapToOptions(TECHNIQUE_LABELS as Record<string, string>);
const OCC_OPTIONS: Option[] = mapToOptions(OCCASION_LABELS as Record<string, string>);

export type RecipeAdvancedTaxonomies = {
    id: string;
    cuisine_slugs: string[];
    diet_slugs: string[];
    technique_slugs: string[];
    occasion_slugs: string[];
};

export function RecipeAdvancedTaxonomiesSheet({ recipe }: { recipe: RecipeAdvancedTaxonomies }) {
    const [open, setOpen] = React.useState(false);
    const [isPending, startTransition] = useTransition();

    const [cuisines, setCuisines] = React.useState<string[]>(recipe.cuisine_slugs ?? []);
    const [diets, setDiets] = React.useState<string[]>(recipe.diet_slugs ?? []);
    const [techs, setTechs] = React.useState<string[]>(recipe.technique_slugs ?? []);
    const [occs, setOccs] = React.useState<string[]>(recipe.occasion_slugs ?? []);

    function toggle(list: string[], setter: (v: string[]) => void, slug: string) {
        setter(list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]);
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="rounded-xl cursor-pointer">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Configurações avançadas
                </Button>
            </SheetTrigger>

            {/* p-0 para controlarmos padding interno manualmente; max-w maior e altura total */}
            <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl p-0 max-h-screen">
                {/* HEADER com padding */}
                <SheetHeader className="px-4 pt-4">
                    <SheetTitle>Configurações avançadas</SheetTitle>
                    <SheetDescription>Selecione cozinhas, dietas, técnicas e ocasiões.</SheetDescription>
                </SheetHeader>

                {/* FORM ocupa altura total, com área rolável e footer fixo */}
                <form
                    action={(fd) => {
                        startTransition(async () => {
                            fd.set("id", recipe.id);

                            // markers + arrays
                            fd.set("cuisines_present", "1");
                            cuisines.forEach((s) => fd.append("cuisine_slugs[]", s));

                            fd.set("diet_present", "1");
                            diets.forEach((s) => fd.append("diet_slugs[]", s));

                            fd.set("tech_present", "1");
                            techs.forEach((s) => fd.append("technique_slugs[]", s));

                            fd.set("occ_present", "1");
                            occs.forEach((s) => fd.append("occasion_slugs[]", s));

                            const { updateRecipeExtraTaxonomiesAction } = await import("@/app/dashboard/recipes/actions");
                            await updateRecipeExtraTaxonomiesAction(fd);
                            toast.success("Configurações salvas!");
                            setOpen(false);
                        });
                    }}
                    className="mt-2 flex h-[calc(100vh-3.5rem)] flex-col" // altura total - header
                >
                    {/* CONTEÚDO ROLÁVEL com padding interno generoso */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-6">
                        <Section
                            title="Cozinhas (cuisines)"
                            options={CUISINE_OPTIONS}
                            selected={cuisines}
                            onToggle={(slug) => toggle(cuisines, setCuisines, slug)}
                        />

                        <Section
                            title="Dietas (diet labels)"
                            options={DIET_OPTIONS}
                            selected={diets}
                            onToggle={(slug) => toggle(diets, setDiets, slug)}
                        />

                        <Section
                            title="Técnicas (techniques)"
                            options={TECH_OPTIONS}
                            selected={techs}
                            onToggle={(slug) => toggle(techs, setTechs, slug)}
                        />

                        <Section
                            title="Ocasiões (occasions)"
                            options={OCC_OPTIONS}
                            selected={occs}
                            onToggle={(slug) => toggle(occs, setOccs, slug)}
                        />
                    </div>

                    {/* FOOTER fixo com fundo e borda para destacar ações */}
                    <SheetFooter className="sticky bottom-0 mt-0 border-t bg-background px-4 py-3">
                        <div className="flex w-full justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="rounded-xl"
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending} className="rounded-xl">
                                {isPending ? "Salvando..." : "Salvar"}
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

function Section({
                     title,
                     options,
                     selected,
                     onToggle,
                 }: {
    title: string;
    options: Option[];
    selected: string[];
    onToggle: (slug: string) => void;
}) {
    return (
        <section className="grid gap-3 rounded-2xl border p-3">
            <div className="text-sm font-medium">{title}</div>
            <div className="grid gap-1 sm:grid-cols-2">
                {options.map((o) => (
                    <label key={o.slug} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted/60">
                        <input
                            type="checkbox"
                            className="accent-foreground"
                            checked={selected.includes(o.slug)}
                            onChange={() => onToggle(o.slug)}
                        />
                        <span>{o.label}</span>
                    </label>
                ))}
            </div>

            {selected.length > 0 && (
                <div className="text-xs text-muted-foreground">
                    Selecionados: {selected.length}
                </div>
            )}
        </section>
    );
}
