"use client";

type Row = {
    id: string;
    ingredient_name: string;
    quantity: number | null;
    unit?: string | null;
    note: string | null;
    optional?: boolean;
};

function keyOf(r: Row) {
    const name = r.ingredient_name.trim().toLowerCase();
    const unit = (r.unit ?? "").trim().toLowerCase(); // se não tiver unit, agrupa só por nome
    return `${name}||${unit}`;
}

export function ShoppingUnifiedList({ items }: { items: Row[] }) {
    // agrega por (nome, unidade)
    const map = new Map<string, { name: string; unit: string | null; qty: number; anyOptional: boolean }>();
    for (const it of items) {
        const k = keyOf(it);
        const cur = map.get(k);
        const add = Number(it.quantity ?? 0);
        if (!cur) {
            map.set(k, {
                name: it.ingredient_name.trim(),
                unit: it.unit ?? null,
                qty: add,
                anyOptional: Boolean(it.optional),
            });
        } else {
            cur.qty += add;
            cur.anyOptional = cur.anyOptional || Boolean(it.optional);
        }
    }

    const rows = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));

    if (rows.length === 0) return <p className="text-sm text-muted-foreground">Nada para unificar.</p>;

    return (
        <div className="rounded-2xl border">
            <div className="border-b px-4 py-3 text-sm font-medium">Lista unificada</div>
            <ul className="divide-y">
                {rows.map((r) => (
                    <li key={`${r.name}-${r.unit ?? ""}`} className="flex items-center justify-between px-4 py-2">
                        <div className="text-sm">
                            <div>
                                {r.name}
                                {r.anyOptional && <span className="ml-2 text-xs rounded bg-muted px-2 py-0.5">Tem opcionais</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {r.qty || "—"} {r.unit ?? ""}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
