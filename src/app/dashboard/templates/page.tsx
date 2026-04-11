import TemplatesClient from "@/app/dashboard/templates/TemplatesClient";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
    let formattedTemplates: any[] = [];
    try {
        const q = query(collection(db, "templates"));
        const snap = await getDocs(q);
        
        const templates = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[];

        // Sort by createdAt descending
        templates.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        formattedTemplates = templates.map((t: any) => ({
            id: t.id,
            name: t.name,
            language: t.language,
            category: t.category,
            status: t.status as "APPROVED" | "PENDING" | "REJECTED",
            components: t.components,
            preview: t.components && typeof t.components === 'object' && Array.isArray(t.components)
                ? (t.components.find((c: any) => c.type === 'BODY')?.text || "No preview available")
                : "No preview available",
        }));
    } catch (error) {
        console.warn("Could not fetch templates during build/request:", error);
    }

    return <TemplatesClient initialTemplates={formattedTemplates} />;
}
