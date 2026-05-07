import Link from "next/link";
import { MessageSquare, Layout, LogOut, Zap, BookUser, Radio, Users, CalendarClock, Layers, LayoutDashboard } from "lucide-react";
import { auth, signOut } from "@/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NavItem } from "./NavItem";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    const name = session?.user?.name || "User";
    const initials = name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">

            {/* ── Desktop Sidebar ─────────────────────────── */}
            <aside className="hidden md:flex flex-col w-[210px] shrink-0 h-screen bg-sidebar border-r border-sidebar-border shadow-sidebar">

                {/* Logo */}
                <div className="flex items-center gap-3 px-5 h-[68px] shrink-0 border-b border-sidebar-border">
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-glow shrink-0">
                        <Zap className="w-4 h-4 text-white fill-white/40" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60 leading-none mb-0.5">Trigads</p>
                        <p className="text-[15px] font-bold text-foreground leading-none">Proton</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1 overflow-y-auto custom-scrollbar">
                    <NavItem href="/dashboard/chat"      icon={<MessageSquare className="w-4 h-4" />} label="Messages" />
                    <NavItem href="/dashboard/templates" icon={<Layout        className="w-4 h-4" />} label="Templates" />
                    <NavItem href="/dashboard/flows"     icon={<Zap           className="w-4 h-4" />} label="Flows" />
                    <NavItem href="/dashboard/contacts"  icon={<BookUser      className="w-4 h-4" />} label="Contacts" />
                    <NavItem href="/dashboard/groups"    icon={<Layers        className="w-4 h-4" />} label="Groups" />
                    <NavItem href="/dashboard/bulk"      icon={<Radio         className="w-4 h-4" />} label="Broadcast" />
                    <NavItem href="/dashboard/scheduler" icon={<CalendarClock className="w-4 h-4" />} label="Scheduler" />
                    {role === "ADMIN" && (
                        <NavItem href="/dashboard/admin/users" icon={<Users className="w-4 h-4" />} label="Agents" />
                    )}
                </nav>

                {/* User + signout */}
                <div className="px-3 py-4 border-t border-sidebar-border shrink-0">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 rounded-xl ring-1 ring-border shrink-0">
                            <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-bold rounded-xl">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-foreground truncate leading-none mb-0.5">{name}</p>
                            <p className="text-[11px] text-muted-foreground/70 leading-none">{role === "ADMIN" ? "Admin" : "Agent"}</p>
                        </div>
                        <form action={async () => { "use server"; await signOut(); }}>
                            <button
                                type="submit"
                                title="Sign out"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/8 transition-all shrink-0"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* ── Main content ────────────────────────────── */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-20 md:pb-0">
                    {children}
                </main>
            </div>

            {/* ── Mobile bottom nav ───────────────────────── */}
            <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50
                flex items-center justify-around px-2 h-16
                bg-sidebar border border-sidebar-border rounded-2xl
                shadow-elevated">
                <NavItem href="/dashboard/chat"      icon={<MessageSquare className="w-5 h-5" />} label="Chat" mobile />
                <NavItem href="/dashboard/templates" icon={<Layout        className="w-5 h-5" />} label="Templates" mobile />
                <NavItem href="/dashboard/flows"     icon={<Zap           className="w-5 h-5" />} label="Flows" mobile />
                <NavItem href="/dashboard/contacts"  icon={<BookUser      className="w-5 h-5" />} label="Contacts" mobile />
                <NavItem href="/dashboard/groups"    icon={<Layers        className="w-5 h-5" />} label="Groups" mobile />
                <NavItem href="/dashboard/bulk"      icon={<Radio         className="w-5 h-5" />} label="Bulk" mobile />
                <form action={async () => { "use server"; await signOut(); }}>
                    <button type="submit" className="w-11 h-11 rounded-xl flex items-center justify-center text-muted-foreground/50 hover:text-destructive transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </form>
            </nav>
        </div>
    );
}
