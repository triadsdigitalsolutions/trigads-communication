"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, User as UserIcon, Shield, Trash2, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createUserAction, deleteUserAction } from "@/app/actions/users";

interface User {
    id: string;
    name: string | null;
    email: string | null;
    role: "ADMIN" | "AGENT" | "SALES";
    createdAt: string;
}

export default function UserList({ initialUsers }: { initialUsers: User[] }) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"AGENT" | "SALES">("AGENT");

    const filteredUsers = users.filter((u) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAddingUser(true);

        const result = await createUserAction({ name, email, password, role });

        if (result.success) {
            toast.success("User created successfully");
            setUsers([result.user as User, ...users]);
            setIsOpen(false);
            // Reset form
            setName("");
            setEmail("");
            setPassword("");
            setRole("AGENT");
        } else {
            toast.error("Error: " + result.error);
        }
        setIsAddingUser(false);
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;

        const result = await deleteUserAction(id);
        if (result.success) {
            toast.success("User deleted");
            setUsers(users.filter((u) => u.id !== id));
        } else {
            toast.error("Error: " + result.error);
        }
    };

    return (
        <div className="space-y-6 w-full">
            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-10 h-12 bg-white border-border rounded-2xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-12 rounded-2xl px-6 gap-2 font-bold shadow-lg shadow-primary/20 text-primary-foreground">
                            <Plus className="w-5 h-5" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-border rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Create New Account</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                                <Input required value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl bg-secondary/50 border-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl bg-secondary/50 border-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Security Password</label>
                                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl bg-secondary/50 border-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">System Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as any)}
                                    className="w-full h-12 rounded-xl bg-secondary/50 border-none px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                                >
                                    <option value="AGENT">Support Agent</option>
                                    <option value="SALES">Sales Representative</option>
                                </select>
                            </div>
                            <Button type="submit" disabled={isAddingUser} className="w-full h-12 rounded-xl mt-4 font-bold text-primary-foreground">
                                {isAddingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Create"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white shadow-elevated border border-border rounded-[2.5rem] overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-border bg-secondary/30">
                            <th className="p-8 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Identity</th>
                            <th className="p-8 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Department</th>
                            <th className="p-8 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Joined</th>
                            <th className="p-8 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-b border-border hover:bg-primary/5 transition-colors group">
                                <td className="p-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-lg">
                                            {user.name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-[15px] leading-tight text-foreground">{user.name}</p>
                                            <p className="text-xs text-muted-foreground/60 mt-1 font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-8">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary rounded-full border border-border">
                                        <Shield className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70">{user.role}</span>
                                    </div>
                                </td>
                                <td className="p-8">
                                    <span className="text-xs font-bold text-muted-foreground/60 uppercase">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                </td>
                                <td className="p-8 text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="rounded-2xl h-12 w-12 hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
