import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Use em Server Actions e Route Handlers. LÊ e ESCREVE cookies. */
export async function createSupabaseServerActionClient() {
    const cookieStore = await cookies(); // Next 15: cookies() é async

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    // copia todos os cookies que o Supabase quer setar
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                },
            },
        }
    );
}
