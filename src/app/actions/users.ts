"use server";

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData: any) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'ADMIN') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const { name, email, password, role } = formData;

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const qSnap = await getDocs(q);

        if (!qSnap.empty) {
            return { success: false, error: "User with this email already exists" };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUserRef = doc(usersRef);
        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: role as any,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await setDoc(newUserRef, newUser);

        revalidatePath("/dashboard/admin/users");
        return { success: true, user: { id: newUserRef.id, ...newUser } };
    } catch (error: any) {
        console.error("Error creating user:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteUserAction(id: string) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'ADMIN') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        if (id === (session?.user as any)?.id) {
            return { success: false, error: "You cannot delete your own account" };
        }

        await deleteDoc(doc(db, "users", id));

        revalidatePath("/dashboard/admin/users");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, error: error.message };
    }
}
