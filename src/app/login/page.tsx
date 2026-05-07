"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Mail, Loader2, Zap, CheckCircle2 } from "lucide-react";

const FEATURES = [
    "WhatsApp Cloud API integrated",
    "Role-based team access control",
    "Automated message flows",
    "Bulk template broadcasting",
];

export default function LoginPage() {
    const [email, setEmail]         = useState("");
    const [password, setPassword]   = useState("");
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
            toast.error(error?.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background">

            {/* ── Left panel ── */}
            <div className="hidden lg:flex flex-col w-[46%] bg-primary relative overflow-hidden shrink-0 p-12">
                {/* Soft glow layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80 pointer-events-none" />
                <div className="absolute -top-40 -right-20 w-80 h-80 rounded-full bg-white/5 blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-black/10 blur-[80px]" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3 mb-auto">
                    <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Zap className="w-5 h-5 text-white fill-white/40" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50 leading-none mb-1">Trigads</p>
                        <p className="text-lg font-bold text-white leading-none">Proton</p>
                    </div>
                </div>

                {/* Headline */}
                <div className="relative z-10 mt-auto space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-[2.8rem] font-black text-white leading-[1.08] tracking-tight">
                            Your WhatsApp<br />Business Hub.
                        </h1>
                        <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                            Real-time team messaging, automated flows, and smart broadcasting — unified in one powerful workspace.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {FEATURES.map(f => (
                            <div key={f} className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-white/70 shrink-0" />
                                <span className="text-sm text-white/70">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative z-10 mt-12 text-[11px] text-white/30 tracking-widest">
                    © {new Date().getFullYear()} Trigads Digital Solutions LLP
                </p>
            </div>

            {/* ── Right panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16 bg-white">

                {/* Mobile logo */}
                <div className="lg:hidden mb-10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow">
                        <Zap className="w-4.5 h-4.5 text-white fill-white/30" />
                    </div>
                    <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/60">Trigads</p>
                        <p className="font-bold text-base leading-none">Proton</p>
                    </div>
                </div>

                <div className="w-full max-w-[360px] animate-fade-up">
                    <div className="mb-8 space-y-1.5">
                        <h2 className="text-2xl font-bold text-foreground">Welcome back 👋</h2>
                        <p className="text-muted-foreground text-sm">Sign in to your Proton workspace.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground/80">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="name@company.com"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="pl-10 h-11 border-border rounded-xl bg-secondary/60 text-sm font-medium focus:border-primary/50 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground/80">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="login-password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="pl-10 h-11 border-border rounded-xl bg-secondary/60 text-sm font-medium focus:border-primary/50 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        <Button
                            id="login-submit"
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 rounded-xl font-semibold text-sm shadow-glow hover:shadow-glow-soft active:scale-[0.98] transition-all mt-2"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Signing in…</>
                            ) : "Sign in"}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-[11px] text-muted-foreground/40">
                        Restricted to authorized personnel only
                    </p>

                    <p className="lg:hidden mt-4 text-center text-[10px] text-muted-foreground/30">
                        © {new Date().getFullYear()} Trigads Digital Solutions LLP
                    </p>
                </div>
            </div>
        </div>
    );
}
