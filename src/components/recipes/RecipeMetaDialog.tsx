// src/components/recipes/RecipeMetaDialog.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { RecipeMetaForm } from "./RecipeMetaForm";

export function RecipeMetaDialog({
                                     recipe,
                                 }: {
    recipe: {
        id: string;
        name: string;
        category: string | null;
        status: string;
        difficulty: string | null;
        prep_time_minutes: number | null;
    };
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl">
                    <Pencil className="mr-2 h-4 w-4" /> Editar metadados
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar metadados</DialogTitle>
                    <DialogDescription>Atualize as informações principais da receita.</DialogDescription>
                </DialogHeader>

                <RecipeMetaForm recipe={recipe} onSaved={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
