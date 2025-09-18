import { requireUser } from "@/lib/auth";
import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";
import { ShoppingHeader } from "@/components/shopping/ShoppingHeader";
import { ShoppingList } from "@/components/shopping/ShoppingList";
import { ShoppingUnifiedList } from "@/components/shopping/ShoppingUnifiedList";

export const dynamic = "force-dynamic";

type ShoppingItemRow = {
    id: string;
    recipe_id: string | null;
    ingredient_name: string;
    quantity: number | null;
    note: string | null;          // hoje: guarda unidade ou observação
    in_pantry: boolean;
    created_at: string;
    recipe_ingredient_id: string | null;
    // enriquecidos no server:
    optional?: boolean;
    unit?: string | null;
};

type Props = {
    searchParams: Promise<{
        show?: string;              // "pending" | "all"
        hide_optional?: string;     // "1" | undefined
        unified?: string;           // "1" | undefined
        selected?: string;          // "id1,id2,..."
    }>;
};

export default async function ShoppingPage({ searchParams }: Props) {
    const { user } = await requireUser();
    const supabase = await createSupabaseRSCClient();

    const { show: showRaw, hide_optional, unified, selected } = await searchParams;
    const show = (showRaw ?? "pending") as "pending" | "all";
    const hideOptionals = hide_optional === "1";
    const unifiedMode = unified === "1";
    const selectedIds = (selected ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    // 1) Busca itens da lista
    const { data: itemsRaw } = await supabase
        .from("shopping_list_items")
        .select("id, recipe_id, ingredient_name, quantity, note, in_pantry, created_at, recipe_ingredient_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    let items = (itemsRaw ?? []) as ShoppingItemRow[];
    if (show === "pending") items = items.filter((i) => !i.in_pantry);

    // 2) Carrega metadados de receitas para chips e títulos
    const recipeIds = Array.from(new Set(items.map((i) => i.recipe_id).filter(Boolean))) as string[];
    const recipeNames = new Map<string, string>();
    if (recipeIds.length) {
        const { data: recs } = await supabase.from("recipes").select("id, name").in("id", recipeIds);
        (recs ?? []).forEach((r) => recipeNames.set(r.id, r.name));
    }

    // 3) Enriquecer itens com optional/unit via recipe_ingredients
    const ingIds = Array.from(
        new Set(
            items
                .map((i) => i.recipe_ingredient_id)
                .filter((v): v is string => typeof v === "string" && v.length > 0)
        )
    );
    if (ingIds.length) {
        const { data: meta } = await supabase
            .from("recipe_ingredients")
            .select("id, optional, unit")
            .in("id", ingIds);

        const mOpt = new Map<string, { optional: boolean; unit: string | null }>();
        (meta ?? []).forEach((r) => mOpt.set(r.id, { optional: r.optional ?? false, unit: r.unit ?? null }));
        items = items.map((i) => {
            const info = i.recipe_ingredient_id ? mOpt.get(i.recipe_ingredient_id) : undefined;
            return { ...i, optional: info?.optional ?? false, unit: info?.unit ?? null };
        });
    }

    // 4) Filtros por opcionais e receitas selecionadas
    if (hideOptionals) items = items.filter((i) => !i.optional);
    const selectedSet =
        selectedIds.length > 0 ? new Set(selectedIds) : null;
    if (selectedSet) items = items.filter((i) => (i.recipe_id ? selectedSet.has(i.recipe_id) : true));

    // 5) Agrupar por receita (modo normal)
    const groupsMap = new Map<string | null, ShoppingItemRow[]>();
    for (const it of items) {
        const key = it.recipe_id ?? null;
        if (!groupsMap.has(key)) groupsMap.set(key, []);
        groupsMap.get(key)!.push(it);
    }
    const groups = Array.from(groupsMap.entries()).map(([rid, rows]) => ({
        recipe_id: rid,
        recipe_name: rid ? recipeNames.get(rid) ?? "Receita" : "Itens soltos",
        items: rows,
    }));

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
            <ShoppingHeader
                total={items.length}
                show={show}
                hideOptionals={hideOptionals}
                unified={unifiedMode}
                recipes={recipeIds.map((id) => ({ id, name: recipeNames.get(id) ?? "Receita" }))}
                selected={selectedIds}
            />

            {unifiedMode ? (
                <ShoppingUnifiedList items={items} />
            ) : (
                <ShoppingList groups={groups} />
            )}
        </div>
    );
}
