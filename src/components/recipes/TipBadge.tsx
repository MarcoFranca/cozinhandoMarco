// TipBadge.tsx
import React from "react";
import type { TipType } from "@/constants/taxonomies/tips";
import { TIP_TYPE_LABELS, TIP_TYPE_ICONS } from "@/constants/taxonomies/tips";

type Props = {
    type: TipType;
    text: string;
};

export default function TipBadge({ type, text }: Props) {
    const icon = TIP_TYPE_ICONS[type];
    const label = TIP_TYPE_LABELS[type];

    return (
        <div
            className="inline-flex items-start gap-2 rounded-xl border bg-muted px-3 py-2 text-sm"
            aria-label={`${label}: ${text}`}
        >
            <span aria-hidden className="mt-0.5">{icon}</span>
            <div>
                <span className="font-medium">{label}</span>
                <span className="mx-1">—</span>
                <span className="text-muted-foreground">{text}</span>
            </div>
        </div>
    );
}
