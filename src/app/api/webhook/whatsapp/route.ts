import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { processFlow } from "@/lib/flowEngine";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
    }

    return new Response('Invalid token', { status: 403 });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        processWebhook(body).catch((err) => {
            console.error('Error processing webhook:', err);
        });

        return NextResponse.json({ status: 'ok' }, { status: 200 });
    } catch (error) {
        console.error('Webhook payload error:', error);
        return NextResponse.json({ error: 'Payload error' }, { status: 400 });
    }
}

async function processWebhook(body: any) {
    if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
            for (const change of entry.changes) {
                if (change.value.messages) {
                    for (const message of change.value.messages) {
                        const from = message.from;
                        const contactName = change.value.contacts?.[0]?.profile?.name || 'Unknown';
                        const messageId = message.id;
                        const messageType = message.type;
                        let content: any = {};

                        if (messageType === 'text') {
                            content = { body: message.text.body };
                        } else if (messageType === 'image') {
                            content = {
                                body: message.image?.caption || 'Image',
                                mediaId: message.image?.id,
                                mimeType: message.image?.mime_type || 'image/jpeg',
                                mediaType: 'image',
                            };
                        } else if (messageType === 'document') {
                            content = {
                                body: message.document?.filename || 'Document',
                                mediaId: message.document?.id,
                                mimeType: message.document?.mime_type || 'application/octet-stream',
                                mediaType: 'document',
                            };
                        } else if (messageType === 'audio') {
                            content = {
                                body: 'Audio message',
                                mediaId: message.audio?.id,
                                mimeType: message.audio?.mime_type || 'audio/ogg',
                                mediaType: 'audio',
                            };
                        } else if (messageType === 'video') {
                            content = {
                                body: message.video?.caption || 'Video',
                                mediaId: message.video?.id,
                                mimeType: message.video?.mime_type || 'video/mp4',
                                mediaType: 'video',
                            };
                        } else {
                            content = { body: `[${messageType}]`, raw: message };
                        }

                        // 1. Ensure contact exists (upsert)
                        const cQuery = query(collection(db, "contacts"), where("phone", "==", from));
                        const cSnap = await getDocs(cQuery);
                        let contactId;
                        if (!cSnap.empty) {
                            const cRef = cSnap.docs[0].ref;
                            await updateDoc(cRef, { name: contactName, updatedAt: new Date().toISOString() });
                            contactId = cSnap.docs[0].id;
                        } else {
                            const newCRef = doc(collection(db, "contacts"));
                            await setDoc(newCRef, {
                                phone: from,
                                name: contactName,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            });
                            contactId = newCRef.id;
                        }

                        // 2. Save message
                        const newMsgRef = doc(collection(db, "messages"));
                        await setDoc(newMsgRef, {
                            contactId: contactId,
                            direction: 'INCOMING',
                            type: messageType,
                            content: content,
                            status: 'READ',
                            metaMessageId: messageId,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });

                        // 3. Trigger Flow Engine
                        if (messageType === 'text') {
                            processFlow(contactId, message.text.body).catch(err => {
                                console.error('[Webhook] Flow Engine Error:', err);
                            });
                        }

                        // 4. Activate any "after_message" schedules for this contact
                        triggerAfterMessageSchedules(contactId).catch(err => {
                            console.error('[Webhook] Scheduler trigger error:', err);
                        });
                    }
                }

                if (change.value.statuses) {
                    for (const statusUpdate of change.value.statuses) {
                        const metaMessageId = statusUpdate.id;
                        const status = statusUpdate.status.toUpperCase();

                        const validStatuses = ['SENT', 'DELIVERED', 'READ', 'FAILED'];
                        if (validStatuses.includes(status)) {
                            const mQuery = query(collection(db, "messages"), where("metaMessageId", "==", metaMessageId));
                            const mSnap = await getDocs(mQuery);
                            if (!mSnap.empty) {
                                await updateDoc(mSnap.docs[0].ref, {
                                    status: status,
                                    updatedAt: new Date().toISOString()
                                });
                            }
                        }
                    }
                }
            }
        }
    }
}

/** When an incoming message arrives, set scheduledAt on any waiting after_message schedules for this contact */
async function triggerAfterMessageSchedules(contactId: string) {
    const q = query(
        collection(db, "scheduled_messages"),
        where("contactId", "==", contactId),
        where("scheduleMode", "==", "after_message"),
        where("status", "==", "PENDING")
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
        const delayMins = (d.data().afterMessageDelayMinutes as number) || 0;
        const scheduledAt = new Date(Date.now() + delayMins * 60 * 1000).toISOString();
        await updateDoc(d.ref, { scheduledAt });
    }
}
