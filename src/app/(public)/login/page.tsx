import { redirect } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";
import { LoginCard } from "@/components/auth/LoginCard";

type PageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const raw = sp?.next;
    const next = Array.isArray(raw) ? raw[0] ?? "/" : raw ?? "/";

    const supabase = await createSupabaseRSCClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) redirect(next);

    return <LoginCard nextPath={next} />;
}
