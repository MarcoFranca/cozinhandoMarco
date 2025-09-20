// src/constants/recordings.ts
export const RECORDING_STATUSES = [
    { value: "planning",     label: "Planejamento" },
    { value: "checklist_ok", label: "Checklist OK" },
    { value: "ready",        label: "Pronta p/ gravar" },
    { value: "shot",         label: "Gravada" },
    { value: "discarded",    label: "Descartada" },
] as const;

export type RecordingStatus = (typeof RECORDING_STATUSES)[number]["value"];

export const RECORDING_STATUS_LABELS: Record<RecordingStatus, string> =
    Object.fromEntries(RECORDING_STATUSES.map(s => [s.value, s.label])) as Record<
        RecordingStatus, string
    >;

export function isRecordingStatus(v: unknown): v is RecordingStatus {
    return RECORDING_STATUSES.some(s => s.value === v);
}
