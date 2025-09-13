import Link from "next/link";
import { signOutAction } from "@/app/actions-auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
                <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
                    <nav className="flex gap-4 text-sm">
                        <Link href="/recipes">Receitas</Link>
                        <Link href="/calendar">Calendário</Link>
                        <Link href="/shopping">Compras</Link>
                    </nav>
                    <form action={signOutAction}>
                        <button className="text-sm underline underline-offset-4">Sair</button>
                    </form>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </>
    );
}
