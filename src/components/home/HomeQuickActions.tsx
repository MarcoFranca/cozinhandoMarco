// components/home/HomeQuickActions.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Plus, Calendar, ListChecks, Search, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
// 👇 importa a server action
import { signOutAction } from "@/app/actions-auth";

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

            {/* Botão de busca ajustado (item 2) */}
            <Button
                variant="ghost"
                onClick={() => {
                    const el = document.getElementById("global-search");
                    if (el) el.focus();
                }}
                className="rounded-2xl h-9 pl-3 pr-2 gap-2 inline-flex items-center cursor-pointer"
            >
                <Search className="h-4 w-4 opacity-80 " />
                <span className="text-sm">Buscar</span>
                <kbd className="ml-1 rounded border bg-background px-1.5 text-[10px] leading-none">/</kbd>
            </Button>

            {/* Logout (server action) */}
            <form action={signOutAction}>
                <Button type="submit" variant="ghost" className="rounded-2xl h-9 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                </Button>
            </form>
        </div>
    );
}
