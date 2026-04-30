"use client";

import { useState, useMemo } from "react";
import {
    Search, Plus, Pencil, Trash2, Phone, User,
    Users, X, Check, Loader2, BookUser
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
import {
    createContactAction,
    updateContactAction,
    deleteContactAction,
} from "@/app/actions/whatsapp";

interface Contact {
    id: string;
    name: string;
    phone: string;
    assignedToId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export default function ContactsClient({ initialContacts }: { initialContacts: Contact[] }) {
    const [contacts, setContacts] = useState<Contact[]>(initialContacts);
    const [search, setSearch] = useState("");

    // Add dialog
    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({ name: "", phone: "" });
    const [isAdding, setIsAdding] = useState(false);

    // Edit dialog
    const [editContact, setEditContact] = useState<Contact | null>(null);
    const [editForm, setEditForm] = useState({ name: "", phone: "" });
    const [isEditing, setIsEditing] = useState(false);

    // Delete dialog
    const [deleteContact, setDeleteContact] = useState<Contact | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return contacts;
        return contacts.filter(
            c =>
                c.name?.toLowerCase().includes(q) ||
                c.phone?.includes(q)
        );
    }, [contacts, search]);

    /* ---- ADD ---- */
    const openAdd = () => {
        setAddForm({ name: "", phone: "" });
        setAddOpen(true);
    };

    const handleAdd = async () => {
        if (!addForm.name.trim() || !addForm.phone.trim()) {
            toast.error("Name and phone are required");
            return;
        }
        setIsAdding(true);
        const result = await createContactAction({ name: addForm.name.trim(), phone: addForm.phone.trim() });
        setIsAdding(false);
        if (result.success) {
            const newContact = (result as any).contact as Contact;
            setContacts(prev =>
                [...prev.filter(c => c.id !== newContact.id), newContact]
                    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
            );
            toast.success("Contact added successfully");
            setAddOpen(false);
        } else {
            toast.error(result.error || "Failed to add contact");
        }
    };

    /* ---- EDIT ---- */
    const openEdit = (contact: Contact) => {
        setEditContact(contact);
        setEditForm({ name: contact.name, phone: contact.phone });
    };

    const handleEdit = async () => {
        if (!editContact) return;
        if (!editForm.name.trim() || !editForm.phone.trim()) {
            toast.error("Name and phone are required");
            return;
        }
        setIsEditing(true);
        const result = await updateContactAction(editContact.id, {
            name: editForm.name.trim(),
            phone: editForm.phone.trim(),
        });
        setIsEditing(false);
        if (result.success) {
            setContacts(prev =>
                prev
                    .map(c =>
                        c.id === editContact.id
                            ? { ...c, name: editForm.name.trim(), phone: editForm.phone.trim().replace(/\D/g, "") }
                            : c
                    )
                    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
            );
            toast.success("Contact updated");
            setEditContact(null);
        } else {
            toast.error(result.error || "Failed to update contact");
        }
    };

    /* ---- DELETE ---- */
    const handleDelete = async () => {
        if (!deleteContact) return;
        setIsDeleting(true);
        const result = await deleteContactAction(deleteContact.id);
        setIsDeleting(false);
        if (result.success) {
            setContacts(prev => prev.filter(c => c.id !== deleteContact.id));
            toast.success("Contact deleted");
            setDeleteContact(null);
        } else {
            toast.error(result.error || "Failed to delete contact");
        }
    };

    /* ---- RENDER ---- */
    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Contacts
                    </h1>
                    <p className="text-muted-foreground mt-2 text-base">
                        {contacts.length} contact{contacts.length !== 1 ? "s" : ""} in your phonebook
                    </p>
                </div>
                <Button
                    onClick={openAdd}
                    className="rounded-xl h-12 px-6 font-black shadow-glow shadow-primary/20 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5 mr-2 stroke-[3px]" />
                    Add Contact
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                    placeholder="Search by name or phone…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-11 h-12 bg-secondary/50 border-none rounded-2xl focus:bg-background transition-all font-medium"
                />
                {search && (
                    <button
                        onClick={() => setSearch("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Contact Grid */}
            {filtered.length === 0 ? (
                <div className="py-28 text-center border-2 border-dashed border-border rounded-[3rem] bg-secondary/20">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <BookUser className="w-10 h-10 text-primary opacity-40" />
                    </div>
                    <p className="text-muted-foreground font-black uppercase tracking-widest opacity-40">
                        {search ? "No contacts match your search" : "No contacts yet. Add your first one!"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(contact => (
                        <ContactCard
                            key={contact.id}
                            contact={contact}
                            onEdit={() => openEdit(contact)}
                            onDelete={() => setDeleteContact(contact)}
                        />
                    ))}
                </div>
            )}

            {/* Add Dialog */}
            <Dialog open={addOpen} onOpenChange={open => !isAdding && setAddOpen(open)}>
                <DialogContent className="rounded-[2rem] border-border bg-white/95 backdrop-blur-2xl p-8 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tighter">Add New Contact</DialogTitle>
                        <DialogDescription className="text-sm pt-1">
                            Enter the contact's name and WhatsApp phone number.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Full Name</label>
                            <Input
                                placeholder="e.g. John Smith"
                                value={addForm.name}
                                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                                className="h-12 bg-secondary/50 border-none rounded-2xl px-5 font-medium"
                                onKeyDown={e => e.key === "Enter" && handleAdd()}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Phone Number</label>
                            <Input
                                placeholder="e.g. 919876543210"
                                value={addForm.phone}
                                onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                                className="h-12 bg-secondary/50 border-none rounded-2xl px-5 font-medium"
                                onKeyDown={e => e.key === "Enter" && handleAdd()}
                            />
                            <p className="text-[10px] text-muted-foreground/50 font-medium pl-1">Include country code without +  (e.g. 91 for India)</p>
                        </div>
                    </div>
                    <DialogFooter className="mt-6 flex gap-3">
                        <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={isAdding} className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-muted-foreground">
                            Cancel
                        </Button>
                        <Button onClick={handleAdd} disabled={isAdding} className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest shadow-glow">
                            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Contact"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editContact} onOpenChange={open => !open && !isEditing && setEditContact(null)}>
                <DialogContent className="rounded-[2rem] border-border bg-white/95 backdrop-blur-2xl p-8 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tighter">Edit Contact</DialogTitle>
                        <DialogDescription className="text-sm pt-1">
                            Update the contact's details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Full Name</label>
                            <Input
                                value={editForm.name}
                                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                className="h-12 bg-secondary/50 border-none rounded-2xl px-5 font-medium"
                                onKeyDown={e => e.key === "Enter" && handleEdit()}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Phone Number</label>
                            <Input
                                value={editForm.phone}
                                onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                                className="h-12 bg-secondary/50 border-none rounded-2xl px-5 font-medium"
                                onKeyDown={e => e.key === "Enter" && handleEdit()}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6 flex gap-3">
                        <Button variant="ghost" onClick={() => setEditContact(null)} disabled={isEditing} className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-muted-foreground">
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} disabled={isEditing} className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest shadow-glow">
                            {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deleteContact} onOpenChange={open => !open && !isDeleting && setDeleteContact(null)}>
                <DialogContent className="rounded-[2rem] border-border bg-white/95 backdrop-blur-2xl p-8 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tighter uppercase italic text-destructive">Delete Contact?</DialogTitle>
                        <DialogDescription className="text-sm pt-2">
                            This will permanently delete{" "}
                            <span className="font-black text-foreground">{deleteContact?.name}</span>{" "}
                            and all their chat history. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-8 flex gap-3">
                        <Button variant="ghost" onClick={() => setDeleteContact(null)} disabled={isDeleting} className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-muted-foreground">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 h-12 rounded-2xl bg-destructive text-destructive-foreground font-black uppercase tracking-widest hover:bg-destructive/90"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ContactCard({
    contact,
    onEdit,
    onDelete,
}: {
    contact: Contact;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const initials = (contact.name || "?")
        .split(" ")
        .slice(0, 2)
        .map(w => w[0])
        .join("")
        .toUpperCase();

    const hue = (contact.phone?.charCodeAt(contact.phone.length - 1) || 0) % 360;

    return (
        <div className="group relative bg-white border border-border rounded-[2rem] p-6 shadow-sm hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md"
                    style={{ background: `oklch(0.65 0.18 ${hue})` }}
                >
                    {initials}
                </div>
                <div className="min-w-0">
                    <p className="font-black text-foreground truncate leading-tight">{contact.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest bg-secondary/60 hover:bg-primary hover:text-white transition-all"
                >
                    <Pencil className="w-3 h-3 mr-1.5" /> Edit
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    className="h-9 w-9 rounded-xl bg-destructive/5 text-destructive border border-destructive/10 hover:bg-destructive hover:text-white transition-all"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
}
