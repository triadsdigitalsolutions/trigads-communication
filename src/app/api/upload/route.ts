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

        const mimeType = file.type || "application/octet-stream";
        const filename = file.name;
        const mediaType = getMediaType(mimeType);

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
