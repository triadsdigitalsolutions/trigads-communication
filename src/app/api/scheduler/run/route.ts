import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
    collection, query, where, getDocs,
    doc, getDoc, updateDoc, Timestamp
} from "firebase/firestore";
import { sendText, sendTemplate } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    // ── Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET>
    //         We also accept our own SCHEDULER_SECRET for manual testing
    const authHeader = req.headers.get("authorization");
    const secret = process.env.SCHEDULER_SECRET;
    const cronSecret = process.env.CRON_SECRET; // Vercel auto-injects this

    const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isManual     = secret    && authHeader === `Bearer ${secret}`;

    if (!isVercelCron && !isManual) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();
    const results: { id: string; status: string; error?: string }[] = [];

    try {
        // Fetch all PENDING scheduled messages where scheduledAt <= now
        const q = query(
            collection(db, "scheduled_messages"),
            where("status", "==", "PENDING")
        );
        const snap = await getDocs(q);

        const due = snap.docs.filter(d => {
            const scheduledAt = d.data().scheduledAt as string | null;
            return scheduledAt && scheduledAt <= now;
        });

        for (const docSnap of due) {
            const data = docSnap.data() as any;
            const ref  = doc(db, "scheduled_messages", docSnap.id);

            try {
                // Fetch contact phone
                const contactSnap = await getDoc(doc(db, "contacts", data.contactId));
                if (!contactSnap.exists()) throw new Error("Contact not found");
                const contact = contactSnap.data() as any;

                if (data.type === "text") {
                    await sendText(contact.phone, data.messageText);
                } else if (data.type === "template") {
                    // Fetch template language
                    const tSnap = await getDocs(
                        query(collection(db, "templates"), where("name", "==", data.templateName))
                    );
                    if (tSnap.empty) throw new Error("Template not found");
                    const tpl = tSnap.docs[0].data() as any;
                    await sendTemplate(contact.phone, data.templateName, tpl.language, data.templateParameters || []);
                }

                await updateDoc(ref, { status: "SENT", sentAt: new Date().toISOString() });
                results.push({ id: docSnap.id, status: "SENT" });

            } catch (err: any) {
                await updateDoc(ref, { status: "FAILED", errorMessage: err.message });
                results.push({ id: docSnap.id, status: "FAILED", error: err.message });
            }
        }

        return NextResponse.json({ processed: results.length, results });
    } catch (err: any) {
        console.error("[Scheduler] Fatal error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
