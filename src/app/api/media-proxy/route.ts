import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Proxy route to serve WhatsApp media (images, documents, etc.)
 * WhatsApp media URLs require a Bearer token, so we proxy them server-side.
 * Usage: /api/media-proxy?mediaId=<whatsapp_media_id>
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get("mediaId");

    if (!mediaId) {
        return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
    }

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";

    if (!accessToken) {
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    try {
        // Step 1: Get the temporary download URL from Meta
        const metaRes = await fetch(
            `https://graph.facebook.com/${apiVersion}/${mediaId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!metaRes.ok) {
            const err = await metaRes.json();
            console.error("[media-proxy] Meta error:", err);
            return NextResponse.json({ error: "Failed to get media URL" }, { status: 502 });
        }

        const { url: downloadUrl, mime_type: mimeType } = await metaRes.json();

        // Step 2: Fetch the actual media content
        const mediaRes = await fetch(downloadUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!mediaRes.ok) {
            return NextResponse.json({ error: "Failed to download media" }, { status: 502 });
        }

        const buffer = await mediaRes.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": mimeType || "application/octet-stream",
                "Cache-Control": "private, max-age=3600",
            },
        });
    } catch (error: any) {
        console.error("[media-proxy] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
