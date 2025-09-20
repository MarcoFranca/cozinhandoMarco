import { redirect } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";
import {createSupabaseServerActionClient} from "@/lib/supabase/server-actions";

// type guard para detectar "Auth session missing" sem usar any
function isAuthMissing(err: unknown): boolean {
    if (typeof err !== "object" || err === null) return false;
    const e = err as { name?: unknown; message?: unknown };
    const nameMatch = typeof e.name === "string" && e.name === "AuthSessionMissingError";
    const msgMatch =
        typeof e.message === "string" && e.message.includes("Auth session missing");
    return nameMatch || msgMatch;
}

export async function requireUser() {
    const supabase = await createSupabaseRSCClient();

    try {
        const { data, error } = await supabase.auth.getUser();

        // algumas versões retornam erro, outras apenas user=null
        if (isAuthMissing(error)) {
            redirect("/login");
        }
        if (error) throw error;

        const user = data.user;
        if (!user) {
            redirect("/login");
        }

        return { supabase, user };
    } catch (e: unknown) {
        // fail-safe
        if (isAuthMissing(e)) {
            redirect("/login");
        }
        throw e;
    }
}

export async function requireUserServerAction() {
    const supabase = await createSupabaseServerActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        // Em Server Actions não redirecionamos; lance um erro e trate no caller.
        throw new Error("Não autenticado.");
    }
    return { user };
}
