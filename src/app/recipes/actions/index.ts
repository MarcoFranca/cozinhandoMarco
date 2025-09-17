// src/app/recipes/actions/index.ts
"use server";

// recipes
export async function createRecipeAction(fd: FormData) {
    const m = await import("./recipes");
    return m.createRecipeAction(fd);
}
export async function duplicateRecipeAction(fd: FormData) {
    const m = await import("./recipes");
    return m.duplicateRecipeAction(fd);
}
export async function deleteRecipeAction(fd: FormData) {
    const m = await import("./recipes");
    return m.deleteRecipeAction(fd);
}
export async function updateRecipeMetaAction(fd: FormData) {
    const m = await import("./recipes");
    return m.updateRecipeMetaAction(fd);
}

// ingredients
export async function addIngredientFormAction(fd: FormData) {
    const m = await import("./ingredients");
    return m.addIngredientFormAction(fd);
}
export async function addIngredientQuickAction(fd: FormData) {
    const m = await import("./ingredients");
    return m.addIngredientQuickAction(fd);
}
export async function addIngredientsBulkAction(fd: FormData) {
    const m = await import("./ingredients");
    return m.addIngredientsBulkAction(fd);
}
export async function updateIngredientAction(fd: FormData) {
    const m = await import("./ingredients");
    return m.updateIngredientAction(fd);
}
export async function deleteIngredientAction(fd: FormData) {
    const m = await import("./ingredients");
    return m.deleteIngredientAction(fd);
}
export async function moveIngredientAction(fd: FormData) {
    const m = await import("./ingredients");
    return m.moveIngredientAction(fd);
}

// instructions
export async function addInstructionAction(fd: FormData) {
    const m = await import("./instructions");
    return m.addInstructionAction(fd);
}
export async function updateInstructionAction(fd: FormData) {
    const m = await import("./instructions");
    return m.updateInstructionAction(fd);
}
export async function deleteInstructionAction(fd: FormData) {
    const m = await import("./instructions");
    return m.deleteInstructionAction(fd);
}
export async function moveInstructionAction(fd: FormData) {
    const m = await import("./instructions");
    return m.moveInstructionAction(fd);
}

// recordings
export async function createRecordingAction(fd: FormData) {
    const m = await import("./recordings");
    return m.createRecordingAction(fd);
}
export async function updateRecordingAction(fd: FormData) {
    const m = await import("./recordings");
    return m.updateRecordingAction(fd);
}
export async function deleteRecordingAction(fd: FormData) {
    const m = await import("./recordings");
    return m.deleteRecordingAction(fd);
}

// shopping
export async function pushIngredientsToShoppingAction(fd: FormData) {
    const m = await import("./shopping");
    return m.pushIngredientsToShoppingAction(fd);
}
export async function toggleShoppingItemAction(fd: FormData) {
    const m = await import("./shopping");
    return m.toggleShoppingItemAction(fd);
}
export async function deleteShoppingItemAction(fd: FormData) {
    const m = await import("./shopping");
    return m.deleteShoppingItemAction(fd);
}
export async function clearCheckedShoppingAction() {
    const m = await import("./shopping");
    return m.clearCheckedShoppingAction();
}
export async function clearAllShoppingAction() {
    const m = await import("./shopping");
    return m.clearAllShoppingAction();
}

// legacy
export async function convertIngredientsFromTextAction(fd: FormData) {
    const m = await import("./legacy");
    return m.convertIngredientsFromTextAction(fd);
}
