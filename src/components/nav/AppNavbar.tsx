"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { APP_ROUTES, isActive } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";

export function AppNavbar() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
                {/* Left: brand + links */}
                <nav className="flex items-center gap-1">
                    {APP_ROUTES.map((r) => (
                        <Link
                            key={r.path}
                            href={r.path}
                            className={`rounded-xl px-3 py-1.5 text-sm transition-colors inline-flex items-center gap-2
                ${isActive(pathname, r.path) ? "bg-muted font-medium" : "hover:bg-muted/60"}`}
                        >
                            <r.icon className="h-4 w-4" />
                            {r.label}
                        </Link>
                    ))}
                </nav>

                {/* Right: ações rápidas */}
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => router.push("/recipes?new=1")}
                        className="rounded-2xl"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nova Receita
                    </Button>

                    {/* Logout via server action */}
                    <form
                        action={async () => {
                            const { signOutAction } = await import("@/app/actions-auth");
                            await signOutAction();
                        }}
                    >
                        <Button type="submit" variant="ghost" className="rounded-2xl" title="Sair">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </header>
    );
}
