"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let active = true;

        (async () => {
            const { data } = await supabase.auth.getSession();
            if (!active) return;

            if (!data.session) {
                router.replace(`/login?next=${encodeURIComponent(pathname)}`);
            } else {
                setChecking(false);
            }
        })();

        const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
            if (!session) router.replace("/login");
        });

        return () => {
            active = false;
            sub.subscription.unsubscribe();
        };
    }, [router, pathname]);

    if (checking) return <div className="p-8 text-center">Carregando…</div>;
    return <>{children}</>;
}
