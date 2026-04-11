"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(email: string, password: string) {
    try {
        await signIn("credentials", {
            email,
            password,
            redirect: false,
        });
        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { success: false, error: "Invalid email or password." };
                default:
                    return { success: false, error: `Auth error: ${error.type}` };
            }
        }
        // Unknown error — surface the message
        return {
            success: false,
            error: error instanceof Error ? error.message : "Something went wrong.",
        };
    }
}
