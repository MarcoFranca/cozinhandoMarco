import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <RequireAuth>
            <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
                <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
                    <nav className="flex gap-4 text-sm">
                        <Link href="/recipes">Receitas</Link>
                        <Link href="/calendar">Calendário</Link>
                        <Link href="/shopping">Compras</Link>
                    </nav>
                    <form
                        action={async () => {
                            "use server";
                            await supabase.auth.signOut(); // server-safe: sem sessão, só invalida cookies no edge sem efeito; logout real ocorre no client
                        }}
                    >
                        {/* fallback client no header simples */}
                    </form>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </RequireAuth>
    );
}
