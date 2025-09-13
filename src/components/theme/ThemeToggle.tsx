"use client";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
// use só o setTheme
    const { setTheme } = useTheme();

    return (
        <div className="flex items-center gap-1 rounded-2xl border px-1 py-1">
            <button className="rounded-xl px-2 py-1 hover:opacity-80 cursor-pointer" onClick={() => setTheme("light")} title="Claro">
                <Sun className="h-4 w-4" />
            </button>
            <button className="rounded-xl px-2 py-1 hover:opacity-80 cursor-pointer" onClick={() => setTheme("dark")} title="Escuro">
                <Moon className="h-4 w-4" />
            </button>
            <button className="rounded-xl px-2 py-1 hover:opacity-80 cursor-pointer" onClick={() => setTheme("system")} title="Sistema">
                <Monitor className="h-4 w-4" />
            </button>
        </div>
    );
}
