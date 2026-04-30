"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Mail, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await signIn("credentials", { email, password, redirect: false });
            if (!result) {
                toast.error("No response from server. Please try again.");
            } else if (result.error) {
                toast.error(result.error === "CredentialsSignin" ? "Invalid email or password." : `Login error: ${result.error}`);
            } else if (!result.ok) {
                toast.error("Login failed. Please check your credentials.");
            } else {
                toast.success("Authenticated successfully.");
                window.location.href = "/dashboard/chat";
            }
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-mesh overflow-hidden">

            {/* ── Left branding panel (desktop only) ── */}
            <div className="hidden lg:flex flex-col justify-between w-[42%] bg-sidebar px-16 py-14 relative overflow-hidden shrink-0">
                {/* Decorative orbs */}
                <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/20 blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-[60px] pointer-events-none" />

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-glow text-white font-black text-lg">P</div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">trigads</p>
                            <p className="text-white font-black text-xl tracking-tight leading-none">Proton</p>
                        </div>
                    </div>
                </div>

                {/* Headline */}
                <div className="relative z-10 space-y-6">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Next-gen platform</p>
                        <h1 className="text-5xl font-black tracking-tighter text-white leading-[1.05]">
                            Sales &<br />Support,<br />
                            <span className="text-primary">Unified.</span>
                        </h1>
                        <p className="text-sidebar-foreground/60 text-sm leading-relaxed max-w-xs">
                            WhatsApp Business automation, real-time team chat, and intelligent message flows — all in one command center.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        {[
                            "WhatsApp Cloud API integrated",
                            "Role-based team access",
                            "Automated message flows",
                            "Bulk template broadcasting",
                        ].map(f => (
                            <div key={f} className="flex items-center gap-2.5 text-sm text-sidebar-foreground/70">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                {f}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-[10px] text-sidebar-foreground/30 uppercase tracking-widest">
                        © {new Date().getFullYear()} Trigads Digital Solutions LLP. All rights reserved.
                    </p>
                </div>
            </div>

            {/* ── Right login panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16">

                {/* Mobile logo */}
                <div className="lg:hidden mb-10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-base shadow-glow">P</div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60">trigads</p>
                        <p className="font-black text-lg tracking-tight leading-none text-foreground">Proton</p>
                    </div>
                </div>

                <div className="w-full max-w-sm space-y-8">
                    {/* Heading */}
                    <div className="space-y-1.5">
                        <h2 className="text-3xl font-black tracking-tighter text-foreground">Welcome back</h2>
                        <p className="text-muted-foreground text-sm">Sign in to your Proton workspace.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="login-email"
                                type="email"
                                placeholder="Email address"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="pl-11 h-12 bg-white border-border rounded-xl shadow-card focus:shadow-glow focus:border-primary/40 transition-all font-medium"
                            />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="login-password"
                                type="password"
                                placeholder="Password"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="pl-11 h-12 bg-white border-border rounded-xl shadow-card focus:shadow-glow focus:border-primary/40 transition-all font-medium"
                            />
                        </div>

                        <Button
                            id="login-submit"
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl font-black text-sm uppercase tracking-widest shadow-glow active:scale-[0.98] transition-all"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Authenticating…</>
                            ) : "Sign In"}
                        </Button>
                    </form>

                    {/* Access note */}
                    <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-primary/5 border border-primary/15">
                        <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Access is restricted to authorized personnel only. All sessions are encrypted and logged.
                        </p>
                    </div>

                    {/* Mobile copyright */}
                    <p className="lg:hidden text-center text-[10px] text-muted-foreground/40 uppercase tracking-widest">
                        © {new Date().getFullYear()} Trigads Digital Solutions LLP
                    </p>
                </div>
            </div>
        </div>
    );
}
