"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";

type Event = {
    id: string;
    date: string;            // "YYYY-MM-DD"
    recipe_id: string;
    recipe_name: string;
    status: string | null;   // ex.: "planning"
    status_label: string;    // ex.: "Planejamento"
};

export function CalendarMonth({
                                  year,
                                  month, // 1..12
                                  events,
                              }: {
    year: number;
    month: number;
    events: Event[];
}) {
    const router = useRouter();
    const params = useSearchParams();

    const ym = `${year}-${pad2(month)}`;
    const first = new Date(`${ym}-01T00:00:00`);
    const startDow = first.getDay(); // 0..6 (Domingo..Sábado)
    const daysInMonth = new Date(year, month, 0).getDate();

    // mapa por dia -> eventos
    const byDay = new Map<number, Event[]>();
    for (const ev of events) {
        const d = Number(ev.date.slice(8, 10));
        if (!byDay.has(d)) byDay.set(d, []);
        byDay.get(d)!.push(ev);
    }

    const prevYM = stepYM(year, month, -1);
    const nextYM = stepYM(year, month, 1);

    function goto(ym: string) {
        const usp = new URLSearchParams(Array.from(params.entries()));
        usp.set("m", ym);
        router.replace(`/calendar?${usp.toString()}`, { scroll: false });
    }

    const cells: { dayNumber: number | null }[] = [];
    // cells vazias antes do dia 1
    for (let i = 0; i < startDow; i++) cells.push({ dayNumber: null });
    // dias do mês
    for (let d = 1; d <= daysInMonth; d++) cells.push({ dayNumber: d });
    // completar grid em múltiplos de 7
    while (cells.length % 7 !== 0) cells.push({ dayNumber: null });

    const monthTitle = first.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    return (
        <div className="rounded-2xl border">
            {/* header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <button
                    onClick={() => goto(prevYM)}
                    className="rounded-xl border px-2 py-1 hover:bg-muted"
                    title="Mês anterior"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-sm font-medium capitalize">
                    {monthTitle}
                </div>
                <button
                    onClick={() => goto(nextYM)}
                    className="rounded-xl border px-2 py-1 hover:bg-muted"
                    title="Próximo mês"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {/* legenda dos dias da semana */}
            <div className="grid grid-cols-7 border-b text-xs text-muted-foreground">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                    <div key={d} className="px-2 py-2 text-center">{d}</div>
                ))}
            </div>

            {/* grid do mês */}
            <div className="grid grid-cols-7 gap-px bg-border">
                {cells.map((c, idx) => {
                    const day = c.dayNumber;
                    const evs = (day ? byDay.get(day) ?? [] : []) as Event[];

                    return (
                        <div key={idx} className="min-h-[104px] bg-background">
                            <div className="flex items-center justify-between px-2 py-1">
                                <span className="text-xs font-medium opacity-80">{day ?? ""}</span>
                                {evs.length > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]">
                    <Film className="h-3 w-3" /> {evs.length}
                  </span>
                                )}
                            </div>

                            {/* eventos do dia */}
                            <div className="space-y-1 px-2 pb-2">
                                {evs.slice(0, 3).map((ev) => (
                                    <Link
                                        key={ev.id}
                                        href={`/recipes/${ev.recipe_id}?tab=recording`}
                                        className="block truncate rounded-md border px-2 py-1 text-xs hover:bg-muted"
                                        title={`${ev.recipe_name} • ${ev.status_label}`}
                                    >
                                        <span className="font-medium">{ev.recipe_name}</span>
                                        <span className="ml-1 opacity-70">• {ev.status_label}</span>
                                    </Link>
                                ))}
                                {evs.length > 3 && (
                                    <div className="text-[11px] text-muted-foreground">
                                        +{evs.length - 3} outros
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// utils
function pad2(n: number) { return String(n).padStart(2, "0"); }
function stepYM(year: number, month1to12: number, delta: number) {
    // converte para 0..11, soma delta, volta para 1..12
    const base = new Date(year, month1to12 - 1 + delta, 1);
    const y = base.getFullYear();
    const m = base.getMonth() + 1;
    return `${y}-${pad2(m)}`;
}
