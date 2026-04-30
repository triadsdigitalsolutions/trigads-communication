import { auth } from "@/auth";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { redirect } from "next/navigation";
import SchedulerClient from "./SchedulerClient";

export const dynamic = "force-dynamic";

export default async function SchedulerPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    let schedules: any[] = [];
    let contacts: any[] = [];
    let templates: any[] = [];

    try {
        const [schedSnap, contactsSnap, tSnap] = await Promise.all([
            getDocs(collection(db, "scheduled_messages")),
            getDocs(collection(db, "contacts")),
            getDocs(query(collection(db, "templates"), where("status", "==", "APPROVED"))),
        ]);

        schedules = schedSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as any[];

        contacts = contactsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "")) as any[];

        templates = tSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    } catch (e) {
        console.warn("Scheduler page fetch error:", e);
    }

    return <SchedulerClient schedules={schedules} contacts={contacts} templates={templates} />;
}
