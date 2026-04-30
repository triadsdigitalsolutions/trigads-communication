import { auth } from "@/auth";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { redirect } from "next/navigation";
import BulkClient from "./BulkClient";

export const dynamic = "force-dynamic";

export default async function BulkPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    let contacts: any[] = [];
    let templates: any[] = [];

    try {
        // All contacts
        const contactsSnap = await getDocs(collection(db, "contacts"));
        contacts = contactsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "")) as any[];

        // Only approved templates
        const tQuery = query(collection(db, "templates"), where("status", "==", "APPROVED"));
        const templatesSnap = await getDocs(tQuery);
        templates = templatesSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "")) as any[];
    } catch (error) {
        console.warn("Could not fetch data for bulk page:", error);
    }

    return <BulkClient contacts={contacts} templates={templates} />;
}
