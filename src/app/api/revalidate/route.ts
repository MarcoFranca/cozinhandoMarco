import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get("secret");
    if (secret !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json({ ok: false }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const paths: string[] = body.paths ?? [];

    try {
        for (const p of paths) {
            // Next 15 expõe revalidatePath em RSC
            // @ts-ignore
            await (global as any).revalidatePath?.(p);
        }
        return NextResponse.json({ ok: true, paths });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
}
