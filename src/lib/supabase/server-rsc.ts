import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** RSC: leitura de sessão via cookies (não escreve) */
export async function createSupabaseRSCClient() {
    const cookieStore = await cookies(); // Next 15: async
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                // RSC não pode escrever cookies
                setAll() {
                    /* no-op */
                },
            },
        }
    );
}
