"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Send, MoreVertical, Paperclip, Check, CheckCheck, UserPlus, User as UserIcon, Plus, Layout, MousePointer2, LinkIcon, Zap, AlertCircle, Tag, X, Trash2, Smile, Clock, ArrowLeft } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { sendMessageAction, assignContactAction, createContactAction, getTemplatesAction, sendTemplateMessageAction, updateContactTagsAction, clearChatAction } from "@/app/actions/whatsapp";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const COUNTRY_CODES = [
    { code: "91", label: "🇮🇳 +91" },
    { code: "1", label: "🇺🇸 +1" },
    { code: "44", label: "🇬🇧 +44" },
    { code: "971", label: "🇦🇪 +971" },
    { code: "61", label: "🇦🇺 +61" },
    { code: "49", label: "🇩🇪 +49" },
    { code: "33", label: "🇫🇷 +33" },
    { code: "65", label: "🇸🇬 +65" },
    { code: "60", label: "🇲🇾 +60" },
    { code: "92", label: "🇵🇰 +92" },
    { code: "880", label: "🇧🇩 +880" },
    { code: "234", label: "🇳🇬 +234" },
    { code: "27", label: "🇿🇦 +27" },
    { code: "55", label: "🇧🇷 +55" },
    { code: "52", label: "🇲🇽 +52" },
];

interface User {
    id: string;
    name: string;
    role: string;
}

interface Contact {
    id: string;
    name: string;
    phone: string;
    lastMessage: string;
    time: string;
    unread: number;
    assignedToId: string | null;
    tags?: string[] | null;
    assignedTo?: {
        name: string;
    } | null;
    lastIncomingAt?: string | null;
}

interface Message {
    id: string;
    text: string;
    time: string;
    direction: "INCOMING" | "OUTGOING";
    status: "SENT" | "DELIVERED" | "READ" | "FAILED";
    error?: string | null;
    sender?: {
        name: string;
    } | null;
    mediaType?: "image" | "document" | "audio" | "video" | null;
    mimeType?: string | null;
    mediaId?: string | null;
}

/** Returns true if the WhatsApp 24-hour free messaging window is currently open */
function isWindowOpen(lastIncomingAt: string | null | undefined): boolean {
    if (!lastIncomingAt) return false;
    return Date.now() - new Date(lastIncomingAt).getTime() < 24 * 60 * 60 * 1000;
}

const PREDEFINED_TAGS = [
    { label: "Support", color: "bg-blue-500", text: "text-blue-500" },
    { label: "Enquiry", color: "bg-amber-500", text: "text-amber-500" },
    { label: "Update", color: "bg-purple-500", text: "text-purple-500" },
    { label: "Urgent", color: "bg-rose-500", text: "text-rose-500" },
    { label: "Sales", color: "bg-emerald-500", text: "text-emerald-500" },
];

export default function ChatClient({
    initialContacts,
    currentUser,
    allAgents
}: {
    initialContacts: Contact[];
    currentUser: User;
    allAgents: User[];
}) {
    const [contacts, setContacts] = useState(initialContacts);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(initialContacts[0] || null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

    // New Chat State
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [newChatName, setNewChatName] = useState("");
    const [newChatPhone, setNewChatPhone] = useState("");
    const [selectedCountryCode, setSelectedCountryCode] = useState("91");
    const [isCreatingChat, setIsCreatingChat] = useState(false);

    // Template State
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
    const [templateParams, setTemplateParams] = useState<string[]>([]);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setMessageInput(prev => prev + emojiData.emoji);
        // Focus back to input after selection
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleAttachmentClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Reset so same file can be re-selected
        e.target.value = "";
        if (!file || !selectedContact) return;

        const MAX_SIZE = 16 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            toast.error("File too large. Maximum size is 16MB.");
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading(`Uploading ${file.name}...`);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("contactId", selectedContact.id);
            // Use the typed message as an image/video caption
            if (messageInput.trim()) {
                formData.append("caption", messageInput.trim());
            }

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Upload failed");
            }

            toast.success(`${file.name} sent!`, { id: toastId });
            setMessageInput(""); // clear caption text

            // Refresh messages
            fetch(`/api/messages?contactId=${selectedContact.id}`)
                .then(r => r.json())
                .then(msgs => setMessages(msgs));
        } catch (err: any) {
            toast.error(err.message || "Upload failed", { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    };

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const isAdmin = currentUser.role === 'ADMIN';

    // Fetch messages for selected contact
    useEffect(() => {
        if (selectedContact) {
            // Only show loading spinner if we don't have messages for this contact yet
            // This prevents "flashing" on every contact switch if they were already loaded
            if (messages.length === 0) {
                setIsLoadingMessages(true);
            }

            fetch(`/api/messages?contactId=${selectedContact.id}`)
                .then(res => res.json())
                .then(data => {
                    setMessages(data);
                    setIsLoadingMessages(false);
                    // Force immediate scroll for first load
                    setTimeout(scrollToBottom, 100);
                });
        }
    }, [selectedContact]);

    // Polling for new contacts and messages
    useEffect(() => {
        const pollInterval = setInterval(() => {
            fetch('/api/contacts')
                .then(res => res.json())
                .then(data => {
                    setContacts(data);
                    if (selectedContact) {
                        const updatedSelected = data.find((c: Contact) => c.id === selectedContact.id);
                        if (updatedSelected) {
                            setSelectedContact(prev => ({ ...prev!, ...updatedSelected }));
                        }
                    }
                });

            if (selectedContact) {
                fetch(`/api/messages?contactId=${selectedContact.id}`)
                    .then(res => res.json())
                    .then(data => {
                        setMessages(data);
                    });
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [selectedContact]);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedContact) return;

        const tempId = Date.now().toString();
        const newMsg: Message = {
            id: tempId,
            text: messageInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            direction: "OUTGOING",
            status: "SENT",
            sender: { name: currentUser.name }
        };

        setMessages(prev => [...prev, newMsg]);
        setMessageInput("");

        const result = await sendMessageAction(selectedContact.id, messageInput);

        if (!result.success) {
            toast.error(result.error || "Failed to send message");
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const handleAssign = async (contactId: string, agentId: string | null) => {
        const result = await assignContactAction(contactId, agentId);
        if (result.success) {
            toast.success(agentId ? "Assigned successfully" : "Unassigned successfully");
            setContacts(prev => prev.map(c =>
                c.id === contactId ? { ...c, assignedToId: agentId } : c
            ));
            // Update selected contact if it's the one we just assigned
            if (selectedContact?.id === contactId) {
                setSelectedContact(prev => ({ ...prev!, assignedToId: agentId }));
            }
        } else {
            toast.error("Failed to assign: " + result.error);
        }
    };

    const handleToggleTag = async (tag: string) => {
        if (!selectedContact) return;

        const currentTags = selectedContact.tags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];

        setContacts(prev => prev.map(c =>
            c.id === selectedContact.id ? { ...c, tags: newTags } : c
        ));
        setSelectedContact(prev => ({ ...prev!, tags: newTags }));

        const result = await updateContactTagsAction(selectedContact.id, newTags);
        if (!result.success) {
            toast.error("Failed to update tags: " + result.error);
        }
    };

    const handleClearChat = async () => {
        if (!selectedContact) return;

        setIsClearing(true);
        const result = await clearChatAction(selectedContact.id);
        setIsClearing(false);
        setIsClearConfirmOpen(false);

        if (result.success) {
            setMessages([]);
            toast.success("Chat history cleared");
            setContacts(prev => prev.map(c =>
                c.id === selectedContact.id ? { ...c, lastMessage: "Chat history cleared" } : c
            ));
        } else {
            toast.error("Failed to clear: " + result.error);
        }
    };

    const handleCreateChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChatName || !newChatPhone) return;

        setIsCreatingChat(true);
        const fullPhone = `${selectedCountryCode}${newChatPhone.replace(/\D/g, "")}`;
        const result = await createContactAction({ name: newChatName, phone: fullPhone });
        setIsCreatingChat(false);

        if (result.success) {
            toast.success(result.message || "Chat created successfully");

            // Fix: Use type-safe assignment with required properties
            const newContactData = result.contact as any;
            const newContact: Contact = {
                id: newContactData.id,
                name: newContactData.name || "Unknown",
                phone: newContactData.phone,
                lastMessage: newContactData.lastMessage || "No messages yet",
                time: "Just now",
                unread: 0,
                assignedToId: newContactData.assignedToId || null,
                tags: newContactData.tags || [],
            };

            setContacts(prev => [newContact, ...prev]);
            setSelectedContact(newContact);
            setIsMobileChatOpen(true);
            setIsNewChatOpen(false);
            setNewChatName("");
            setNewChatPhone("");

            // Auto-open templates for newly created chat
            handleOpenTemplates();
        } else {
            toast.error("Error: " + result.error);
        }
    };

    const handleOpenTemplates = async () => {
        setIsTemplatesOpen(true);
        setIsLoadingTemplates(true);
        try {
            const result = await getTemplatesAction();
            if (result.success) {
                setTemplates(result.templates || []);
            }
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const handleSendTemplate = async () => {
        if (!selectedContact || !selectedTemplate) return;

        setIsTemplatesOpen(false);
        const result = await sendTemplateMessageAction(selectedContact.id, selectedTemplate.name, templateParams);
        if (result.success) {
            toast.success("Template sent!");
            setSelectedTemplate(null);
            setTemplateParams([]);
            // Immediate pulse refresh
            fetch(`/api/messages?contactId=${selectedContact.id}`)
                .then(res => res.json())
                .then(data => setMessages(data));
        } else {
            toast.error(result.error || "Failed to send template");
        }
    };

    const filteredContacts = contacts.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm) ||
            (c.tags && c.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

        if (!matchesSearch) return false;

        // Admins see everything
        if (isAdmin) return true;

        // Agents see only their assigned contacts OR unassigned contacts
        return c.assignedToId === currentUser.id || c.assignedToId === null;
    });

    return (
        <div className="flex h-full bg-background font-sans overflow-hidden">
            {/* Column 2: Contacts List */}
            <div className={`w-full md:w-[320px] lg:w-[400px] flex-col border-r border-border bg-white shrink-0 ${isMobileChatOpen ? 'hidden md:flex' : 'flex'} transition-all`}>
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-4xl font-black tracking-tighter text-foreground">Chats</h1>

                        <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl h-12 px-6 shadow-glow transition-all active:scale-95 flex items-center gap-2">
                                    <Plus className="w-5 h-5 stroke-[3px]" />
                                    New Chat
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white border-border rounded-[2.5rem] p-10 max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-3xl font-black tracking-tighter">Start Conversation</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreateChat} className="space-y-6 pt-4">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Contact Name</label>
                                        <Input
                                            placeholder="Recipient Full Name"
                                            value={newChatName}
                                            onChange={(e) => setNewChatName(e.target.value)}
                                            className="h-14 bg-secondary/50 border-none rounded-2xl px-6 font-bold text-foreground"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">WhatsApp Number</label>
                                        <div className="flex gap-3">
                                            <select
                                                value={selectedCountryCode}
                                                onChange={(e) => setSelectedCountryCode(e.target.value)}
                                                className="h-14 bg-secondary/50 border-none rounded-2xl px-4 font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer appearance-none shrink-0 min-w-[100px]"
                                            >
                                                {COUNTRY_CODES.map(c => (
                                                    <option key={c.code} value={c.code}>{c.label}</option>
                                                ))}
                                            </select>
                                            <Input
                                                placeholder="9876543210"
                                                value={newChatPhone}
                                                onChange={(e) => setNewChatPhone(e.target.value)}
                                                className="h-14 bg-secondary/50 border-none rounded-2xl px-6 font-bold text-foreground flex-1"
                                                required
                                            />
                                        </div>
                                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter italic text-center">Number will be combined with country code automatically</p>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isCreatingChat}
                                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-primary-foreground shadow-glow active:scale-95 transition-all mt-4"
                                    >
                                        {isCreatingChat ? "Initializing..." : "Create & Send Template"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Find conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-14 bg-secondary/50 border-none rounded-2xl focus-visible:ring-primary/20 transition-all text-sm pl-14 pr-6 font-medium shadow-inner"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 px-4">
                    <div className="space-y-4 pb-8">
                        {filteredContacts.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground text-xs font-bold uppercase tracking-[0.2em] opacity-40 italic">
                                No active discussions
                            </div>
                        ) : (
                            filteredContacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    onClick={() => {
                                        setSelectedContact(contact);
                                        setIsMobileChatOpen(true);
                                    }}
                                    className={`relative p-6 cursor-pointer transition-all duration-300 rounded-[2rem] group border ${selectedContact?.id === contact.id
                                        ? "bg-white shadow-elevated border-border"
                                        : "bg-transparent border-transparent hover:bg-secondary/30"
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        <div className="relative shrink-0">
                                            <Avatar className="h-14 w-14 rounded-2xl ring-2 ring-background shadow-premium">
                                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xl font-black">
                                                    {contact.name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            {isWindowOpen(contact.lastIncomingAt) ? (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background shadow-sm animate-pulse" />
                                            ) : contact.assignedToId ? (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-background shadow-sm flex items-center justify-center">
                                                    <Clock className="w-2.5 h-2.5 text-white" />
                                                </div>
                                            ) : (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background shadow-sm animate-pulse" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-extrabold text-[15px] truncate text-foreground">{contact.name}</p>
                                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-60 shrink-0">{contact.time}</span>
                                            </div>

                                            {!contact.assignedToId ? (
                                                <div className="mt-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAssign(contact.id, currentUser.id);
                                                        }}
                                                        className="h-8 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-[10px] font-black uppercase tracking-widest border border-primary/20 transition-all w-full"
                                                    >
                                                        Attend Chat
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <p className={`text-sm truncate font-medium leading-tight ${selectedContact?.id === contact.id ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                                                        {contact.lastMessage}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {contact.tags?.map(tag => {
                                                            const tagConfig = PREDEFINED_TAGS.find(t => t.label === tag);
                                                            return (
                                                                <span
                                                                    key={tag}
                                                                    className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${tagConfig?.color || 'bg-secondary'} text-white shadow-sm`}
                                                                >
                                                                    {tag}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {contact.unread > 0 && (
                                                <div className="absolute top-1/2 -translate-y-1/2 right-6 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-glow">
                                                    <span className="text-[10px] font-black text-primary-foreground">{contact.unread}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {selectedContact?.id === contact.id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary rounded-r-full" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Column 3: Chat Window */}
            <div className={`flex-1 flex-col bg-secondary/20 relative min-h-0 overflow-hidden ${isMobileChatOpen ? 'flex' : 'hidden md:flex'}`}>
                {selectedContact ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-20 border-b border-border flex items-center justify-between px-4 md:px-10 bg-white/50 backdrop-blur-xl z-10 shrink-0">
                            <div className="flex items-center gap-3 md:gap-5">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="md:hidden rounded-xl h-10 w-10 text-muted-foreground hover:bg-secondary/80 mr-1 shrink-0"
                                    onClick={() => setIsMobileChatOpen(false)}
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </Button>
                                <Avatar className="h-12 w-12 md:h-14 md:w-14 rounded-2xl shadow-premium shrink-0">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-black uppercase">{selectedContact.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <h2 className="font-black text-xl md:text-2xl tracking-tighter text-foreground truncate">{selectedContact.name}</h2>
                                    <div className="flex items-center gap-2 md:gap-3 mt-1 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            {selectedContact.tags?.map(tag => {
                                                const tagConfig = PREDEFINED_TAGS.find(t => t.label === tag);
                                                return (
                                                    <span
                                                        key={tag}
                                                        className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${tagConfig?.color || 'bg-secondary'} text-white shadow-sm`}
                                                    >
                                                        {tag}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[10px] md:text-xs text-muted-foreground font-black uppercase tracking-widest opacity-60 hidden sm:block truncate">Verified Line</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-4">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 md:h-12 md:w-12 bg-secondary/50 text-foreground transition-all hover:bg-secondary shrink-0">
                                            <Tag className="w-4 h-4 md:w-5 md:h-5" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white border-border rounded-[2.5rem] p-10 max-sm:w-[90vw] max-w-sm">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black tracking-tighter">Categorize Chat</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid grid-cols-1 gap-3 mt-4">
                                            {PREDEFINED_TAGS.map(tag => {
                                                const isActive = selectedContact.tags?.includes(tag.label);
                                                return (
                                                    <button
                                                        key={tag.label}
                                                        onClick={() => handleToggleTag(tag.label)}
                                                        className={`flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${isActive
                                                            ? `border-primary bg-primary/5`
                                                            : 'border-transparent bg-secondary/30 hover:bg-secondary/50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-3 rounded-full ${tag.color}`} />
                                                            <span className="font-black uppercase tracking-widest text-xs text-foreground">{tag.label}</span>
                                                        </div>
                                                        {isActive && <Check className="w-4 h-4 text-primary stroke-[4px]" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <Dialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 md:h-12 md:w-12 bg-secondary/50 text-foreground transition-all hover:bg-secondary hover:text-destructive shrink-0">
                                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-white border-border rounded-[2.5rem] p-10 max-w-md">
                                        <DialogHeader>
                                            <DialogTitle className="text-3xl font-black tracking-tighter text-destructive">Wipe History?</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-6 pt-4 text-center">
                                            <div className="w-20 h-20 bg-destructive/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                                <Trash2 className="w-10 h-10 text-destructive" />
                                            </div>
                                            <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                                                This will permanently delete all messages for <span className="text-foreground font-black">@{selectedContact.name}</span>. This action is irreversible.
                                            </p>
                                            <div className="flex gap-4 pt-2">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setIsClearConfirmOpen(false)}
                                                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-muted-foreground hover:bg-secondary transition-all"
                                                >
                                                    Abort
                                                </Button>
                                                <Button
                                                    onClick={handleClearChat}
                                                    disabled={isClearing}
                                                    className="flex-1 h-14 rounded-2xl bg-destructive text-white font-black uppercase tracking-widest shadow-glow-destructive active:scale-95 transition-all"
                                                >
                                                    {isClearing ? "Wiping..." : "Confirm Wipe"}
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 md:h-12 md:w-12 bg-secondary/50 text-foreground transition-all hover:bg-secondary shrink-0">
                                    <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                                </Button>
                                {(isAdmin || selectedContact.assignedToId === currentUser.id) && (
                                    <div className="relative shrink-0 hidden md:block">
                                        <select
                                            className="h-10 md:h-12 w-10 md:min-w-[160px] lg:min-w-[200px] rounded-xl md:rounded-2xl bg-secondary/50 border-none md:pl-6 md:pr-12 text-transparent md:text-[10px] text-center md:text-left font-black uppercase tracking-widest md:text-foreground focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer appearance-none transition-all hover:bg-secondary truncate"
                                            value={selectedContact.assignedToId || ""}
                                            onChange={(e) => handleAssign(selectedContact.id, e.target.value || null)}
                                        >
                                            <option value="">Assign To...</option>
                                            {allAgents.map(agent => (
                                                <option key={agent.id} value={agent.id}>{agent.name} ({agent.role})</option>
                                            ))}
                                        </select>
                                        <UserIcon className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea ref={scrollRef} className="flex-1 min-h-0 p-6">
                            <div className="max-w-4xl mx-auto space-y-4 pb-6">
                                {isLoadingMessages ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="flex gap-2">
                                            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Establishing Secure Sync</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.direction === "OUTGOING" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-6 duration-700 ease-out`}
                                        >
                                            <div className="flex flex-col gap-2 max-w-[70%]">
                                                <div
                                                    className={`px-6 py-4 rounded-3xl shadow-premium relative ${msg.direction === "OUTGOING"
                                                        ? msg.status === "FAILED"
                                                            ? "bg-destructive/10 text-destructive border border-destructive/20 font-extrabold rounded-tr-none text-base"
                                                            : "bg-primary text-primary-foreground font-extrabold rounded-tr-none shadow-glow text-base"
                                                        : "bg-white border border-border text-foreground font-medium rounded-tl-none"
                                                        }`}
                                                    title={msg.error || undefined}
                                                >
                                                    {/* Media or text content */}
                                                    {msg.mediaType === 'image' ? (
                                                        <div className="overflow-hidden rounded-2xl -mx-2 -mt-1 mb-2">
                                                            {msg.mediaId ? (
                                                                <img
                                                                    src={`/api/media-proxy?mediaId=${encodeURIComponent(msg.mediaId)}`}
                                                                    alt={msg.text}
                                                                    className="w-full max-w-[280px] rounded-xl object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-64 h-40 bg-white/10 rounded-xl flex items-center justify-center">
                                                                    <span className="text-3xl">🖼️</span>
                                                                </div>
                                                            )}
                                                            {msg.text && msg.text !== 'Image' && (
                                                                <p className="leading-relaxed mt-2 text-sm">{msg.text}</p>
                                                            )}
                                                        </div>
                                                    ) : msg.mediaType === 'document' ? (
                                                        <div className={`flex items-center gap-3 py-1 px-1 rounded-xl ${msg.direction === 'OUTGOING' ? 'bg-white/10' : 'bg-secondary/30'}`}>
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${msg.direction === 'OUTGOING' ? 'bg-white/20' : 'bg-primary/10'}`}>
                                                                <Paperclip className={`w-5 h-5 ${msg.direction === 'OUTGOING' ? 'text-white' : 'text-primary'}`} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold truncate text-sm leading-tight">{msg.text}</p>
                                                                <p className={`text-[10px] uppercase tracking-wider font-black opacity-60 ${msg.direction === 'OUTGOING' ? 'text-white' : 'text-muted-foreground'}`}>
                                                                    {msg.mimeType?.split('/')[1] ?? 'Document'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : msg.mediaType === 'audio' ? (
                                                        <div className={`flex items-center gap-3 py-1 px-1 rounded-xl ${msg.direction === 'OUTGOING' ? 'bg-white/10' : 'bg-secondary/30'}`}>
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${msg.direction === 'OUTGOING' ? 'bg-white/20' : 'bg-primary/10'}`}>
                                                                <span className={`text-xl ${msg.direction === 'OUTGOING' ? 'text-white' : 'text-primary'}`}>🎵</span>
                                                            </div>
                                                            <p className="font-bold truncate text-sm">{msg.text}</p>
                                                        </div>
                                                    ) : msg.mediaType === 'video' ? (
                                                        <div className={`flex items-center gap-3 py-1 px-1 rounded-xl ${msg.direction === 'OUTGOING' ? 'bg-white/10' : 'bg-secondary/30'}`}>
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${msg.direction === 'OUTGOING' ? 'bg-white/20' : 'bg-primary/10'}`}>
                                                                <span className={`text-xl ${msg.direction === 'OUTGOING' ? 'text-white' : 'text-primary'}`}>🎬</span>
                                                            </div>
                                                            <p className="font-bold truncate text-sm">{msg.text}</p>
                                                        </div>
                                                    ) : (
                                                        <p className="leading-relaxed">{msg.text}</p>
                                                    )}
                                                    {msg.status === "FAILED" && (
                                                        <div className="absolute -right-2 -top-2 bg-destructive text-white rounded-full p-1 shadow-lg">
                                                            <AlertCircle className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`flex flex-col ${msg.direction === "OUTGOING" ? "items-end" : "items-start"}`}>
                                                    <div className={`flex items-center gap-3 px-4 ${msg.direction === "OUTGOING" ? "justify-end" : "justify-start"}`}>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">{msg.time}</span>
                                                        {msg.direction === "OUTGOING" && msg.status !== "FAILED" && (
                                                            <div className="flex">
                                                                {msg.status === "READ" ? (
                                                                    <CheckCheck className="w-4 h-4 text-primary" />
                                                                ) : (
                                                                    <Check className="w-4 h-4 text-muted-foreground/20" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {msg.status === "FAILED" && (
                                                        <p className="px-4 text-[10px] font-black uppercase tracking-tighter text-destructive mt-1 max-w-xs truncate">
                                                            {msg.error || "Delivery failed"}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>

                        {/* Bottom Input Area */}
                        <div className="p-6 bg-gradient-to-t from-secondary/50 via-transparent to-transparent shrink-0 relative">
                            {!selectedContact.assignedToId ? (
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-primary/20 shadow-premium gap-4 animate-in zoom-in-95">
                                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                                            <UserPlus className="w-8 h-8 text-primary" />
                                        </div>
                                        <div className="text-center">
                                            <h4 className="font-black text-xl tracking-tighter text-foreground">Communication Locked</h4>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-1">Attend this chat to start responding</p>
                                        </div>
                                        <Button
                                            onClick={() => handleAssign(selectedContact.id, currentUser.id)}
                                            className="bg-primary text-primary-foreground font-black uppercase tracking-widest px-10 h-14 rounded-2xl shadow-glow active:scale-95 transition-all mt-2"
                                        >
                                            Attend Conversation
                                        </Button>
                                    </div>
                                </div>
                            ) : !isWindowOpen(selectedContact.lastIncomingAt) ? (
                                /* 24-hour window closed — only templates allowed */
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex flex-col items-center justify-center p-8 bg-amber-50 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-amber-300/60 shadow-premium gap-4 animate-in zoom-in-95">
                                        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
                                            <Clock className="w-8 h-8 text-amber-500" />
                                        </div>
                                        <div className="text-center">
                                            <h4 className="font-black text-xl tracking-tighter text-amber-700">24-Hour Window Closed</h4>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80 mt-1 max-w-xs leading-relaxed">
                                                Customer hasn&apos;t replied in over 24 hrs. Send a template to re-open the conversation.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleOpenTemplates}
                                            className="bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest px-10 h-14 rounded-2xl active:scale-95 transition-all mt-2 shadow-lg flex items-center gap-3"
                                        >
                                            <Zap className="w-5 h-5" />
                                            Send Template
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto relative group">
                                    <Input
                                        ref={inputRef}
                                        placeholder="Communicate with precision..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                        className="h-14 md:h-16 bg-white border border-border rounded-2xl pl-[90px] md:pl-28 pr-[110px] md:pr-[130px] text-foreground font-bold shadow-elevated focus-visible:ring-primary/10 transition-all text-sm md:text-base placeholder:text-xs md:placeholder:text-sm text-ellipsis"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 md:h-10 md:w-10 text-muted-foreground hover:text-primary transition-all">
                                                    <Smile className="w-5 h-5" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0 border-none bg-transparent shadow-none mb-4" side="top" align="start">
                                                <EmojiPicker
                                                    onEmojiClick={onEmojiClick}
                                                    autoFocusSearch={false}
                                                    theme={Theme.LIGHT}
                                                    width={350}
                                                    height={450}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleAttachmentClick}
                                            disabled={isUploading}
                                            className="h-8 w-8 md:h-10 md:w-10 rounded-xl hover:bg-primary/5 text-muted-foreground transition-all active:scale-90 disabled:opacity-50"
                                        >
                                            {isUploading ? (
                                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                            ) : (
                                                <Paperclip className="w-5 h-5" />
                                            )}
                                        </Button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleOpenTemplates}
                                            className="h-10 w-10 md:h-12 md:w-12 rounded-xl hover:bg-primary/5 text-primary transition-all active:scale-90 group"
                                        >
                                            <Zap className="w-5 h-5 fill-primary/10 group-hover:fill-primary/20 transition-all" />
                                        </Button>

                                        <Button
                                            size="icon"
                                            onClick={handleSendMessage}
                                            disabled={!messageInput.trim()}
                                            className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary text-primary-foreground shadow-glow active:scale-90 transition-all shrink-0"
                                        >
                                            <Send className="w-5 h-5 stroke-[4px]" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Template Dialog — hoisted so it works from any window state */}
                        <Dialog open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
                            <DialogContent className="bg-white border-border rounded-[3.5rem] p-12 max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border-none overflow-hidden">
                                <DialogHeader>
                                    <DialogTitle className="text-4xl font-black tracking-tight mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                        {selectedTemplate ? "Configure Placeholders" : "Meta-Approved Templates"}
                                    </DialogTitle>
                                </DialogHeader>

                                {selectedTemplate ? (
                                    <div className="flex flex-col h-full overflow-hidden">
                                        <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="p-10 bg-secondary/10 rounded-[2.5rem] border border-primary/5">
                                                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary/40 mb-4">Live Preview (Logical Reconstruction)</h4>
                                                <p className="text-xl font-bold text-foreground/80 leading-relaxed italic">
                                                    {(() => {
                                                        let text = (selectedTemplate.components as any[]).find(c => c.type === 'BODY')?.text || "";
                                                        templateParams.forEach((val, idx) => {
                                                            text = text.replace(`{{${idx + 1}}}`, val || `{{${idx + 1}}}`);
                                                        });
                                                        return text;
                                                    })()}
                                                </p>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">Required Parameters</h4>
                                                    <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase italic">{templateParams.length} Fields Detected</span>
                                                </div>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {templateParams.map((param, idx) => (
                                                        <div key={idx} className="relative group">
                                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary transition-all group-focus-within:bg-primary group-focus-within:text-white">
                                                                {idx + 1}
                                                            </div>
                                                            <Input
                                                                placeholder={`Enter value for placeholder {{${idx + 1}}}...`}
                                                                value={param}
                                                                onChange={(e) => {
                                                                    const newParams = [...templateParams];
                                                                    newParams[idx] = e.target.value;
                                                                    setTemplateParams(newParams);
                                                                }}
                                                                className="h-16 bg-secondary/30 border-none rounded-2xl pl-20 pr-8 font-bold text-foreground focus-visible:ring-primary/20 transition-all text-sm"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-12 flex gap-4 shrink-0">
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setSelectedTemplate(null);
                                                    setTemplateParams([]);
                                                }}
                                                className="flex-1 h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-muted-foreground hover:bg-secondary transition-all"
                                            >
                                                Back to Vault
                                            </Button>
                                            <Button
                                                onClick={handleSendTemplate}
                                                className="flex-[2] h-16 rounded-[1.5rem] bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-glow active:scale-95 transition-all"
                                            >
                                                Personalize &amp; Dispatch
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <ScrollArea className="flex-1 pr-6 -mr-4">
                                        <div className="grid grid-cols-1 gap-6 py-6 font-sans">
                                            {isLoadingTemplates ? (
                                                <div className="py-24 text-center">
                                                    <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                                    <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/40">Synchronizing Vault</p>
                                                </div>
                                            ) : templates.length === 0 ? (
                                                <div className="py-24 text-center text-muted-foreground font-black uppercase tracking-widest text-xs opacity-50 italic">
                                                    No approved campaign materials found
                                                </div>
                                            ) : (
                                                templates.map((tpl) => (
                                                    <div
                                                        key={tpl.id}
                                                        onClick={() => {
                                                            const bodyText = (tpl.components as any[]).find(c => c.type === 'BODY')?.text || "";
                                                            const matches = bodyText.match(/{{(\d+)}}/g);
                                                            let maxIndex = 0;
                                                            if (matches) {
                                                                matches.forEach((m: string) => {
                                                                    const idx = parseInt(m.match(/\d+/)![0]);
                                                                    if (idx > maxIndex) maxIndex = idx;
                                                                });
                                                            }

                                                            if (maxIndex > 0) {
                                                                setSelectedTemplate(tpl);
                                                                setTemplateParams(new Array(maxIndex).fill(""));
                                                            } else {
                                                                setSelectedTemplate(tpl);
                                                                setTemplateParams([]);
                                                            }
                                                        }}
                                                        className="group relative p-8 bg-secondary/20 rounded-[2.5rem] border border-transparent hover:border-primary/10 hover:bg-white transition-all cursor-pointer shadow-premium hover:shadow-glow"
                                                    >
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div>
                                                                <h4 className="font-black text-xl text-foreground group-hover:text-primary transition-colors">{tpl.name}</h4>
                                                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 mt-1 block">{tpl.category} • {tpl.language}</span>
                                                            </div>
                                                            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                                <Zap className="w-6 h-6 text-primary fill-primary/20" />
                                                            </div>
                                                        </div>
                                                        <div className="p-6 bg-secondary/10 rounded-2xl border border-white/40 mb-6 group-hover:bg-primary/5 group-hover:border-primary/5 transition-all">
                                                            <p className="text-[15px] font-semibold text-foreground/80 leading-relaxed italic">
                                                                {(tpl.components as any[]).find(c => c.type === 'BODY')?.text || "Metadata suppressed"}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2.5">
                                                            {(tpl.components as any[]).find(c => c.type === 'BUTTONS')?.buttons?.map((btn: any, i: number) => (
                                                                <div key={i} className="px-4 py-1.5 bg-primary/5 rounded-full border border-primary/10 text-[10px] font-black uppercase text-primary/70 flex items-center gap-2">
                                                                    {btn.type === 'URL' ? <LinkIcon className="w-3 h-3" /> : <MousePointer2 className="w-3 h-3" />}
                                                                    {btn.text}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                )}
                            </DialogContent>
                        </Dialog>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 gap-10">
                        <div className="w-48 h-48 bg-primary/5 rounded-[4.5rem] flex items-center justify-center ring-2 ring-primary/5 shadow-glow animate-in zoom-in-75 duration-1000 relative">
                            <Zap className="w-20 h-20 text-primary/10" />
                            <div className="absolute inset-0 bg-primary/5 rounded-[4.5rem] animate-ping duration-[3000ms]" />
                        </div>
                        <div className="text-center space-y-4">
                            <h3 className="text-6xl font-black tracking-tighter text-foreground bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-transparent">Select Desk</h3>
                            <p className="text-sm font-black uppercase tracking-[0.6em] text-muted-foreground/30">Secure High-Priority Communication</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function MessageIcons(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
    );
}
