"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackLink({ fallback = "/" }: { fallback?: string }) {
    const router = useRouter();

    return (
        <button
            onClick={() => {
                if (window.history.length > 1) router.back();
                else router.push(fallback);
            }}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-muted/60"
        >
            <ArrowLeft className="h-4 w-4" />
            Voltar
        </button>
    );
}
