// src/lib/youtube.ts
export function extractYouTubeId(url?: string | null): string | null {
    if (!url) return null;
    try {
        // Lida com links do tipo watch, youtu.be, shorts, etc.
        const u = new URL(url);
        const host = u.hostname.replace(/^www\./, "");

        // Ex: https://youtu.be/VIDEOID
        if (host === "youtu.be") {
            return u.pathname.split("/")[1] || null;
        }

        // Ex: https://youtube.com/shorts/VIDEOID
        if (host.includes("youtube.com") && u.pathname.startsWith("/shorts/")) {
            const parts = u.pathname.split("/");
            return parts[2] || null;
        }

        // Ex: https://www.youtube.com/watch?v=VIDEOID
        if (host.includes("youtube.com")) {
            const v = u.searchParams.get("v");
            if (v) return v;
            // Ex: /embed/VIDEOID
            if (u.pathname.startsWith("/embed/")) {
                const parts = u.pathname.split("/");
                return parts[2] || null;
            }
        }

        return null;
    } catch {
        return null;
    }
}

export function buildYouTubeEmbedUrl(videoId: string): string {
    // Usa domínio sem cookies + params de UX
    const params = new URLSearchParams({
        rel: "0",
        modestbranding: "1",
        playsinline: "1",
    });
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function buildYouTubeThumb(videoId: string): string {
    // hqdefault: boa qualidade e leve
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
