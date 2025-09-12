import { redirect } from "next/navigation";
import { LoginCard } from "@/components/auth/LoginCard";
import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";

type PageProps = {
    searchParams?: { next?: string };
};

export default async function LoginPage({ searchParams }: PageProps) {
    const next = searchParams?.next || "/";
    const supabase = await createSupabaseRSCClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        redirect(next); // já logado -> vai pro destino
    }

    return (
        <div className="min-h-[calc(100dvh-120px)] grid place-items-center px-4">
            <div className="w-full max-w-sm">
                <LoginCard next={next} />
            </div>
        </div>
    );
}
