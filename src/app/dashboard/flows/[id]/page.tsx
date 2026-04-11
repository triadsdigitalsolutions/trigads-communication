import { auth } from "@/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { notFound, redirect } from "next/navigation";
import FlowEditor from "@/components/flows/FlowEditor";

export default async function FlowEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) redirect("/login");

    const flowSnap = await getDoc(doc(db, "flows", id));
    
    if (!flowSnap.exists()) notFound();

    const flow = { id: flowSnap.id, ...flowSnap.data() };

    return (
        <div className="h-screen w-full">
            <FlowEditor flow={flow as any} />
        </div>
    );
}
