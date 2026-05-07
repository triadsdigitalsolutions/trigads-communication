import { auth } from "@/auth";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { redirect } from "next/navigation";
import GroupsClient from "./GroupsClient";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    let groups: any[] = [];
    let contacts: any[] = [];

    try {
        const [gSnap, cSnap] = await Promise.all([
            getDocs(collection(db, "contact_groups")),
            getDocs(collection(db, "contacts"))
        ]);
        
        groups = gSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        groups.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        contacts = cSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    } catch (error) {
        console.warn("Could not fetch groups/contacts:", error);
    }

    return <GroupsClient initialGroups={groups} contacts={contacts} />;
}
