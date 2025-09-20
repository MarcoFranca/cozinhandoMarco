// src/constants/site.ts
export type SiteOverrideValue = "auto" | "forcar_exibir" | "forcar_ocultar";

export const SITE_OVERRIDES = [
    { value: "auto",           label: "Automático (publica ao marcar Postado)" },
    { value: "forcar_exibir",  label: "Forçar exibir (mesmo sem Postado)" },
    { value: "forcar_ocultar", label: "Forçar ocultar (mesmo Postado)" },
] as const;

export type SiteOverride = (typeof SITE_OVERRIDES)[number];

export const SITE_OVERRIDE_LABELS: Record<SiteOverrideValue, string> =
    Object.fromEntries(SITE_OVERRIDES.map(o => [o.value, o.label])) as Record<
        SiteOverrideValue, string
    >;

export function isSiteOverride(v: unknown): v is SiteOverrideValue {
    return SITE_OVERRIDES.some(o => o.value === v);
}
