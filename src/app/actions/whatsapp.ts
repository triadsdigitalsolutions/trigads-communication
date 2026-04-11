"use server";

import { db } from "@/lib/firebase";
import { collection, doc, getDoc, updateDoc, setDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { sendText, sendTemplate, listTemplates, createTemplate } from "@/lib/whatsapp";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function sendMessageAction(contactId: string, text: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const contactRef = doc(db, "contacts", contactId);
        const contactSnap = await getDoc(contactRef);

        if (!contactSnap.exists()) throw new Error("Contact not found");

        const contact = { id: contactSnap.id, ...contactSnap.data() } as any;

        const messageRef = doc(collection(db, "messages"));
        await setDoc(messageRef, {
            contactId: contact.id,
            senderId: (session.user as any).id,
            direction: "OUTGOING",
            type: "text",
            content: { body: text },
            status: "SENT",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        revalidatePath("/dashboard/chat");

        try {
            console.log(`[WhatsApp] Attempting to send message to: ${contact.phone}`);
            const response = await sendText(contact.phone, text);
            console.log(`[WhatsApp] API Response for ${contact.phone}:`, JSON.stringify(response));
            const metaMessageId = response.messages?.[0]?.id;

            await updateDoc(messageRef, {
                status: "SENT",
                metaMessageId: metaMessageId
            });

            revalidatePath("/dashboard/chat");
            return { success: true };
        } catch (apiError: any) {
            console.error("WhatsApp API Failure:", apiError);

            await updateDoc(messageRef, {
                status: "FAILED",
                content: { body: text, error: apiError.message }
            });

            revalidatePath("/dashboard/chat");
            return { success: false, error: apiError.message };
        }
    } catch (error: any) {
        console.error("Critical Failure in sendMessageAction:", error);
        return { success: false, error: error.message || "Unknown error occurred" };
    }
}

export async function assignContactAction(contactId: string, agentId: string | null) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await updateDoc(doc(db, "contacts", contactId), {
            assignedToId: agentId
        });

        revalidatePath("/dashboard/chat");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateContactTagsAction(contactId: string, tags: string[]) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await updateDoc(doc(db, "contacts", contactId), {
            tags: tags
        });

        revalidatePath("/dashboard/chat");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function clearChatAction(contactId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const q = query(collection(db, "messages"), where("contactId", "==", contactId));
        const snaps = await getDocs(q);
        const deletePromises = snaps.docs.map(snap => deleteDoc(snap.ref));
        await Promise.all(deletePromises);

        await updateDoc(doc(db, "contacts", contactId), {
            lastMessage: "Chat history cleared"
        });

        revalidatePath("/dashboard/chat");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function syncTemplatesAction() {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const response = await listTemplates();
        const metaTemplates = response.data || [];

        for (const t of metaTemplates) {
            const tempsRef = collection(db, "templates");
            const q = query(tempsRef, where("name", "==", t.name));
            const existingSnap = await getDocs(q);

            if (!existingSnap.empty) {
                await updateDoc(existingSnap.docs[0].ref, {
                    status: t.status,
                    components: t.components,
                    category: t.category,
                    language: t.language,
                    updatedAt: new Date().toISOString()
                });
            } else {
                await setDoc(doc(tempsRef), {
                    name: t.name,
                    category: t.category,
                    language: t.language,
                    components: t.components,
                    status: t.status,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        }

        revalidatePath("/dashboard/templates");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createTemplateAction(data: {
    name: string;
    category: string;
    language: string;
    components: any[];
}) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const response = await createTemplate(data); 

        if (response.error) {
            throw new Error(response.error.message || "Failed to create template on Meta");
        }

        await setDoc(doc(collection(db, "templates")), {
            name: data.name,
            category: data.category,
            language: data.language,
            components: data.components,
            status: "PENDING",
            createdAt: new Date().toISOString()
        });

        revalidatePath("/dashboard/templates");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createContactAction(data: { name: string; phone: string }) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const cleanPhone = data.phone.replace(/\D/g, "");
        if (cleanPhone.length < 10) throw new Error("Invalid phone number format");

        const q = query(collection(db, "contacts"), where("phone", "==", cleanPhone));
        const existingSnap = await getDocs(q);

        if (!existingSnap.empty) {
            return { success: true, contact: { id: existingSnap.docs[0].id, ...existingSnap.docs[0].data() }, message: "Contact already exists" };
        }

        const newContactRef = doc(collection(db, "contacts"));
        const newContact = {
            name: data.name,
            phone: cleanPhone,
            lastMessage: "No messages yet",
            createdAt: new Date().toISOString()
        };

        await setDoc(newContactRef, newContact);

        revalidatePath("/dashboard/chat");
        return { success: true, contact: { id: newContactRef.id, ...newContact } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getTemplatesAction() {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const q = query(collection(db, "templates"), where("status", "==", "APPROVED"));
        const snaps = await getDocs(q);
        const templates = snaps.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Simple sort since firestore orderby might need index
        templates.sort((a, b) => (a as any).name.localeCompare((b as any).name));
        
        return { success: true, templates };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function sendTemplateMessageAction(contactId: string, templateName: string, parameters: string[] = []) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const contactSnap = await getDoc(doc(db, "contacts", contactId));
        if (!contactSnap.exists()) throw new Error("Contact not found");
        const contact = { id: contactSnap.id, ...contactSnap.data() } as any;

        const tQuery = query(collection(db, "templates"), where("name", "==", templateName));
        const tSnap = await getDocs(tQuery);
        if (tSnap.empty) throw new Error("Template not found");
        const template = { id: tSnap.docs[0].id, ...tSnap.docs[0].data() } as any;

        let bodyText = (template.components as any[]).find(c => c.type === 'BODY')?.text || "Template Message";

        parameters.forEach((val, idx) => {
            bodyText = bodyText.replace(`{{${idx + 1}}}`, val);
        });

        const messageRef = doc(collection(db, "messages"));
        await setDoc(messageRef, {
            contactId: contact.id,
            senderId: (session.user as any).id,
            direction: "OUTGOING",
            type: "template",
            content: { templateName, body: bodyText, parameters },
            status: "SENT",
            createdAt: new Date().toISOString()
        });

        revalidatePath("/dashboard/chat");

        try {
            console.log(`[WhatsApp] Attempting to send template to: ${contact.phone}`);
            const response = await sendTemplate(contact.phone, templateName, template.language, parameters);

            console.log(`[WhatsApp] API Response for template:`, JSON.stringify(response));
            const metaMessageId = response.messages?.[0]?.id;

            await updateDoc(messageRef, {
                status: "SENT",
                metaMessageId: metaMessageId
            });

            revalidatePath("/dashboard/chat");
            return { success: true };
        } catch (apiError: any) {
            console.error("WhatsApp Template API Failure:", apiError);

            await updateDoc(messageRef, {
                status: "FAILED",
                content: { templateName, body: bodyText, parameters, error: apiError.message }
            });

            revalidatePath("/dashboard/chat");
            return { success: false, error: apiError.message };
        }
    } catch (error: any) {
        console.error("Failed to send template message:", error);
        return { success: false, error: error.message || "Unknown error occurred" };
    }
}

export async function deleteTemplateAction(templateId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        await deleteDoc(doc(db, "templates", templateId));
        revalidatePath("/dashboard/templates");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete template:", error);
        return { success: false, error: error.message || "Unknown error occurred" };
    }
}
