import Link from "next/link";
import { MessageSquare, Layout, LogOut, Zap, BookUser, Radio, Users, CalendarClock } from "lucide-react";
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

            {/* ── Desktop Sidebar ─────────────────────────────────── */}
            <aside className="
                hidden md:flex flex-col
                w-[72px] shrink-0 h-screen
                bg-sidebar border-r border-sidebar-border
                shadow-sidebar
            ">
                {/* Logo mark */}
                <div className="flex items-center justify-center h-[72px] shrink-0 border-b border-sidebar-border">
                    <Link href="/dashboard/chat" className="group">
                        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-lg shadow-glow group-hover:scale-110 transition-transform">
                            P
                        </div>
                    </Link>
                </div>

                {/* Nav links */}
                <nav className="flex flex-col items-center gap-1 py-4 flex-1 overflow-y-auto custom-scrollbar">
                    <NavItem href="/dashboard/chat"      icon={<MessageSquare className="w-5 h-5" />} label="Chat" />
                    <NavItem href="/dashboard/templates" icon={<Layout        className="w-5 h-5" />} label="Templates" />
                    <NavItem href="/dashboard/flows"     icon={<Zap           className="w-5 h-5" />} label="Flows" />
                    <NavItem href="/dashboard/contacts"  icon={<BookUser      className="w-5 h-5" />} label="Contacts" />
                    <NavItem href="/dashboard/bulk"      icon={<Radio         className="w-5 h-5" />} label="Bulk" />
                    <NavItem href="/dashboard/scheduler" icon={<CalendarClock className="w-5 h-5" />} label="Scheduler" />
                    {role === "ADMIN" && (
                        <NavItem href="/dashboard/admin/users" icon={<Users className="w-5 h-5" />} label="Agents" />
                    )}
                </nav>

                {/* User + signout */}
                <div className="flex flex-col items-center gap-3 py-4 border-t border-sidebar-border shrink-0">
                    {/* Avatar with tooltip */}
                    <div className="group relative">
                        <Avatar className="w-9 h-9 rounded-xl ring-2 ring-sidebar-border group-hover:ring-primary/60 transition-all cursor-pointer">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-black rounded-xl">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        {/* Tooltip */}
                        <div className="absolute left-full ml-3 bottom-0 bg-sidebar-accent border border-sidebar-border rounded-xl px-3 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-elevated">
                            <p className="text-xs font-black text-sidebar-foreground">{name}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mt-0.5">{role || "Agent"}</p>
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-sidebar-border" />
                        </div>
                    </div>

                    <form action={async () => { "use server"; await signOut(); }}>
                        <button
                            type="submit"
                            title="Sign out"
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sidebar-foreground/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </aside>

            {/* ── Main content ───────────────────────────────────── */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-24 md:pb-0">
                    {children}
                </main>
            </div>

            {/* ── Mobile bottom nav ──────────────────────────────── */}
            <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50
                flex items-center gap-1 px-3 h-16
                bg-sidebar/95 backdrop-blur-2xl
                border border-sidebar-border rounded-full
                shadow-elevated"
            >
                <NavItem href="/dashboard/chat"      icon={<MessageSquare className="w-5 h-5" />} label="Chat" mobile />
                <NavItem href="/dashboard/templates" icon={<Layout        className="w-5 h-5" />} label="Templates" mobile />
                <NavItem href="/dashboard/flows"     icon={<Zap           className="w-5 h-5" />} label="Flows" mobile />
                <NavItem href="/dashboard/contacts"  icon={<BookUser      className="w-5 h-5" />} label="Contacts" mobile />
                <NavItem href="/dashboard/bulk"      icon={<Radio         className="w-5 h-5" />} label="Bulk" mobile />
                <NavItem href="/dashboard/scheduler" icon={<CalendarClock className="w-5 h-5" />} label="Scheduler" mobile />
                {/* Mobile signout */}
                <form action={async () => { "use server"; await signOut(); }}>
                    <button type="submit" className="w-12 h-12 rounded-full flex items-center justify-center text-sidebar-foreground/40 hover:text-red-400 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </form>
            </nav>
        </div>
    );
}
