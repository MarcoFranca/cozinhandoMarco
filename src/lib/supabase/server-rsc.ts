import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Use em Server Components (páginas/layouts). Só LÊ cookies. */
export async function createSupabaseRSCClient() {
    const cookieStore = await cookies(); // Next 15: cookies() é async

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // novo contrato do @supabase/ssr
                getAll() {
                    return cookieStore.getAll();
                },
                // RSC não pode escrever cookies; manter no-op
                setAll() {
                    /* no-op em RSC */
                },
            },
        }
    );
}
