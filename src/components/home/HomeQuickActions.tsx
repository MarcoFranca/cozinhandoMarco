"use client";

import { Button } from "@/components/ui/button";
import { Plus, Calendar, ListChecks, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import {ThemeToggle} from "@/components/theme/ThemeToggle";

export function HomeQuickActions() {
    const router = useRouter();

    const handleNewRecipe = useCallback(() => router.push("/recipes?new=1"), [router]);
    const handleOpenShopping = useCallback(() => router.push("/shopping"), [router]);
    const handleSchedule = useCallback(() => router.push("/recipes?tab=recording"), [router]);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleNewRecipe} className="rounded-2xl cursor-pointer">
                <Plus className="mr-2 h-4 w-4" /> Nova Receita
            </Button>
            <Button variant="secondary" onClick={handleOpenShopping} className="rounded-2xl cursor-pointer">
                <ListChecks className="mr-2 h-4 w-4" /> Lista de Compras
            </Button>
            <Button variant="outline" onClick={handleSchedule} className="rounded-2xl cursor-pointer">
                <Calendar className="mr-2 h-4 w-4" /> Agendar Gravação
            </Button>
            <ThemeToggle />
            <Button
                variant="ghost"
                onClick={() => {
                    // TODO: abrir Command Palette (shadcn) se já estiver instalado
                    const el = document.getElementById("global-search");
                    if (el) el.focus();
                }}
                className="rounded-2xl"
            >
                <Search className="mr-2 h-4 w-4" /> Buscar <span className="ml-2 rounded bg-muted px-1.5 text-xs">/</span>
            </Button>
        </div>
    );
}
