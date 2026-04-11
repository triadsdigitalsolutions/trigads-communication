import { db } from "@/lib/firebase";
import { collection, doc, getDoc, updateDoc, setDoc, query, where, getDocs } from "firebase/firestore";
import { sendText, sendTemplate } from "@/lib/whatsapp";
import { revalidatePath } from "next/cache";

interface FlowDefinition {
    nodes: any[];
    edges: any[];
}

export async function processFlow(contactId: string, incomingText: string) {
    console.log(`[FlowEngine] Processing message from ${contactId}: "${incomingText}"`);

    const contactSnap = await getDoc(doc(db, "contacts", contactId));
    if (!contactSnap.exists()) return;
    const contact = { id: contactSnap.id, ...contactSnap.data() } as any;

    let flowId = contact.currentFlowId;
    let currentNodeId = contact.currentNodeId;

    if (!flowId) {
        let activeFlow: any = null;
        let flowIdToStart: string | null = null;

        const qON = query(collection(db, "flows"), where("isActive", "==", true), where("trigger", "==", "ON_MESSAGE"));
        const snapON = await getDocs(qON);
        
        if (!snapON.empty) {
            flowIdToStart = snapON.docs[0].id;
        } else {
            const qKW = query(collection(db, "flows"), where("isActive", "==", true), where("trigger", "==", "KEYWORD"));
            const snapKW = await getDocs(qKW);
            
            for (const f of snapKW.docs) {
                const keyword = f.data().keyword;
                if (keyword && incomingText.toLowerCase().includes(keyword.toLowerCase())) {
                    flowIdToStart = f.id;
                    break;
                }
            }
        }

        if (flowIdToStart) {
            flowId = flowIdToStart;
            const flowSnap = await getDoc(doc(db, "flows", flowId));
            if (!flowSnap.exists()) return;
            activeFlow = flowSnap.data();

            const definition = activeFlow.definition as FlowDefinition;
            const startNode = definition.nodes.find(n => n.type === 'start');

            if (startNode) {
                currentNodeId = startNode.id;
                await traverse(contactId, flowId, startNode.id, incomingText, definition);
            }
        } else {
            return; // No flow to start
        }
    } else {
        const flowSnap = await getDoc(doc(db, "flows", flowId));
        if (!flowSnap.exists()) return;
        const activeFlow = flowSnap.data();
        const definition = activeFlow.definition as FlowDefinition;

        await traverse(contactId, flowId, currentNodeId!, incomingText, definition);
    }
}

async function traverse(contactId: string, flowId: string, nodeId: string, input: string, definition: FlowDefinition) {
    const currentNode = definition.nodes.find(n => n.id === nodeId);
    if (!currentNode) return;

    const outgoingEdges = definition.edges.filter(e => e.source === nodeId);

    if (currentNode.type === 'start' || currentNode.type === 'message') {
        if (currentNode.type === 'message') {
            await executeMessageNode(contactId, currentNode.data);
        }

        if (outgoingEdges.length > 0) {
            const nextNodeId = outgoingEdges[0].target;
            await updateStateAndTraverse(contactId, flowId, nextNodeId, input, definition);
        } else {
            await clearFlowState(contactId);
        }
    } else if (currentNode.type === 'condition') {
        const variable = currentNode.data.variable?.toLowerCase() || "";
        const matches = input.toLowerCase().includes(variable);

        const edge = definition.edges.find(e =>
            e.source === nodeId && e.sourceHandle === (matches ? 'true' : 'false')
        );

        if (edge) {
            await updateStateAndTraverse(contactId, flowId, edge.target, input, definition);
        } else {
            await clearFlowState(contactId);
        }
    } else if (currentNode.type === 'wait') {
        const durationStr = currentNode.data.duration || "5";
        const unit = (currentNode.data.unit || "Minutes").toLowerCase();
        let durationMs = parseInt(durationStr, 10) * 1000;
        
        if (unit === "minutes") durationMs *= 60;
        else if (unit === "hours") durationMs *= 3600;
        else if (unit === "days") durationMs *= 86400;

        if (outgoingEdges.length > 0) {
            const nextNodeId = outgoingEdges[0].target;
            
            console.log(`[FlowEngine] Waiting ${durationMs}ms before next node...`);
            setTimeout(() => {
                updateStateAndTraverse(contactId, flowId, nextNodeId, input, definition).catch(err => {
                    console.error("[FlowEngine] Delayed traversal failed:", err);
                });
            }, durationMs);
        } else {
            await clearFlowState(contactId);
        }
    }
}

async function updateStateAndTraverse(contactId: string, flowId: string, nextNodeId: string, input: string, definition: FlowDefinition) {
    await updateDoc(doc(db, "contacts", contactId), {
        currentFlowId: flowId,
        currentNodeId: nextNodeId
    });

    await traverse(contactId, flowId, nextNodeId, input, definition);
}

async function clearFlowState(contactId: string) {
    await updateDoc(doc(db, "contacts", contactId), {
        currentFlowId: null,
        currentNodeId: null
    });
}

async function executeMessageNode(contactId: string, data: any) {
    const contactSnap = await getDoc(doc(db, "contacts", contactId));
    if (!contactSnap.exists()) return;
    const contact = { id: contactSnap.id, ...contactSnap.data() } as any;

    try {
        if (data.mode === 'template') {
            await sendTemplate(contact.phone, data.templateName, "en_US", []);
        } else {
            await sendText(contact.phone, data.text || "Hello from Chatbot!");
        }

        const msgRef = doc(collection(db, "messages"));
        await setDoc(msgRef, {
            contactId: contact.id,
            direction: "OUTGOING",
            type: data.mode === 'template' ? "template" : "text",
            content: { body: data.text || data.templateName },
            status: "SENT",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        revalidatePath("/dashboard/chat");
    } catch (error) {
        console.error("[FlowEngine] Failed to send message:", error);
    }
}
