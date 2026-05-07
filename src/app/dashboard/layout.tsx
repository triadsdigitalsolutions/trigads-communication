import Link from "next/link";
import { MessageSquare, Layout, LogOut, Zap, BookUser, Radio, Users, CalendarClock, Layers } from "lucide-react";
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
            <aside className="hidden md:flex flex-col w-[60px] shrink-0 h-screen bg-sidebar border-r border-sidebar-border shadow-sidebar">

                {/* Logo */}
                <div className="flex items-center justify-center h-[60px] shrink-0 border-b border-sidebar-border">
                    <Link href="/dashboard/chat" className="group">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-black text-sm shadow-glow group-hover:scale-105 group-hover:shadow-glow-soft transition-all duration-200">
                            P
                        </div>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex flex-col items-center gap-0.5 py-3 flex-1 overflow-y-auto custom-scrollbar">
                    <NavItem href="/dashboard/chat"      icon={<MessageSquare className="w-4.5 h-4.5" />} label="Chat" />
                    <NavItem href="/dashboard/templates" icon={<Layout        className="w-4.5 h-4.5" />} label="Templates" />
                    <NavItem href="/dashboard/flows"     icon={<Zap           className="w-4.5 h-4.5" />} label="Flows" />
                    <NavItem href="/dashboard/contacts"  icon={<BookUser      className="w-4.5 h-4.5" />} label="Contacts" />
                    <NavItem href="/dashboard/groups"    icon={<Layers        className="w-4.5 h-4.5" />} label="Groups" />
                    <NavItem href="/dashboard/bulk"      icon={<Radio         className="w-4.5 h-4.5" />} label="Bulk" />
                    <NavItem href="/dashboard/scheduler" icon={<CalendarClock className="w-4.5 h-4.5" />} label="Scheduler" />
                    {role === "ADMIN" && (
                        <NavItem href="/dashboard/admin/users" icon={<Users className="w-4.5 h-4.5" />} label="Agents" />
                    )}
                </nav>

                {/* User + signout */}
                <div className="flex flex-col items-center gap-2 py-3 border-t border-sidebar-border shrink-0">
                    <div className="group relative">
                        <Avatar className="w-8 h-8 rounded-xl ring-1 ring-sidebar-border group-hover:ring-primary/50 transition-all cursor-pointer">
                            <AvatarFallback className="bg-primary/25 text-primary text-[11px] font-black rounded-xl">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        {/* Tooltip */}
                        <div className="absolute left-full ml-2.5 bottom-0 bg-sidebar-accent border border-sidebar-border rounded-lg px-3 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 whitespace-nowrap shadow-elevated">
                            <p className="text-xs font-semibold text-sidebar-foreground">{name}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mt-0.5">{role || "Agent"}</p>
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-sidebar-border" />
                        </div>
                    </div>

                    <form action={async () => { "use server"; await signOut(); }}>
                        <button
                            type="submit"
                            title="Sign out"
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-sidebar-foreground/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </form>
                </div>
            </aside>

            {/* ── Main content ────────────────────────────── */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-20 md:pb-0">
                    {children}
                </main>
            </div>

            {/* ── Mobile bottom nav ───────────────────────── */}
            <nav className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50
                flex items-center gap-0.5 px-2 h-14
                bg-sidebar/96 backdrop-blur-2xl
                border border-sidebar-border rounded-2xl
                shadow-elevated">
                <NavItem href="/dashboard/chat"      icon={<MessageSquare className="w-4.5 h-4.5" />} label="Chat" mobile />
                <NavItem href="/dashboard/templates" icon={<Layout        className="w-4.5 h-4.5" />} label="Templates" mobile />
                <NavItem href="/dashboard/flows"     icon={<Zap           className="w-4.5 h-4.5" />} label="Flows" mobile />
                <NavItem href="/dashboard/contacts"  icon={<BookUser      className="w-4.5 h-4.5" />} label="Contacts" mobile />
                <NavItem href="/dashboard/groups"    icon={<Layers        className="w-4.5 h-4.5" />} label="Groups" mobile />
                <NavItem href="/dashboard/bulk"      icon={<Radio         className="w-4.5 h-4.5" />} label="Bulk" mobile />
                <NavItem href="/dashboard/scheduler" icon={<CalendarClock className="w-4.5 h-4.5" />} label="Scheduler" mobile />
                <form action={async () => { "use server"; await signOut(); }}>
                    <button type="submit" className="w-10 h-10 rounded-xl flex items-center justify-center text-sidebar-foreground/30 hover:text-red-400 transition-colors">
                        <LogOut className="w-4 h-4" />
                    </button>
                </form>
            </nav>
        </div>
    );
}
