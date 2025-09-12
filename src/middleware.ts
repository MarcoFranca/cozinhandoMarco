// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
    // Clona os headers para manter o request imutável
    const res = NextResponse.next({
        request: { headers: new Headers(req.headers) },
    });

    // Cria o client com adaptadores de cookies (ler e escrever)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        res.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // Chamar isso garante que os cookies de auth sejam atualizados quando necessário
    await supabase.auth.getSession();

    return res;
}

// Ignore assets; ajuste conforme seu projeto
export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
