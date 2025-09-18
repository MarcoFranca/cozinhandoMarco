"use client";

type Ingredient = {
    name: string;
    amount: number | null;
    unit: string | null;
    optional: boolean | null;
    position: number | null;
};

export function IngredientsClient({ ingredients }: { ingredients: Ingredient[] }) {
    async function copyList() {
        const text = ingredients
            .map(i => `${i.amount ?? ""} ${i.unit ?? ""} ${i.name}`.trim())
            .join("\n");
        await navigator.clipboard.writeText(text);
        alert("Lista de compras copiada!");
    }

    return (
        <section className="space-y-3">
            <h2 className="text-xl font-semibold">Ingredientes</h2>
            <ul className="grid gap-2">
                {ingredients.map((ing, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>
              {ing.amount ?? ""} {ing.unit ?? ""} {ing.name}
                            {ing.optional ? " (opcional)" : ""}
            </span>
                    </li>
                ))}
            </ul>
            <button
                onClick={copyList}
                className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
            >
                Copiar lista de compras
            </button>
        </section>
    );
}
