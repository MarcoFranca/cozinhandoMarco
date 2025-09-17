import type { LucideIcon } from "lucide-react";
import { Home, UtensilsCrossed, Calendar, ShoppingCart } from "lucide-react";

export type AppRoute = { path: string; label: string; icon: LucideIcon };

export const APP_ROUTES: AppRoute[] = [
    { path: "/",        label: "Home",       icon: Home },
    { path: "/recipes", label: "Receitas",   icon: UtensilsCrossed },
    { path: "/calendar",label: "Calendário", icon: Calendar },
    { path: "/shopping",label: "Compras",    icon: ShoppingCart },
];

// ajuda a marcar ativo
export function isActive(pathname: string, routePath: string) {
    if (routePath === "/") return pathname === "/";
    return pathname === routePath || pathname.startsWith(routePath + "/");
}
