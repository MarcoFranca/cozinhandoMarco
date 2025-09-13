"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

type Recipe = {
    id: string;
    user_id: string;
    name: string;
    category: string | null;
    status: string;
    ingredients: string | null;
    instructions: string | null;
    youtube_url: string | null;
    cover_url: string | null;
    prep_time_minutes: number | null;
    difficulty: string | null;
};

type ShoppingItem = {
    id: string;
    user_id: string;
    recipe_id: string | null;
    recipe_ingredient_id: string | null;
    ingredient_name: string;
    quantity: string | null;
    note: string | null;
    in_pantry: boolean;
    created_at: string;
};

type GroupRow = {
    name: string;
    unit: string | null;
    total: number;           // se somar numericamente
    items: ShoppingItem[];
};

type Recording = {
    id: string;
    shoot_date: string | null;       // yyyy-mm-dd
    shoot_status: string;            // planned|filmed|published
    equipment_checklist: EquipmentChecklist | null;
};

type EquipmentChecklist = Record<string, boolean>;

const statusOptions = ["idea", "tested", "filmed", "edited", "published"];
const difficultyOptions = ["easy", "medium", "advanced"];
const shootStatusOptions = ["planned", "filmed", "published"];

export default function RecipeDetailPage() {
    const { id } = useParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState("general");

    // --- recipe state ---
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [status, setStatus] = useState("idea");
    const [ingredients, setIngredients] = useState("");
    const [instructions, setInstructions] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [coverUrl, setCoverUrl] = useState("");
    const [prepTime, setPrepTime] = useState<number | string>("");
    const [difficulty, setDifficulty] = useState("");

    // --- shopping state ---
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [ingName, setIngName] = useState("");
    const [ingQty, setIngQty] = useState("");
    const [ingNote, setIngNote] = useState("");

    // --- recording state ---
    const [rec, setRec] = useState<Recording | null>(null);
    const checklist = useMemo(
        () => ({ tripod: true, microphone: true, lights: true, ...(rec?.equipment_checklist ?? {}) }),
        [rec]
    );

    // load everything
    useEffect(() => { (async () => {
        setLoading(true);
        // recipe
        const { data: r } = await supabase
            .from("recipes").select("*").eq("id", id).single();
        if (r) {
            setRecipe(r as Recipe);
            setName(r.name ?? "");
            setCategory(r.category ?? "");
            setStatus(r.status ?? "idea");
            setIngredients(r.ingredients ?? "");
            setInstructions(r.instructions ?? "");
            setYoutubeUrl(r.youtube_url ?? "");
            setCoverUrl(r.cover_url ?? "");
            setPrepTime(r.prep_time_minutes ?? "");
            setDifficulty(r.difficulty ?? "");
        }

        // shopping items
        const { data: si } = await supabase
            .from("shopping_list_items")
            .select("id, ingredient_name, quantity, note, in_pantry")
            .eq("recipe_id", id)
            .order("ingredient_name", { ascending: true });
        setItems((si ?? []) as ShoppingItem[]);

        // recording (pega 1 ou cria depois)
        const { data: sr } = await supabase
            .from("recordings")
            .select("id, shoot_date, shoot_status, equipment_checklist")
            .eq("recipe_id", id)
            .limit(1);
        setRec((sr?.[0] ?? null) as Recording | null);

        setLoading(false);
    })(); }, [id]);

    async function saveGeneral() {
        setSaving(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !recipe) return;

        const { error } = await supabase.from("recipes").update({
            user_id: session.user.id, // mantém o owner
            name, category, status,
            ingredients, instructions,
            youtube_url: youtubeUrl || null,
            cover_url: coverUrl || null,
            prep_time_minutes: prepTime === "" ? null : Number(prepTime),
            difficulty: difficulty || null,
            updated_at: new Date().toISOString(),
        }).eq("id", recipe.id);

        setSaving(false);
        if (error) return alert(error.message);
        alert("Receita salva!");
    }

    async function addItem() {
        if (!ingName.trim()) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase.from("shopping_list_items").insert([{
            user_id: session.user.id,
            recipe_id: id,
            ingredient_name: ingName,
            quantity: ingQty || null,
            note: ingNote || null,
            in_pantry: false,
        }]);

        if (error) return alert(error.message);
        setIngName(""); setIngQty(""); setIngNote("");
        const { data: si } = await supabase
            .from("shopping_list_items")
            .select("id, ingredient_name, quantity, note, in_pantry")
            .eq("recipe_id", id).order("ingredient_name");
        setItems((si ?? []) as ShoppingItem[]);
    }

    async function togglePantry(item: ShoppingItem, value: boolean) {
        const { error } = await supabase
            .from("shopping_list_items")
            .update({ in_pantry: value })
            .eq("id", item.id);
        if (!error) setItems(prev => prev.map(i => i.id === item.id ? { ...i, in_pantry: value } : i));
    }

    async function removeItem(item: ShoppingItem) {
        const { error } = await supabase.from("shopping_list_items").delete().eq("id", item.id);
        if (!error) setItems(prev => prev.filter(i => i.id !== item.id));
    }

    async function ensureRecording() {
        if (rec) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase.from("recordings").insert([{
            user_id: session.user.id,
            recipe_id: id,
            shoot_status: "planned",
            equipment_checklist: { tripod: true, microphone: true, lights: true },
        }]).select("id, shoot_date, shoot_status, equipment_checklist").single();

        if (error) return alert(error.message);
        setRec(data as Recording);
    }

    async function saveRecording(
        next: Partial<Recording & { equipment_checklist: EquipmentChecklist }>
    ) {
        if (!rec) return;

        const payload: Pick<
            Recording,
            "shoot_date" | "shoot_status" | "equipment_checklist"
        > & { updated_at: string } = {
            shoot_date: next.shoot_date ?? rec.shoot_date,
            shoot_status: next.shoot_status ?? rec.shoot_status,
            equipment_checklist: next.equipment_checklist ?? rec.equipment_checklist,
            updated_at: new Date().toISOString(),
        };

        // ❌ (rec as any).id  ->  ✅ rec.id
        const { error } = await supabase
            .from("recordings")
            .update(payload)
            .eq("id", rec.id);

        if (error) return alert(error.message);

        // ❌ prev as any  ->  ✅ checagem segura
        setRec((prev) => (prev ? { ...prev, ...payload } : prev));
    }

    if (loading) return <div className="p-6">Carregando…</div>;
    if (!recipe) return <div className="p-6">Receita não encontrada.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/recipes" className="text-sm text-muted-foreground hover:underline">← Voltar</Link>
                <h1 className="text-xl font-semibold">{name || "Recipe"}</h1>
            </div>

            <Tabs value={tab} onValueChange={setTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="shopping">Compras</TabsTrigger>
                    <TabsTrigger value="recording">Gravação</TabsTrigger>
                </TabsList>

                {/* --- Aba Geral --- */}
                <TabsContent value="general">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input value={name} onChange={e=>setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Categoria</Label>
                            <Input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Meat / Pasta / Dessert" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Input list="statusOptions" value={status} onChange={e=>setStatus(e.target.value)} />
                            <datalist id="statusOptions">
                                {statusOptions.map(s=> <option key={s} value={s} />)}
                            </datalist>
                        </div>
                        <div className="grid gap-2">
                            <Label>Dificuldade</Label>
                            <Input list="diffOptions" value={difficulty} onChange={e=>setDifficulty(e.target.value)} />
                            <datalist id="diffOptions">
                                {difficultyOptions.map(s=> <option key={s} value={s} />)}
                            </datalist>
                        </div>
                        <div className="grid gap-2">
                            <Label>Tempo de preparo (min)</Label>
                            <Input type="number" value={prepTime} onChange={e=>setPrepTime(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Link YouTube</Label>
                            <Input value={youtubeUrl} onChange={e=>setYoutubeUrl(e.target.value)} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Ingredientes (markdown ou lista)</Label>
                            <Textarea rows={4} value={ingredients} onChange={e=>setIngredients(e.target.value)} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Instruções (passo a passo)</Label>
                            <Textarea rows={6} value={instructions} onChange={e=>setInstructions(e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <Button onClick={saveGeneral} disabled={saving}>
                            {saving ? "Salvando..." : "Salvar alterações"}
                        </Button>
                    </div>
                </TabsContent>

                {/* --- Aba Compras --- */}
                <TabsContent value="shopping">
                    <div className="flex flex-col md:flex-row gap-3 items-end">
                        <div className="grid gap-2 flex-1">
                            <Label>Ingrediente</Label>
                            <Input value={ingName} onChange={e=>setIngName(e.target.value)} placeholder="Cordeiro" />
                        </div>
                        <div className="grid gap-2 w-40">
                            <Label>Quantidade</Label>
                            <Input value={ingQty} onChange={e=>setIngQty(e.target.value)} placeholder="1,5 kg" />
                        </div>
                        <div className="grid gap-2 w-60">
                            <Label>Observação</Label>
                            <Input value={ingNote} onChange={e=>setIngNote(e.target.value)} placeholder="usar fresco" />
                        </div>
                        <Button onClick={addItem}>Adicionar</Button>
                    </div>

                    <ul className="mt-4 divide-y rounded-lg border">
                        {items.length === 0 ? (
                            <li className="p-4 text-sm text-muted-foreground">Nenhum item ainda.</li>
                        ) : items.map(item => (
                            <li key={item.id} className="p-3 flex items-center gap-3">
                                <Checkbox
                                    checked={item.in_pantry}
                                    onCheckedChange={(v)=>togglePantry(item, Boolean(v))}
                                />
                                <div className="flex-1">
                                    <p className="font-medium">{item.ingredient_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.quantity || "—"} {item.note ? `· ${item.note}` : ""}
                                    </p>
                                </div>
                                <Button variant="destructive" size="sm" onClick={()=>removeItem(item)}>Remover</Button>
                            </li>
                        ))}
                    </ul>
                </TabsContent>

                {/* --- Aba Gravação --- */}
                <TabsContent value="recording">
                    {!rec ? (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">Nenhuma gravação ainda.</p>
                            <Button onClick={ensureRecording}>Criar gravação</Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Data da gravação</Label>
                                <Input
                                    type="date"
                                    value={rec.shoot_date ?? ""}
                                    onChange={(e)=>saveRecording({ shoot_date: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Input
                                    list="shootStatusOptions"
                                    value={rec.shoot_status}
                                    onChange={(e)=>saveRecording({ shoot_status: e.target.value })}
                                />
                                <datalist id="shootStatusOptions">
                                    {shootStatusOptions.map(s=> <option key={s} value={s} />)}
                                </datalist>
                            </div>

                            <div className="md:col-span-2 grid gap-3">
                                <Label>Checklist de equipamentos</Label>
                                <div className="flex gap-6">
                                    {["tripod","microphone","lights"].map(key => (
                                        <label key={key} className="flex items-center gap-2 text-sm capitalize">
                                            <Checkbox
                                                checked={Boolean(checklist[key as keyof typeof checklist])}
                                                onCheckedChange={(v)=>{
                                                    const next = { ...(rec.equipment_checklist ?? {}), [key]: Boolean(v) };
                                                    saveRecording({ equipment_checklist: next });
                                                }}
                                            />
                                            {key}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
