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
    const handleNewRecipe = useCallback(() => router.push("/dashboard/recipes?new=1"), [router]);
    const handleOpenShopping = useCallback(() => router.push("/dashboard/shopping"), [router]);
    const handleSchedule = useCallback(() => router.push("/dashboard/recipes?tab=recording"), [router]);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleOpenShopping} className="rounded-2xl cursor-pointer">
                <ListChecks className="mr-2 h-4 w-4" /> Lista de Compras
            </Button>
            <Button variant="outline" onClick={handleSchedule} className="rounded-2xl cursor-pointer">
                <Calendar className="mr-2 h-4 w-4" /> Agendar Gravação
            </Button>
        </div>
    );
}
