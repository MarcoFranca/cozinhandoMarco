// src/constants/taxonomies/index.ts
export * from "./categories";
export * from "./difficulties";
export * from "./statuses";
export * from "./tips";
export * from "./cuisines";
export * from "./diet";
export * from "./techniques";
export * from "./occasions";

// helpers modernos + aliases antigos (se já adicionou)
export {
    labelForCategory,
    labelForDifficulty,
    labelForStatus,
    labelForTipType,
    iconForTipType,
} from "@/lib/taxonomies/labels";

export * from "../recordings";   // <- reexporta isRecordingStatus e RecordingStatus
export * from "../site";
