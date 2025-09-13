import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = ["/recipes", "/shopping", "/calendar"];

export async function middleware(req: NextRequest) {
    const res = NextResponse.next({ request: { headers: new Headers(req.headers) } });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return req.cookies.getAll(); },
                setAll(cookiesToSet) { cookiesToSet.forEach(c => res.cookies.set(c.name, c.value, c.options)); },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    const pathname = req.nextUrl.pathname;
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    const isLogin = pathname === "/login";

    if (isProtected && !session) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname + req.nextUrl.search);
        return NextResponse.redirect(url);
    }

    if (isLogin && session) {
        const next = req.nextUrl.searchParams.get("next") ?? "/recipes";
        const url = req.nextUrl.clone();
        url.pathname = next;
        url.search = "";
        return NextResponse.redirect(url);
    }

    return res;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico|css|js)).*)"],
};
