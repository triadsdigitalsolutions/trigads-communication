"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [debugResult, setDebugResult] = useState<any>(null);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            // Debug: store raw result for display
            setDebugResult(result);

            if (!result) {
                toast.error("No response from server. Please try again.");
            } else if (result.error) {
                if (result.error === "CredentialsSignin") {
                    toast.error("Invalid email or password.");
                } else {
                    toast.error(`Login error: ${result.error}`);
                }
            } else if (!result.ok) {
                toast.error("Login failed. Please check your credentials.");
            } else {
                toast.success("Login successful!");
                setLoginSuccess(true);
                // Hard navigation to ensure session cookie is picked up
                window.location.href = "/dashboard/chat";
            }
        } catch (error: any) {
            setDebugResult({ caught_error: error?.message });
            toast.error(error?.message || "Something went wrong. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/80 backdrop-blur-3xl border border-border rounded-[2.5rem] p-10 shadow-elevated space-y-10">
                    <div className="text-center space-y-6">
                        <div className="inline-flex flex-col items-center">
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-4xl font-black tracking-tighter text-primary">trig</span>
                                <span className="text-4xl font-black tracking-tighter text-foreground">Ads</span>
                            </div>
                            <div className="h-1 w-12 bg-primary rounded-full mb-4" />
                            <h1 className="text-5xl font-black tracking-tighter text-foreground mb-2">Proton</h1>
                        </div>
                        <p className="text-muted-foreground text-xs uppercase tracking-[0.3em] font-bold opacity-60">
                            Digital Solutions LLP
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="email"
                                    placeholder="Email address"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-12 bg-secondary/50 border-border focus:bg-white transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="password"
                                    placeholder="Secure Password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 h-12 bg-secondary/50 border-border focus:bg-white transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl text-md font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-all text-primary-foreground"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                "Login to Dashboard"
                            )}
                        </Button>
                    </form>

                    {/* Debug panel - shows raw signIn result */}
                    {debugResult !== null && (
                        <div className="mt-4 p-4 rounded-xl bg-gray-100 border border-gray-300 text-left">
                            <p className="text-xs font-bold text-gray-600 mb-1">🔍 Debug — signIn result:</p>
                            <pre className="text-xs text-gray-800 whitespace-pre-wrap break-all">
                                {JSON.stringify(debugResult, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Success state */}
                    {loginSuccess && (
                        <div className="mt-4 p-4 rounded-xl bg-green-100 border border-green-400 text-center">
                            <p className="text-green-700 font-bold text-sm">✅ Login Successful!</p>
                            <p className="text-green-600 text-xs mt-1">Redirecting... if not redirected, click below:</p>
                            <a href="/dashboard/chat" className="mt-2 inline-block text-sm font-semibold text-green-700 underline">
                                Go to Dashboard →
                            </a>
                        </div>
                    )}

                    <div className="pt-4 text-center">
                        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-tighter">
                            Authorized personnel only • Secure encrypted connection
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
