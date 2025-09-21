import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Cozinhando com Marco",
    description: "Painel do canal",
    icons: [
        { rel: "icon", url: "/icon.png" },                    // PNG no /public
        { rel: "apple-touch-icon", url: "/apple-icon.png" },     // 180x180
        // Temas (opcional):
        { rel: "icon", url: "/favicon-dark.png", media: "(prefers-color-scheme: dark)" },
        { rel: "icon", url: "/favicon-light.png", media: "(prefers-color-scheme: light)" },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
                    {children}
        </ThemeProvider>
        </body>
        </html>
    );
}
