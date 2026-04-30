import Link from "next/link";
import { MessageSquare, Layout, Settings, Users, BarChart3, LogOut, Zap, BookUser, Radio } from "lucide-react";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NavItem } from "./NavItem";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const role = (session?.user as any)?.role;

    return (
        <div className="flex flex-col-reverse md:flex-row h-screen md:h-screen w-full overflow-hidden bg-background">
            {/* Sidebar / Bottom navigation */}
            <aside className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm shrink-0 h-[4.5rem] bg-foreground/5 backdrop-blur-2xl border border-foreground/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(255,255,255,0.05)] flex flex-row items-center justify-around px-3 z-50 transition-all duration-500 ease-in-out md:relative md:bottom-auto md:left-auto md:translate-x-0 md:w-24 md:h-auto md:max-w-none md:bg-sidebar md:backdrop-blur-none md:border-0 md:border-r md:border-border md:rounded-none md:shadow-none md:flex-col md:justify-between md:px-0 md:py-8">
                <div className="hidden md:block mb-12">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/20 rotate-3 transform hover:rotate-6 transition-transform">
                        P
                    </div>
                </div>

                <nav className="flex flex-row w-full justify-around items-center h-full md:flex-col md:flex-1 md:justify-start md:space-y-8 md:h-auto">
                    <NavItem href="/dashboard/chat" icon={<MessageSquare className="w-[1.2rem] h-[1.2rem] md:w-6 md:h-6" />} label="Chat" />
                    <NavItem href="/dashboard/templates" icon={<Layout className="w-[1.2rem] h-[1.2rem] md:w-6 md:h-6" />} label="Templates" />
                    <NavItem href="/dashboard/flows" icon={<Zap className="w-[1.2rem] h-[1.2rem] md:w-6 md:h-6" />} label="Flows" />
                    <NavItem href="/dashboard/contacts" icon={<BookUser className="w-[1.2rem] h-[1.2rem] md:w-6 md:h-6" />} label="Contacts" />
                    <NavItem href="/dashboard/bulk" icon={<Radio className="w-[1.2rem] h-[1.2rem] md:w-6 md:h-6" />} label="Bulk" />

                    {role === 'ADMIN' && (
                        <>
                            <NavItem href="/dashboard/admin/users" icon={<Users className="w-[1.2rem] h-[1.2rem] md:w-6 md:h-6" />} label="Agents" />
                        </>
                    )}

                    {/* Mobile LogOut */}
                    <div className="md:hidden flex items-center justify-center h-full">
                         <form action={async () => {
                            "use server";
                            await signOut();
                         }}>
                            <button type="submit" className="group relative flex flex-col items-center justify-center transition-all duration-500 h-[3.25rem] w-12 rounded-full">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                    <LogOut className="w-[1.2rem] h-[1.2rem]" />
                                </div>
                            </button>
                        </form>
                    </div>
                </nav>

                <div className="hidden md:flex mt-auto flex-col items-center gap-6">
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
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden bg-background pb-32 md:pb-0 pt-0 custom-scrollbar">
                {children}
            </main>
        </div>
    );
}


