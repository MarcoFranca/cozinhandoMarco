import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Recipe } from "@/types/recipe";

const statusPt: Record<Recipe["status"], string> = {
    idea: "Ideia",
    tested: "Testada",
    recorded: "Gravada",
    edited: "Editada",
    published: "Publicada",
};

export function StatusBadge({ value }: { value: Recipe["status"] }) {
    const variant = {
        idea: "secondary",
        tested: "default",
        recorded: "outline",
        edited: "outline",
        published: "secondary",
    } as const;

    return (
        <Badge variant={variant[value] ?? "secondary"}>
            {statusPt[value] ?? value}
        </Badge>
    );
}

const catPt: Record<string, string> = {
    Pasta: "Massa",
    Meat: "Carne",
    Fish: "Peixe",
    Dessert: "Doce",
    Sauce: "Molho",
    Drink: "Bebida",
    Side: "Acompanhamento",
    Soup: "Sopa",
};

export function CategoryBadge({ value }: { value: string | null }) {
    if (!value) return <span className="text-xs text-muted-foreground">—</span>;
    return <Badge variant="outline">{catPt[value] ?? value}</Badge>;
}

const diffPt: Record<NonNullable<Recipe["difficulty"]>, string> = {
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
};

export function DifficultyText({ value }: { value: Recipe["difficulty"] }) {
    return <span>{value ? diffPt[value] : "—"}</span>;
}

export function NameCell({ id, name }: { id: string; name: string }) {
    return (
        <Link href={`/recipes/${id}`} className="font-medium hover:underline">
            {name}
        </Link>
    );
}
