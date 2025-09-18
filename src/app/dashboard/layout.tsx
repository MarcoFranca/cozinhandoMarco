import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppNavbar } from "@/components/nav/AppNavbar";
import { BottomTabBar } from "@/components/nav/BottomTabBar";
import {Toaster} from "sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Cozinhando com Marco",
    description: "Painel do canal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
            <div className="min-h-screen">
                <AppNavbar/>
                <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24">
                    {children}
                </main>
                <BottomTabBar/>
            </div>
            <Toaster />
        </ThemeProvider>
        </body>
        </html>
    );
}
