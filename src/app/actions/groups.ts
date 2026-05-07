"use server";

import { db } from "@/lib/firebase";
import { collection, doc, getDoc, updateDoc, setDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createGroupAction(data: { name: string; description: string }) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const newRef = doc(collection(db, "contact_groups"));
        await setDoc(newRef, {
            name: data.name,
            description: data.description,
            contactIds: [],
            createdAt: new Date().toISOString()
        });

        revalidatePath("/dashboard/groups");
        revalidatePath("/dashboard/bulk");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getGroupsAction() {
    const session = await auth();
    if (!session?.user) return { success: false as const, error: "Unauthorized", groups: [] };

    try {
        const snap = await getDocs(collection(db, "contact_groups"));
        const groups = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        groups.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        return { success: true as const, groups };
    } catch (error: any) {
        return { success: false as const, error: error.message, groups: [] };
    }
}

export async function deleteGroupAction(groupId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        // We only delete the group container, NOT the actual contacts.
        await deleteDoc(doc(db, "contact_groups", groupId));
        revalidatePath("/dashboard/groups");
        revalidatePath("/dashboard/bulk");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function removeContactFromGroupAction(groupId: string, contactId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const groupRef = doc(db, "contact_groups", groupId);
        const groupSnap = await getDoc(groupRef);
        if (!groupSnap.exists()) throw new Error("Group not found");

        const groupData = groupSnap.data();
        const currentContactIds = groupData.contactIds || [];
        const newContactIds = currentContactIds.filter((id: string) => id !== contactId);

        await updateDoc(groupRef, { contactIds: newContactIds });
        revalidatePath("/dashboard/groups");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function uploadGroupContactsAction(groupId: string, recipients: { phone: string; name: string }[]) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const groupRef = doc(db, "contact_groups", groupId);
        const groupSnap = await getDoc(groupRef);
        if (!groupSnap.exists()) throw new Error("Group not found");

        const groupData = groupSnap.data();
        const currentContactIds = new Set<string>(groupData.contactIds || []);
        
        let newAdded = 0;

        for (const recipient of recipients) {
            let actualContactId = "";
            let contactName = recipient.name;

            // Check if contact exists
            const q = query(collection(db, "contacts"), where("phone", "==", recipient.phone));
            const existingSnap = await getDocs(q);

            if (!existingSnap.empty) {
                const contactDoc = existingSnap.docs[0];
                actualContactId = contactDoc.id;
            } else {
                // Auto-create missing contact
                const newRef = doc(collection(db, "contacts"));
                await setDoc(newRef, {
                    name: contactName || recipient.phone,
                    phone: recipient.phone,
                    lastMessage: "No messages yet",
                    createdAt: new Date().toISOString()
                });
                actualContactId = newRef.id;
            }

            if (!currentContactIds.has(actualContactId)) {
                currentContactIds.add(actualContactId);
                newAdded++;
            }
        }

        if (newAdded > 0) {
            await updateDoc(groupRef, { contactIds: Array.from(currentContactIds) });
        }

        revalidatePath("/dashboard/groups");
        revalidatePath("/dashboard/contacts");
        return { success: true, addedCount: newAdded };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
