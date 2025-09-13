"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {RecipeStatus} from "@/app/page";
import {Difficulty} from "@/types/recipe";

export function NewRecipeDialog() {
    const router = useRouter();
    const params = useSearchParams();
    const open = params.get("new") === "1";

    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const [loading, setLoading] = useState(false);

    // form state
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [status, setStatus] = useState<RecipeStatus>("idea");
    const [difficulty, setDifficulty] = useState<Difficulty>("easy");
    const [prep, setPrep] = useState<string>("");

    // limpa ao abrir/fechar
    useEffect(() => {
        if (!open) {
            setName(""); setCategory(""); setStatus("idea"); setDifficulty("easy"); setPrep("");
        }
    }, [open]);

    function close() {
        const usp = new URLSearchParams(window.location.search);
        usp.delete("new");
        router.replace(`/recipes${usp.toString() ? `?${usp}` : ""}`, { scroll: false });
    }

    async function handleCreate() {
        try {
            if (!name.trim()) return alert("Dê um nome à receita 🙂");
            setLoading(true);

            // Pega a sessão de forma estável no client
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                alert("Sua sessão expirou. Faça login novamente.");
                router.replace("/login?next=/recipes?new=1");
                return;
            }

            const user_id = session.user.id;
            const prep_time_minutes = prep ? parseInt(prep, 10) : null;

            const { data, error } = await supabase
                .from("recipes")
                .insert([{
                    user_id,
                    name: name.trim(),
                    category: category || null,
                    status,
                    difficulty: difficulty || null,
                    prep_time_minutes, // <—
                }])
                .select("id")
                .single();


            if (error) throw error;

            close();
            router.replace(`/recipes/${data!.id}`);
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Erro ao criar receita";
            console.error(err)
            alert(message)
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => (!v ? close() : null)}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Nova receita</DialogTitle>
                    <DialogDescription>Crie a ficha básica. Você pode completar depois.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-sm">Nome *</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Nhoque de batata" />
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="space-y-1">
                            <label className="text-sm">Categoria</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="h-9 rounded-md border bg-background px-2 text-sm w-full"
                            >
                                <option value="">Selecione…</option>
                                <option value="Pasta">Massa</option>
                                <option value="Meat">Carne</option>
                                <option value="Fish">Peixe</option>
                                <option value="Dessert">Doce</option>
                                <option value="Sauce">Molho</option>
                                <option value="Drink">Bebida</option>
                                <option value="Side">Acompanhamento</option>
                                <option value="Soup">Sopa</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm">Status</label>
                            <select
                                value={status}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    setStatus(e.target.value as RecipeStatus)
                                }
                                className="h-9 rounded-md border bg-background px-2 text-sm w-full"
                            >
                                <option value="idea">Ideia</option>
                                <option value="tested">Testada</option>
                                <option value="recorded">Gravada</option>
                                <option value="edited">Editada</option>
                                <option value="published">Publicada</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm">Dificuldade</label>
                            <select
                                value={difficulty}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    setDifficulty(e.target.value as Difficulty)}
                                className="h-9 rounded-md border bg-background px-2 text-sm w-full"
                            >
                                <option value="">—</option>
                                <option value="easy">Fácil</option>
                                <option value="medium">Médio</option>
                                <option value="hard">Difícil</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm">Tempo de preparo (min)</label>
                        <Input type="number" min={0} value={prep} onChange={(e) => setPrep(e.target.value)} />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={close} disabled={loading}>Cancelar</Button>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading ? "Criando..." : "Criar"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
