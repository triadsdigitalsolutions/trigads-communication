import { auth } from "@/auth";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { redirect } from "next/navigation";
import ContactsClient from "./ContactsClient";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    let contacts: any[] = [];

    try {
        const snap = await getDocs(collection(db, "contacts"));
        contacts = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        contacts.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (error) {
        console.warn("Could not fetch contacts:", error);
    }

    return <ContactsClient initialContacts={contacts} />;
}
