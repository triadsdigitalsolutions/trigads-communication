"use server";

import { db } from "@/lib/firebase";
import { collection, doc, updateDoc, setDoc, getDocs, query } from "firebase/firestore";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createFlowAction(name: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const newFlowRef = doc(collection(db, "flows"));
        const flow = {
            name,
            definition: { nodes: [], edges: [] },
            trigger: "ON_MESSAGE",
            isActive: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await setDoc(newFlowRef, flow);

        revalidatePath("/dashboard/flows");
        return { success: true, flow: { id: newFlowRef.id, ...flow } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getFlowsAction() {
    const session = await auth();
    if (!session?.user) return [];

    try {
        const q = query(collection(db, "flows"));
        const snap = await getDocs(q);
        const flows = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        return flows.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
        console.error("Failed to fetch flows:", error);
        return [];
    }
}

export async function toggleFlowAction(id: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await updateDoc(doc(db, "flows", id), { isActive, updatedAt: new Date().toISOString() });
        revalidatePath("/dashboard/flows");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateFlowDefinitionAction(id: string, definition: any, trigger?: any, keyword?: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const data: any = { definition, updatedAt: new Date().toISOString() };
        if (trigger) data.trigger = trigger;
        if (keyword !== undefined) data.keyword = keyword;

        await updateDoc(doc(db, "flows", id), data);
        revalidatePath("/dashboard/flows");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
