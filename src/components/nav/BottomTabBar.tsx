"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_ROUTES, isActive } from "@/constants/routes";

export function BottomTabBar() {
    const pathname = usePathname();

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
            <div className="mx-auto grid max-w-6xl grid-cols-4">
                {APP_ROUTES.map((r) => (
                    <Link
                        key={r.path}
                        href={r.path}
                        className={`flex flex-col items-center gap-1 py-2 text-xs
              ${isActive(pathname, r.path) ? "font-medium" : "text-muted-foreground"}`}
                    >
                        <r.icon className="h-5 w-5" />
                        {r.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
