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
        <div className="flex flex-col h-screen w-full overflow-hidden bg-[#e1e1de] relative">
            <div className="hidden md:block absolute top-0 left-0 right-0 h-[127px] bg-[#00a884] z-0"></div>
            <div className="flex flex-1 w-full md:max-w-[1600px] md:my-5 md:mx-auto bg-white md:shadow-[0_6px_18px_rgba(0,0,0,0.05)] md:rounded-sm overflow-hidden z-10 relative">

            {/* ── Desktop Sidebar ─────────────────────────── */}
            <aside className="hidden md:flex flex-col w-[250px] lg:w-[300px] shrink-0 h-full bg-white border-r border-[#d1d7db]">

                {/* Logo */}
                <div className="flex items-center gap-3 px-5 h-[60px] shrink-0 border-b border-[#d1d7db] bg-[#f0f2f5]">
                    <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4 text-white fill-white" />
                    </div>
                    <div>
                        <p className="text-[15px] font-medium text-[#111b21] leading-none">Trigads Communication</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex flex-col flex-1 overflow-y-auto custom-scrollbar bg-white py-2">
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
                <div className="px-4 py-3 border-t border-[#d1d7db] bg-[#f0f2f5] shrink-0">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 rounded-full shrink-0">
                            <AvatarFallback className="bg-black/5 text-[#54656f] text-[13px] font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-medium text-[#111b21] truncate leading-none mb-1">{name}</p>
                            <p className="text-[12px] text-[#667781] leading-none">{role === "ADMIN" ? "Admin" : "Agent"}</p>
                        </div>
                        <form action={async () => { "use server"; await signOut(); }}>
                            <button
                                type="submit"
                                title="Sign out"
                                className="w-10 h-10 rounded-full flex items-center justify-center text-[#54656f] hover:bg-[#e9edef] transition-colors shrink-0"
                            >
                                <LogOut className="w-5 h-5" />
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
