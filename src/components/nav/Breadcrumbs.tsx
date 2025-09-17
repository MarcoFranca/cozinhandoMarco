"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Se quiser controlar os rótulos, passe `items`.
 * Ex.: items={[{href:'/recipes',label:'Receitas'},{href:`/recipes/${id}`,label:recipeName}]}
 */
export function Breadcrumbs(
    { items }: { items?: { href: string; label: string }[] }
) {
    const pathname = usePathname();

    const auto =
        items ??
        pathname
            .split("?")[0]
            .split("/")
            .filter(Boolean)
            .reduce<{ href: string; label: string }[]>((acc, seg, idx, arr) => {
                const href = "/" + arr.slice(0, idx + 1).join("/");
                const label = isUUID(seg) ? "Detalhe" : capitalize(seg);
                acc.push({ href, label });
                return acc;
            }, [{ href: "/", label: "Home" }]);

    return (
        <nav className="text-sm text-muted-foreground">
            {auto.map((it, i) => (
                <span key={it.href}>
          {i > 0 && <span className="mx-2 opacity-60">/</span>}
                    {i === auto.length - 1 ? (
                        <span className="text-foreground">{it.label}</span>
                    ) : (
                        <Link href={it.href} className="hover:underline">{it.label}</Link>
                    )}
        </span>
            ))}
        </nav>
    );
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function isUUID(s: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}
