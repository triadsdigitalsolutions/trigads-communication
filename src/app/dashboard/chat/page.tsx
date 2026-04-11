import ChatClient from "@/app/dashboard/chat/ChatClient";
import { auth } from "@/auth";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const currentUser = {
        id: (session.user as any).id,
        name: session.user.name || "Unknown",
        role: (session.user as any).role,
    };

    let formattedContacts: any[] = [];
    let allAgents: any[] = [];

    try {
        const contactsRef = collection(db, "contacts");
        const snap = await getDocs(contactsRef);
        let contacts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

        if (currentUser.role !== 'ADMIN') {
             contacts = contacts.filter(c => c.assignedToId === currentUser.id || !c.assignedToId);
        }

        const messagesSnap = await getDocs(collection(db, "messages"));
        const allMessages = messagesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

        const usersSnap = await getDocs(collection(db, "users"));
        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        const usersMap: Record<string, any> = {};
        for (const u of users) usersMap[u.id] = { name: u.name };

        formattedContacts = contacts.map((contact: any) => {
            const contactMsgs = allMessages.filter(m => m.contactId === contact.id);
            contactMsgs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // desc

            const lastMsg = contactMsgs[0];

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
                updatedAt: contact.updatedAt || contact.createdAt || new Date(0).toISOString()
            };
        });

        formattedContacts.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        if (currentUser.role === 'ADMIN') {
            allAgents = users.filter(u => ['AGENT', 'SALES'].includes(u.role)).map(u => ({ id: u.id, name: u.name, role: u.role }));
        }

    } catch (error) {
        console.warn("Could not fetch data for chat page:", error);
    }

    return (
        <ChatClient
            initialContacts={formattedContacts}
            currentUser={currentUser}
            allAgents={allAgents}
        />
    );
}
