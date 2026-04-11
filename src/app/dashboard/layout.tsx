import Link from "next/link";
import { MessageSquare, Layout, Settings, Users, BarChart3, LogOut, Zap } from "lucide-react";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const role = (session?.user as any)?.role;

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar navigation */}
            <aside className="w-20 md:w-24 bg-sidebar border-r border-border flex flex-col items-center py-8 transition-all duration-500 ease-in-out">
                <div className="mb-12">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/20 rotate-3 transform hover:rotate-6 transition-transform">
                        P
                    </div>
                </div>

                <nav className="flex-1 space-y-8">
                    <NavItem href="/dashboard/chat" icon={<MessageSquare className="w-6 h-6" />} label="Chat" />
                    <NavItem href="/dashboard/templates" icon={<Layout className="w-6 h-6" />} label="Templates" />
                    <NavItem href="/dashboard/flows" icon={<Zap className="w-6 h-6" />} label="Flows" />

                    {role === 'ADMIN' && (
                        <>
                            <NavItem href="/dashboard/admin/users" icon={<Users className="w-6 h-6" />} label="Agents" />
                        </>
                    )}
                </nav>

                <div className="mt-auto flex flex-col items-center gap-6">
                    <div className="group relative">
                        <Avatar className="h-12 w-12 rounded-2xl border-2 border-primary/20 shadow-premium transition-all duration-300 group-hover:border-primary group-hover:scale-110 cursor-pointer">
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-black uppercase">
                                {session?.user?.name?.[0] || 'U'}
                            </AvatarFallback>
                        </Avatar>

                        {/* Profile Tooltip/Popover */}
                        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-white border border-border rounded-2xl p-4 shadow-elevated opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 min-w-[160px]">
                            <p className="text-sm font-black text-foreground truncate">{session?.user?.name || 'User'}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-1">{role || 'Agent'}</p>
                            <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l border-b border-border rotate-45" />
                        </div>
                    </div>

                    <form action={async () => {
                        "use server";
                        await signOut();
                    }}>
                        <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                            <LogOut className="w-6 h-6" />
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main content area */}
            <main className="flex-1 relative overflow-hidden bg-background">
                {children}
            </main>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="group relative flex flex-col items-center gap-1 transition-all duration-300"
        >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors group-hover:bg-primary/10">
                {icon}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/0 group-hover:text-muted-foreground transition-all duration-300 text-center">
                {label}
            </span>
        </Link>
    );
}
