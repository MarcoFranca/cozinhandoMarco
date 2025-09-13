"use client";

import { useState } from "react";
import { signInAction } from "@/app/(public)/login/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginCard({ nextPath = "/" }: { nextPath?: string }) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    return (
        <div className="mx-auto w-full max-w-sm rounded-xl border p-6">
            <h1 className="mb-1 text-xl font-semibold">Entrar</h1>
            <p className="mb-4 text-sm text-muted-foreground">
                Use seu e-mail e senha para acessar.
            </p>

            <form action={signInAction} className="space-y-3" onSubmit={() => setLoading(true)}>
                <input type="hidden" name="next" value={nextPath} />

                <div className="space-y-1">
                    <label className="text-sm">E-mail</label>
                    <Input
                        name="email"
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
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                </Button>
            </form>

            <div className="mt-4 text-center text-xs text-muted-foreground">
                Dica: se precisar de cadastro, podemos habilitar depois.
            </div>
        </div>
    );
}
