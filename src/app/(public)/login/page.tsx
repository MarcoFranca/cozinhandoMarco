import { redirect } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";
import { LoginCard } from "@/components/auth/LoginCard";

// 👉 Em Next 15, searchParams é Promise e precisa de await
type PageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: PageProps) {
    const sp = await searchParams; // ✅ aguarda
    const raw = sp?.next;
    // garante string
    const next = Array.isArray(raw) ? raw[0] ?? "/" : raw ?? "/";

    const supabase = await createSupabaseRSCClient();
    const { data: { session } } = await supabase.auth.getSession();

    // já logado? manda direto pro destino correto
    // if (session) redirect(next);

    return <LoginCard next={next} />;
}
