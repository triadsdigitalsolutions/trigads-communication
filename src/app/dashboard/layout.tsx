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
        <div className="flex h-screen w-full overflow-hidden bg-background relative text-foreground">
            {/* ── Desktop Sidebar ─────────────────────────── */}
            <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] shrink-0 h-full bg-sidebar border-r border-border shadow-sidebar relative z-20">
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 h-[72px] shrink-0 border-b border-border/50">
                    <div className="w-9 h-9 rounded-[10px] bg-primary flex items-center justify-center shrink-0 shadow-glow">
                        <MessageSquare className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
                    </div>
                    <div>
                        <p className="text-[16px] font-bold tracking-tight text-foreground leading-none">Trigads</p>
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5 uppercase tracking-wider">Communication</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex flex-col flex-1 overflow-y-auto custom-scrollbar px-3 py-4 gap-1">
                    <NavItem href="/dashboard/chat"      icon={<MessageSquare className="w-[18px] h-[18px]" />} label="Messages" />
                    <NavItem href="/dashboard/templates" icon={<Layout        className="w-[18px] h-[18px]" />} label="Templates" />
                    <NavItem href="/dashboard/flows"     icon={<Zap           className="w-[18px] h-[18px]" />} label="Flows" />
                    <NavItem href="/dashboard/contacts"  icon={<BookUser      className="w-[18px] h-[18px]" />} label="Contacts" />
                    <NavItem href="/dashboard/groups"    icon={<Layers        className="w-[18px] h-[18px]" />} label="Groups" />
                    <NavItem href="/dashboard/bulk"      icon={<Radio         className="w-[18px] h-[18px]" />} label="Broadcast" />
                    <NavItem href="/dashboard/scheduler" icon={<CalendarClock className="w-[18px] h-[18px]" />} label="Scheduler" />
                    
                    {role === "ADMIN" && (
                        <>
                            <div className="h-px w-full bg-border/60 my-2" />
                            <NavItem href="/dashboard/admin/users" icon={<Users className="w-[18px] h-[18px]" />} label="Agents" />
                        </>
                    )}
                </nav>

                {/* User + signout */}
                <div className="p-4 shrink-0 border-t border-border/50">
                    <div className="flex items-center gap-3 p-2 rounded-2xl bg-secondary/50 border border-border/50">
                        <Avatar className="w-10 h-10 rounded-xl shrink-0 border border-border/50 shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-primary text-[13px] font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-foreground truncate leading-none mb-1.5">{name}</p>
                            <p className="text-[11px] font-medium text-muted-foreground leading-none tracking-wide uppercase">{role === "ADMIN" ? "Admin" : "Agent"}</p>
                        </div>
                        <form action={async () => { "use server"; await signOut(); }}>
                            <button
                                type="submit"
                                title="Sign out"
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95 shrink-0"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* ── Main content ────────────────────────────── */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background">
                <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-20 md:pb-0">
                    {children}
                </main>
            </div>

            {/* ── Mobile bottom nav ───────────────────────── */}
            <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50
                flex items-center justify-around px-2 h-[68px]
                bg-sidebar/80 backdrop-blur-xl border border-border rounded-2xl
                shadow-elevated">
                <NavItem href="/dashboard/chat"      icon={<MessageSquare className="w-[22px] h-[22px]" />} label="Chat" mobile />
                <NavItem href="/dashboard/templates" icon={<Layout        className="w-[22px] h-[22px]" />} label="Templates" mobile />
                <NavItem href="/dashboard/flows"     icon={<Zap           className="w-[22px] h-[22px]" />} label="Flows" mobile />
                <NavItem href="/dashboard/contacts"  icon={<BookUser      className="w-[22px] h-[22px]" />} label="Contacts" mobile />
                <NavItem href="/dashboard/groups"    icon={<Layers        className="w-[22px] h-[22px]" />} label="Groups" mobile />
                <NavItem href="/dashboard/bulk"      icon={<Radio         className="w-[22px] h-[22px]" />} label="Bulk" mobile />
                <form action={async () => { "use server"; await signOut(); }}>
                    <button type="submit" className="w-12 h-12 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95">
                        <LogOut className="w-[22px] h-[22px]" />
                    </button>
                </form>
            </nav>
        </div>
    );
}
