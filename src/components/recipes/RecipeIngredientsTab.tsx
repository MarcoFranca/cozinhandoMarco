"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    addIngredientAction,
    updateIngredientAction,
    deleteIngredientAction,
    moveIngredientAction,
    addToShoppingAction,
    removeFromShoppingAction,
} from "@/app/recipes/[id]/actions-ingredients";

type Ingredient = {
    id: string;
    recipe_id: string;
    name: string;
    amount: number | null;
    unit: string | null;
    note: string | null;
    optional: boolean;
    position: number;
};

const UNITS = ["g", "kg", "ml", "l", "un", "xíc", "colher", "colher de chá"] as const;

export function RecipeIngredientsTab({
                                         recipeId,
                                         items,
                                         inShoppingIds,
                                     }: {
    recipeId: string;
    items: Ingredient[];
    inShoppingIds: string[]; // lista de recipe_ingredient_id que já estão na lista de compras
}) {
    const [selected, setSelected] = useState<string[]>([]);
    const inShopping = useMemo(() => new Set(inShoppingIds), [inShoppingIds]);

    function toggleSelect(id: string) {
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    function toggleAll() {
        if (selected.length === items.length) setSelected([]);
        else setSelected(items.map((i) => i.id));
    }

    const idsCsv = selected.join(",");

    return (
        <div className="space-y-4">
            {/* Form de criação rápida */}
            <form action={addIngredientAction} className="grid grid-cols-1 gap-2 md:grid-cols-12 items-end">
                <input type="hidden" name="recipe_id" value={recipeId}/>
                <div className="md:col-span-4">
                    <label className="text-sm">Ingrediente *</label>
                    <Input
                        name="name"
                        placeholder="Ex.: Batata"
                        required
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                                e.preventDefault();
                            }
                        }}
                    />
                </div>
                <div>
                    <label className="text-sm">Qtd</label>
                    <Input name="amount" type="number" step="0.01" placeholder="1"/>
                </div>
                <div>
                    <label className="text-sm">Unidade</label>
                    <select name="unit" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                        <option value="">—</option>
                        {UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-4">
                    <label className="text-sm">Observação</label>
                    <Input name="note" placeholder="Ex.: Asterix"/>
                </div>
                <div className="flex items-center gap-2">
                    <input id="optional_new" name="optional" type="checkbox" className="h-4 w-4"/>
                    <label htmlFor="optional_new" className="text-sm">Opcional</label>
                </div>
                <div className="md:col-span-2">
                    <Button type="submit" className="w-full rounded-xl">Adicionar</Button>
                </div>
            </form>

            {/* Ações em lote */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {selected.length > 0 ? `${selected.length} selecionado(s)` : `${items.length} ingrediente(s)`}
                </div>
                <div className="flex gap-2">
                    <form action={addToShoppingAction}>
                        <input type="hidden" name="recipe_id" value={recipeId}/>
                        <input type="hidden" name="ids" value={idsCsv}/>
                        <Button type="submit" variant="secondary" disabled={!idsCsv} className="rounded-xl">
                            Adicionar selecionados
                        </Button>
                    </form>
                    <form action={removeFromShoppingAction}>
                        <input type="hidden" name="recipe_id" value={recipeId}/>
                        <input type="hidden" name="ids" value={idsCsv}/>
                        <Button type="submit" variant="outline" disabled={!idsCsv} className="rounded-xl">
                            Remover da lista
                        </Button>
                    </form>
                </div>
            </div>

            {/* Lista */}
            <div className="overflow-x-auto rounded-2xl border">
                <table className="w-full table-fixed min-w-[920px]">

                    <thead className="sticky top-0 z-[1] bg-background/95 backdrop-blur text-sm border-b">
                    <tr>
                        <th className="px-3 py-2 w-10">
                            <Checkbox
                                checked={selected.length === items.length && items.length > 0}
                                onCheckedChange={toggleAll}
                                aria-label="Selecionar todos"
                            />
                        </th>
                        <th className="px-3 py-2 text-left w-[20%]">Ingrediente</th>
                        <th className="px-3 py-2 w-[12%]">Qtd</th>
                        <th className="px-3 py-2 w-[14%]">Un</th>
                        <th className="px-3 py-2 w-[26%]">Obs</th>
                        <th className="px-3 py-2 w-[10%]">Opcional</th>
                        <th className="px-3 py-2 w-[10%]">Lista</th>
                        <th className="px-3 py-2 w-[150px] text-left">Ações</th>
                    </tr>
                    </thead>
                    <tbody
                        className="divide-y [&>tr:nth-child(odd)]:bg-muted/30 hover:[&>tr]:bg-muted/40 transition-colors">
                    {items.map((i, idx) => (
                        <tr key={i.id} className="align-middle">
                            <td className="px-3">
                                <Checkbox checked={selected.includes(i.id)} onCheckedChange={() => toggleSelect(i.id)}/>
                            </td>

                            {/* update inline: field por field em pequenos forms */}
                            <td className="px-3 py-2">
                                <AutoSubmitInput name="name" id={i.id} recipeId={i.recipe_id} defaultValue={i.name}/>
                            </td>
                            <td className="px-3 py-2 w-24">
                                <AutoSubmitInput name="amount" id={i.id} recipeId={i.recipe_id} type="number"
                                                 step="0.01" defaultValue={i.amount ?? ""}/>
                            </td>
                            <td className="px-3 py-2 w-28">
                                <AutoSubmitSelect name="unit" id={i.id} recipeId={i.recipe_id}
                                                  defaultValue={i.unit ?? ""} options={UNITS}/>
                            </td>
                            <td className="px-3 py-2">
                                <AutoSubmitInput name="note" id={i.id} recipeId={i.recipe_id}
                                                 defaultValue={i.note ?? ""}/>
                            </td>
                            <td className="px-3 py-2 text-center">
                                <AutoSubmitCheckbox name="optional" id={i.id} recipeId={i.recipe_id}
                                                    defaultChecked={i.optional}/>
                            </td>
                            <td className="px-3 py-2 text-center">
                                {inShopping.has(i.id) ? (
                                    <span className="text-xs text-green-600 dark:text-green-400">Na lista</span>
                                ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                )}
                            </td>

                            <td className="px-3 py-2">
                                <div className="flex justify-end gap-2">
                                    <DeleteBtn id={i.id} recipeId={i.recipe_id} />
                                    <MoveBtn id={i.id} recipeId={i.recipe_id} dir="up" disabled={idx === 0}/>
                                    <MoveBtn id={i.id} recipeId={i.recipe_id} dir="down"
                                             disabled={idx === items.length - 1}/>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={8} className="p-6 text-center text-sm text-muted-foreground">
                                Nenhum ingrediente ainda. Adicione o primeiro acima. 🍳
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ———— Componentes auxiliares (inline edit) ————

// Auto-submit no blur/enter
function AutoSubmitInput(props: {
    id: string; recipeId: string;
    name: "name" | "amount" | "note";
    defaultValue: string | number; type?: string; step?: string;
    className?: string;
}) {
    const {id, recipeId, name, defaultValue, type = "text", step, className} = props;
    return (
        <form action={updateIngredientAction} className="flex">
            <input type="hidden" name="id" value={id}/>
            <input type="hidden" name="recipe_id" value={recipeId}/>
            <input
                name={name}
                defaultValue={defaultValue as any}
                type={type}
                step={step}
                onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.currentTarget.form?.requestSubmit(); e.preventDefault(); } }}
                className={`h-8 w-full rounded-md border border-border/70 bg-card px-2 text-sm ${className ?? ""}`}
            />
            <input type="submit" hidden />
        </form>
    );
}

// Select com auto-submit no change
function AutoSubmitSelect(props: {
    id: string; recipeId: string; name: "unit";
    defaultValue: string; options: readonly string[];
}) {
    const { id, recipeId, name, defaultValue, options } = props;
    return (
        <form action={updateIngredientAction} className="flex">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="recipe_id" value={recipeId} />
            <select
                name={name}
                defaultValue={defaultValue}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="h-8 w-full rounded-md border border-border/70 bg-card px-2 text-sm"
            >
                <option value="">—</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <input type="submit" hidden />
        </form>
    );
}

// Checkbox com auto-submit no change
function AutoSubmitCheckbox(props: {
    id: string; recipeId: string; name: "optional"; defaultChecked: boolean;
}) {
    const { id, recipeId, name, defaultChecked } = props;
    return (
        <form action={updateIngredientAction} className="flex items-center justify-center">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="recipe_id" value={recipeId} />
            {/* envia o valor invertido (toggle) */}
            <input type="hidden" name={name} value={(!defaultChecked).toString()} />
            <input
                type="checkbox"
                defaultChecked={defaultChecked}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="h-4 w-4 accent-foreground"
            />
            <input type="submit" hidden />
        </form>
    );
}

function MoveBtn({ id, recipeId, dir, disabled }: { id: string; recipeId: string; dir: "up" | "down"; disabled?: boolean }) {
    return (
        <form action={moveIngredientAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="recipe_id" value={recipeId} />
            <input type="hidden" name="dir" value={dir} />
            <Button type="submit" variant="outline" size="sm" disabled={disabled} className="rounded-xl cursor-pointer">
                {dir === "up" ? "↑" : "↓"}
            </Button>
        </form>
    );
}

function DeleteBtn({ id, recipeId }: { id: string; recipeId: string }) {
    return (
        <form action={deleteIngredientAction} onSubmit={(e) => {
            if (!confirm("Excluir ingrediente?")) e.preventDefault();
        }}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="recipe_id" value={recipeId} />
            <Button type="submit" variant="destructive" size="sm" className="rounded-xl cursor-pointer">
                Excluir
            </Button>
        </form>
    );
}
