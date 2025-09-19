// src/app/api/revalidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Garante Node.js runtime (revalidatePath não roda no Edge)
export const runtime = "nodejs";

type RevalidateBody = {
    paths?: string[];
};

export async function POST(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get("secret");
    if (secret !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json({ ok: false }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        body = {};
    }

    // Narrow de tipo seguro
    const { paths = [] } = (typeof body === "object" && body && "paths" in body
        ? (body as RevalidateBody)
        : {});

    try {
        for (const p of paths) {
            await revalidatePath(p);
        }
        return NextResponse.json({ ok: true, paths });
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            { status: 500 }
        );
    }
}
