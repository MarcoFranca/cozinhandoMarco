import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Server Actions: leitura+escrita de cookies (mantém sessão) */
export async function createSupabaseServerActionClient() {
    const cookieStore = await cookies();
    return createServerClient(
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
}
