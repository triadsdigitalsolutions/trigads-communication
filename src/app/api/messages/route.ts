import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");

    if (!contactId) {
        return NextResponse.json({ error: "contactId is required" }, { status: 400 });
    }

    try {
        const q = query(collection(db, "messages"), where("contactId", "==", contactId));
        const snap = await getDocs(q);
        const messages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

        messages.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        // resolve senders
        for (const msg of messages) {
           if (msg.senderId) {
               const sSnap = await getDoc(doc(db, "users", msg.senderId));
               if (sSnap.exists()) {
                   msg.sender = { name: sSnap.data().name };
               }
           }
        }

        const formattedMessages = messages.map((msg: any) => ({
            id: msg.id,
            text: msg.content && typeof msg.content === 'object' && 'body' in msg.content ? msg.content.body : "Unknown content",
            error: msg.content && typeof msg.content === 'object' && 'error' in msg.content ? msg.content.error : null,
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            direction: msg.direction,
            status: msg.status,
            sender: msg.sender,
            mediaType: msg.content && typeof msg.content === 'object' ? msg.content.mediaType ?? null : null,
            mimeType: msg.content && typeof msg.content === 'object' ? msg.content.mimeType ?? null : null,
            mediaId: msg.content && typeof msg.content === 'object' ? msg.content.mediaId ?? null : null,
        }));

        return NextResponse.json(formattedMessages);
    } catch (error) {
        console.error("Database connection failed during request:", error);
        return NextResponse.json([]);
    }
}
