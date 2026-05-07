"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Mail, Loader2, ShieldCheck, Zap } from "lucide-react";

const FEATURES = [
    "WhatsApp Cloud API integrated",
    "Role-based team access control",
    "Automated message flows",
    "Bulk template broadcasting",
];

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

            {/* ── Left branding panel ── */}
            <div className="hidden lg:flex flex-col justify-between w-[44%] bg-sidebar px-14 py-12 relative overflow-hidden shrink-0">
                {/* Glow orbs */}
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/15 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-primary/8 blur-[80px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-primary/5 blur-[60px] pointer-events-none" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-glow">
                        <Zap className="w-4.5 h-4.5 text-white fill-white/30" />
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-primary/60">trigads</p>
                        <p className="text-white font-bold text-lg leading-none tracking-tight">Proton</p>
                    </div>
                </div>

                {/* Headline */}
                <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary/80">
                            Next-gen platform
                        </span>
                        <h1 className="text-[2.75rem] font-black tracking-tight text-white leading-[1.08]">
                            Sales & Support,<br />
                            <span className="text-primary">Unified.</span>
                        </h1>
                        <p className="text-sidebar-foreground/50 text-sm leading-relaxed max-w-xs">
                            WhatsApp Business automation, real-time team chat, and intelligent message flows — all in one command center.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        {FEATURES.map(f => (
                            <div key={f} className="flex items-center gap-3 text-sm text-sidebar-foreground/60">
                                <div className="w-4 h-4 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-sm bg-primary" />
                                </div>
                                {f}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-[10px] text-sidebar-foreground/25 tracking-widest">
                        © {new Date().getFullYear()} Trigads Digital Solutions LLP
                    </p>
                </div>
            </div>

            {/* ── Right login panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16">

                {/* Mobile logo */}
                <div className="lg:hidden mb-10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-glow">
                        <Zap className="w-4 h-4 text-white fill-white/30" />
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary/60">trigads</p>
                        <p className="font-bold text-base leading-none text-foreground">Proton</p>
                    </div>
                </div>

                <div className="w-full max-w-[340px] space-y-7 animate-fade-up">
                    {/* Heading */}
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                        <p className="text-muted-foreground text-sm">Sign in to your Proton workspace.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="relative group">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                            <Input
                                id="login-email"
                                type="email"
                                placeholder="Email address"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="pl-10 h-11 bg-white border-border rounded-xl shadow-card focus:shadow-glow focus:border-primary/40 transition-all font-medium text-sm"
                            />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                            <Input
                                id="login-password"
                                type="password"
                                placeholder="Password"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="pl-10 h-11 bg-white border-border rounded-xl shadow-card focus:shadow-glow focus:border-primary/40 transition-all font-medium text-sm"
                            />
                        </div>

                        <Button
                            id="login-submit"
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 rounded-xl font-semibold text-sm tracking-wide shadow-glow active:scale-[0.98] transition-all mt-1"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Signing in…</>
                            ) : "Sign In →"}
                        </Button>
                    </form>

                    {/* Note */}
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/5 border border-primary/10">
                        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Access is restricted to authorized personnel only. All sessions are encrypted and logged.
                        </p>
                    </div>

                    <p className="lg:hidden text-center text-[10px] text-muted-foreground/40 tracking-widest">
                        © {new Date().getFullYear()} Trigads Digital Solutions LLP
                    </p>
                </div>
            </div>
        </div>
    );
}
