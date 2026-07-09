import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { uploadMedia, sendMedia } from "@/lib/whatsapp";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

function getMediaType(mimeType: string): "image" | "document" | "audio" | "video" {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.startsWith("video/")) return "video";
    return "document";
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const contactId = formData.get("contactId") as string | null;
        const caption = (formData.get("caption") as string | null) || undefined;

        if (!file || !contactId) {
            return NextResponse.json({ error: "file and contactId are required" }, { status: 400 });
        }

        const MAX_SIZE = 16 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "File too large. Maximum size is 16MB." }, { status: 413 });
        }

        const contactSnap = await getDoc(doc(db, "contacts", contactId));
        if (!contactSnap.exists()) {
            return NextResponse.json({ error: "Contact not found" }, { status: 404 });
        }
        const contact = { id: contactSnap.id, ...contactSnap.data() } as any;

        /** Normalize MIME type — browsers sometimes report image/jpg which WhatsApp rejects */
        function normalizeMimeType(rawType: string, filename: string): string {
            // Non-standard alias: image/jpg → image/jpeg
            if (rawType === "image/jpg") return "image/jpeg";
            // If browser gave no type, infer from file extension
            if (!rawType || rawType === "application/octet-stream") {
                const ext = filename.split(".").pop()?.toLowerCase();
                const extMap: Record<string, string> = {
                    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
                    gif: "image/gif", webp: "image/webp",
                    mp4: "video/mp4", mov: "video/quicktime",
                    mp3: "audio/mpeg", ogg: "audio/ogg", m4a: "audio/mp4",
                    pdf: "application/pdf",
                };
                return ext && extMap[ext] ? extMap[ext] : "application/octet-stream";
            }
            return rawType;
        }

        const mimeType = normalizeMimeType(file.type, file.name);
        const filename = file.name;
        const mediaType = getMediaType(mimeType);

        // WhatsApp enforces per-type size limits (smaller than 16MB general limit)
        const WA_SIZE_LIMITS: Record<string, number> = {
            image: 5 * 1024 * 1024,    // 5 MB
            video: 16 * 1024 * 1024,   // 16 MB
            audio: 16 * 1024 * 1024,   // 16 MB
            document: 100 * 1024 * 1024, // 100 MB
        };
        const sizeLimit = WA_SIZE_LIMITS[mediaType] ?? MAX_SIZE;
        if (file.size > sizeLimit) {
            return NextResponse.json(
                { error: `File too large for ${mediaType}. WhatsApp limit is ${sizeLimit / 1024 / 1024}MB.` },
                { status: 413 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { id: mediaId } = await uploadMedia(buffer, mimeType, filename);

        const messageRef = doc(collection(db, "messages"));
        await setDoc(messageRef, {
            contactId: contact.id,
            senderId: (session.user as any).id,
            direction: "OUTGOING",
            type: mediaType,
            content: {
                body: caption || filename,
                mediaId,
                mimeType,
                mediaType,
            },
            status: "SENT",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        try {
            const response = await sendMedia(contact.phone, mediaId, mediaType, filename, caption);
            const metaMessageId = response.messages?.[0]?.id;

            await updateDoc(messageRef, {
                status: "SENT",
                metaMessageId: metaMessageId,
            });

            return NextResponse.json({ success: true });
        } catch (apiError: any) {
            console.error("[WhatsApp] Media send failed:", apiError);

            await updateDoc(messageRef, {
                status: "FAILED",
                content: {
                    body: caption || filename,
                    mediaId,
                    mimeType,
                    mediaType,
                    error: apiError.message,
                },
            });

            return NextResponse.json({ error: apiError.message }, { status: 500 });
        }
    } catch (error: any) {
        console.error("[Upload] Critical failure:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
