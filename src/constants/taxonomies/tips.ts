export type TipType = "tip" | "swap" | "alert";

export const TIP_TYPE_LABELS: Record<TipType, string> = {
    tip: "Pulos do Gato",
    swap: "Substituições & Variações",
    alert: "Atenções & Segurança",
};

export const TIP_TYPE_ICONS: Record<TipType, string> = {
    tip: "💡",
    swap: "🔁",
    alert: "⚠️",
};

export const TIP_TYPES: { value: TipType; label: string; icon: string }[] =
    (Object.keys(TIP_TYPE_LABELS) as TipType[]).map((value) => ({
        value,
        label: TIP_TYPE_LABELS[value],
        icon: TIP_TYPE_ICONS[value],
    }));
