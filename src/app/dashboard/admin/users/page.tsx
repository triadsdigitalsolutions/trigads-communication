import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import UserList from "./UserList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function AdminUsersPage() {
    const session = await auth();
    if ((session?.user as any)?.role !== 'ADMIN') {
        redirect("/dashboard/chat");
    }

    const q = query(collection(db, "users"));
    const snap = await getDocs(q);
    const users = snap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        email: doc.data().email,
        role: doc.data().role,
        createdAt: doc.data().createdAt,
    })).sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Agent Management
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Create and manage your team of support agents and sales reps.
                    </p>
                </div>
            </div>

            <UserList initialUsers={JSON.parse(JSON.stringify(users))} />
        </div>
    );
}
