"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Pencil, Save } from "lucide-react";
import type { RecordingRow } from "@/types/db";
import { RECORDING_STATUSES, RECORDING_STATUS_LABELS, isRecordingStatus } from "@/constants/taxonomies";

export function RecipeRecordings({
                                     recipeId,
                                     items,
                                 }: {
    recipeId: string;
    items: RecordingRow[];
}) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // --- criar nova ---
    async function onCreate(formData: FormData) {
        startTransition(async () => {
            const { createRecordingAction } = await import("../../app/dashboard/recipes/actions");
            await createRecordingAction(formData);
            router.refresh();
        });
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Lista */}
            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle>Gravações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma gravação cadastrada ainda.</p>
                    ) : (
                        <ul className="space-y-2">
                            {items.map((r) => (
                                <RecordingItem key={r.id} row={r} />
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {/* Novo */}
            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle>Agendar / registrar</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={onCreate} className="space-y-3">
                        <input type="hidden" name="recipe_id" value={recipeId} />
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Data da gravação *</label>
                            <Input type="date" name="shoot_date" required />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Status</label>
                            <select name="shoot_status" defaultValue="planning" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                                {RECORDING_STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Notas de cena</label>
                            <Textarea name="scene_notes" placeholder="Cenas, ângulos, B-roll, observações..." />
                        </div>

                        <Button type="submit" disabled={isPending} className="rounded-xl cursor-pointer">
                            {isPending ? "Salvando..." : "Salvar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

function formatDateBR(isoDate: string | null): string {
    if (!isoDate) return "—";
    // garante consistência (e evita TZ shift) usando meia-noite local
    const dt = new Date(`${isoDate}T00:00:00`);
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("pt-BR");
}

function RecordingItem({ row }: { row: RecordingRow }) {
    const [edit, setEdit] = useState(false);
    const [_isPending, startTransition] = useTransition();
    const router = useRouter();

    async function onUpdate(formData: FormData) {
        startTransition(async () => {
            const { updateRecordingAction } = await import("../../app/dashboard/recipes/actions");
            await updateRecordingAction(formData);
            setEdit(false);
            router.refresh();
        });
    }

    async function onDelete() {
        if (!confirm("Excluir esta gravação?")) return;
        startTransition(async () => {
            const { deleteRecordingAction } = await import("../../app/dashboard/recipes/actions");
            const fd = new FormData();
            fd.set("id", row.id);
            await deleteRecordingAction(fd);
            router.refresh();
        });
    }

    const statusLabel = isRecordingStatus(row.shoot_status)
        ? RECORDING_STATUS_LABELS[row.shoot_status]
        : (row.shoot_status ?? "—");

    return (
        <li className="rounded-lg border p-3">
            {!edit ? (
                <div className="flex items-start justify-between gap-3">
                    <div className="text-sm">
                        <div className="font-medium">
                            {formatDateBR(row.shoot_date)} • {statusLabel}
                        </div>
                        {row.scene_notes ? (
                            <div
                                className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{row.scene_notes}</div>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className={"cursor-pointer"} onClick={() => setEdit(true)} title="Editar">
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className={"cursor-pointer"} onClick={onDelete} title="Excluir">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <form action={onUpdate} className="grid gap-2 md:grid-cols-4">
                    <input type="hidden" name="id" value={row.id} />
                    <Input
                        type="date"
                        name="shoot_date"
                        defaultValue={String(row.shoot_date)}
                        className="md:col-span-1"
                    />
                    <select
                        name="shoot_status"
                        defaultValue={row.shoot_status ?? ""}
                        className="h-9 w-full rounded-md border bg-background px-2 text-sm md:col-span-1 cursor-pointer"
                    >
                        <option value="">—</option>
                        {RECORDING_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                    <Textarea
                        name="scene_notes"
                        defaultValue={row.scene_notes ?? ""}
                        className="md:col-span-2"
                        rows={2}
                    />
                    <div className="md:col-span-4 flex justify-end gap-2 pt-1">
                        <Button type="button" variant="outline" onClick={() => setEdit(false)} className="rounded-xl cursor-pointer">
                            Cancelar
                        </Button>
                        <Button type="submit" className="rounded-xl cursor-pointer">
                            <Save className="mr-2 h-4 w-4" /> Salvar
                        </Button>
                    </div>
                </form>
            )}
        </li>
    );
}
