"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export async function signInAction(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const next = String(formData.get("next") ?? "/recipes");

    // ✅ Next 15: cookies() é assíncrono
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    for (const { name, value, options } of cookiesToSet) {
                        cookieStore.set(name, value, options);
                    }
                },
            },
        }
    );

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    redirect(next);
}
