import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json([]);

    const currentUser = {
        id: (session.user as any).id,
        role: (session.user as any).role,
    };

    try {
        const contactsRef = collection(db, "contacts");
        const snap = await getDocs(contactsRef);
        let contacts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

        if (currentUser.role !== 'ADMIN') {
            contacts = contacts.filter(c => c.assignedToId === currentUser.id || !c.assignedToId);
        }

        const messagesSnap = await getDocs(collection(db, "messages"));
        const allMessages = messagesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

        // resolve assignedTo names (users)
        const usersSnap = await getDocs(collection(db, "users"));
        const usersMap: Record<string, any> = {};
        for (const uDoc of usersSnap.docs) {
            usersMap[uDoc.id] = { name: uDoc.data().name };
        }

        const contactIds = contacts.map((c: any) => c.id);

        // find last incoming message logic and latest message logic
        const formattedContacts = contacts.map((contact: any) => {
            const contactMsgs = allMessages.filter(m => m.contactId === contact.id);
            contactMsgs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // desc

            const lastMsg = contactMsgs[0];
            const incomingMsgs = contactMsgs.filter(m => m.direction === 'INCOMING');
            const lastIncoming = incomingMsgs[0];

            return {
                id: contact.id,
                name: contact.name || "Unknown",
                phone: contact.phone,
                lastMessage: lastMsg?.content && typeof lastMsg.content === 'object' && 'body' in lastMsg.content
                    ? lastMsg.content.body
                    : "No messages yet",
                time: lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
                unread: 0,
                assignedToId: contact.assignedToId || null,
                assignedTo: contact.assignedToId && usersMap[contact.assignedToId] ? usersMap[contact.assignedToId] : null,
                lastIncomingAt: lastIncoming ? new Date(lastIncoming.createdAt).toISOString() : null,
                updatedAt: contact.updatedAt || contact.createdAt || new Date(0).toISOString()
            };
        });

        // sort by updatedAt desc
        formattedContacts.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return NextResponse.json(formattedContacts);
    } catch (error) {
        console.error("Database connection failed during request:", error);
        return NextResponse.json([]);
    }
}
