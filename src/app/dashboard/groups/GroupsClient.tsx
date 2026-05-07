"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Search, Plus, Trash2, Users, Upload, ChevronLeft, User, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createGroupAction, deleteGroupAction, removeContactFromGroupAction, uploadGroupContactsAction } from "@/app/actions/groups";
import Papa from "papaparse";

interface Contact { id: string; name: string; phone: string; }
interface Group { id: string; name: string; description: string; contactIds: string[]; }

export default function GroupsClient({ initialGroups, contacts }: { initialGroups: Group[], contacts: Contact[] }) {
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [search, setSearch] = useState("");
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    // Create
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: "", description: "" });
    const [isCreating, setIsCreating] = useState(false);

    // Delete
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // CSV Upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return groups;
        return groups.filter(g => g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q));
    }, [groups, search]);

    const handleCreate = async () => {
        if (!createForm.name.trim()) return toast.error("Name is required");
        setIsCreating(true);
        const result = await createGroupAction({ name: createForm.name.trim(), description: createForm.description.trim() });
        setIsCreating(false);
        if (result.success) {
            toast.success("Group created");
            setCreateOpen(false);
            setCreateForm({ name: "", description: "" });
            // Ideally we fetch again, but since it's server revalidated, it will reload on navigation
            // To simulate optimistic update:
            window.location.reload();
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async () => {
        if (!groupToDelete) return;
        setIsDeleting(true);
        const result = await deleteGroupAction(groupToDelete.id);
        setIsDeleting(false);
        if (result.success) {
            toast.success("Group deleted");
            setGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
            if (selectedGroup?.id === groupToDelete.id) setSelectedGroup(null);
            setDeleteOpen(false);
        } else {
            toast.error(result.error);
        }
    };

    const handleRemoveContact = async (contactId: string) => {
        if (!selectedGroup) return;
        const result = await removeContactFromGroupAction(selectedGroup.id, contactId);
        if (result.success) {
            const updated = { ...selectedGroup, contactIds: selectedGroup.contactIds.filter(id => id !== contactId) };
            setSelectedGroup(updated);
            setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
            toast.success("Contact removed from group");
        } else {
            toast.error(result.error);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedGroup) return;

        setIsUploading(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const data = results.data as Record<string, string>[];
                const recipients: { phone: string, name: string }[] = [];

                data.forEach(row => {
                    const phone = row["Phone"] || row["Phone Number"] || row["phone"];
                    if (!phone) return;
                    const cleanPhone = phone.toString().replace(/\D/g, "");
                    const name = row["Name"] || row["name"] || cleanPhone;
                    recipients.push({ phone: cleanPhone, name });
                });

                if (recipients.length === 0) {
                    setIsUploading(false);
                    return toast.error("No valid phone numbers found in CSV");
                }

                const result = await uploadGroupContactsAction(selectedGroup.id, recipients);
                setIsUploading(false);
                if (result.success) {
                    toast.success(`Successfully added ${result.addedCount} new contacts to the group!`);
                    window.location.reload();
                } else {
                    toast.error("Failed to upload: " + result.error);
                }

                if (fileInputRef.current) fileInputRef.current.value = "";
            },
            error: (err) => {
                setIsUploading(false);
                toast.error("CSV Parse Error: " + err.message);
            }
        });
    };

    if (selectedGroup) {
        const groupContacts = contacts.filter(c => selectedGroup.contactIds.includes(c.id));
        return (
            <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
                <Button variant="ghost" onClick={() => setSelectedGroup(null)} className="h-10 px-0 hover:bg-transparent font-black tracking-widest uppercase text-muted-foreground hover:text-foreground transition-all">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back to Groups
                </Button>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-secondary/30 p-6 rounded-[2rem] border border-border">
                    <div>
                        <h1 className="text-3xl font-black">{selectedGroup.name}</h1>
                        <p className="text-muted-foreground mt-1 text-sm">{selectedGroup.description || "No description provided."}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest shadow-glow">
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                            Upload CSV
                        </Button>
                        <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </div>
                </div>

                <div className="bg-white border border-border rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-sm font-black uppercase tracking-widest text-muted-foreground">
                        <Users className="w-4 h-4" /> {groupContacts.length} Contacts in Group
                    </div>

                    {groupContacts.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-border rounded-[2rem] bg-secondary/10">
                            <Users className="w-8 h-8 text-primary opacity-30 mx-auto mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest opacity-40">Group is empty. Upload a CSV to add leads.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {groupContacts.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-4 rounded-2xl border border-border hover:border-primary/30 transition-all">
                                    <div className="min-w-0">
                                        <p className="font-black text-sm truncate">{c.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{c.phone}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveContact(c.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Contact Groups
                    </h1>
                    <p className="text-muted-foreground mt-2 text-base">Organize leads and segments for bulk messaging.</p>
                </div>
                <Button onClick={() => setCreateOpen(true)} className="rounded-xl h-12 px-6 font-black shadow-glow shadow-primary/20">
                    <Plus className="w-5 h-5 mr-2 stroke-[3px]" />
                    Create Group
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input placeholder="Search groups…" value={search} onChange={e => setSearch(e.target.value)} className="pl-11 h-12 bg-secondary/50 border-none rounded-2xl font-medium" />
            </div>

            {filtered.length === 0 ? (
                <div className="py-28 text-center border-2 border-dashed border-border rounded-[3rem] bg-secondary/20">
                    <Users className="w-10 h-10 text-primary opacity-40 mx-auto mb-4" />
                    <p className="text-muted-foreground font-black uppercase tracking-widest opacity-40">No groups found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(group => (
                        <div key={group.id} className="group relative bg-white border border-border rounded-[2rem] p-6 shadow-sm hover:shadow-elevated hover:-translate-y-1 transition-all flex flex-col gap-4 cursor-pointer" onClick={() => setSelectedGroup(group)}>
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Users className="w-5 h-5" />
                                </div>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setGroupToDelete(group); setDeleteOpen(true); }} className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-foreground truncate">{group.name}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{group.description || "No description"}</p>
                            </div>
                            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                                <Badge variant="secondary" className="bg-secondary/60 text-[10px] font-black uppercase">
                                    {group.contactIds?.length || 0} Contacts
                                </Badge>
                                <span className="text-[10px] font-black uppercase text-primary tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    View <ChevronLeft className="w-3 h-3 rotate-180" />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="rounded-[2rem] border-border bg-white p-8 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">New Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <Input placeholder="Group Name (e.g. May Leads)" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} className="h-12 bg-secondary/50 border-none rounded-2xl px-5 font-medium" />
                        <Input placeholder="Description (Optional)" value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} className="h-12 bg-secondary/50 border-none rounded-2xl px-5 font-medium" />
                    </div>
                    <DialogFooter className="mt-6 flex gap-3">
                        <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={isCreating} className="flex-1 rounded-2xl font-black uppercase">Cancel</Button>
                        <Button onClick={handleCreate} disabled={isCreating} className="flex-1 rounded-2xl font-black uppercase shadow-glow">
                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="rounded-[2rem] border-border bg-white p-8 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-destructive">Delete Group?</DialogTitle>
                        <DialogDescription className="text-sm pt-2">
                            This will delete the group container. Your actual contacts will remain safe in the main Contacts list.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-8 flex gap-3">
                        <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={isDeleting} className="flex-1 rounded-2xl font-black uppercase">Cancel</Button>
                        <Button onClick={handleDelete} disabled={isDeleting} className="flex-1 rounded-2xl bg-destructive font-black uppercase text-white hover:bg-destructive/90">
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
