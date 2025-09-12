"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginCard({ next = "/" }: { next?: string }) {
    const router = useRouter();
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const [mode, setMode] = useState<"signin" | "signup">("signin");
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password) return;

        try {
            setLoading(true);

            if (mode === "signin") {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;

                // cola a sessão no lado do servidor
                router.refresh();
                router.replace(next);
                return;
            }

            // signup
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                // Se confirmação por e-mail estiver ativa, você pode definir redirect:
                // options: { emailRedirectTo: `${window.location.origin}/login` }
            });
            if (error) throw error;

            // Se o projeto exigir confirmação de e-mail, data.session pode ser null.
            if (!data.session) {
                alert("Cadastro criado! Verifique seu e-mail para confirmar a conta.");
                router.replace("/login");
                return;
            }

            router.refresh();
            router.replace(next);
        } catch (err: any) {
            alert(err?.message ?? "Falha na autenticação");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-2xl border p-6 bg-card">
            <div className="mb-6">
                <h1 className="text-xl font-semibold">
                    {mode === "signin" ? "Entrar" : "Criar conta"}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {mode === "signin"
                        ? "Acesse sua conta para gerenciar receitas."
                        : "Crie sua conta para começar."}
                </p>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="space-y-1">
                    <label className="text-sm">E-mail</label>
                    <Input
                        type="email"
                        autoComplete="email"
                        placeholder="voce@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm">Senha</label>
                    <Input
                        type="password"
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                    />
                </div>

                <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                    {loading ? (mode === "signin" ? "Entrando..." : "Cadastrando...") : (mode === "signin" ? "Entrar" : "Cadastrar")}
                </Button>
            </form>

            <div className="mt-4 text-center text-sm">
                {mode === "signin" ? (
                    <>
                        Não tem conta?{" "}
                        <button
                            className="underline underline-offset-4 hover:opacity-80"
                            onClick={() => setMode("signup")}
                        >
                            Criar conta
                        </button>
                    </>
                ) : (
                    <>
                        Já tem conta?{" "}
                        <button
                            className="underline underline-offset-4 hover:opacity-80"
                            onClick={() => setMode("signin")}
                        >
                            Entrar
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
