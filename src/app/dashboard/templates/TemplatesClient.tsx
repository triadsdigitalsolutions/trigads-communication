"use client";

import { useState, useRef } from "react";
import { Plus, Globe, Check, Clock, XCircle, Image as ImageIcon, Type, Link as LinkIcon, Phone, MousePointer2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTemplateAction, syncTemplatesAction, deleteTemplateAction } from "@/app/actions/whatsapp";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Template {
    id: string;
    name: string;
    language: string;
    category: string;
    status: "APPROVED" | "PENDING" | "REJECTED";
    components: any[];
    preview: string;
}

export default function TemplatesClient({ initialTemplates }: { initialTemplates: Template[] }) {
    const [templates, setTemplates] = useState(initialTemplates);
    const [isCreating, setIsCreating] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        category: "MARKETING",
        language: "en_US",
        headerType: "NONE", // NONE, TEXT, IMAGE
        headerText: "",
        headerImageUrl: "",
        body: "",
        footer: "",
        buttons: [] as any[],
    });
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const templateImageInputRef = useRef<HTMLInputElement>(null);

    const handleTemplateImageDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            setFormData({ ...formData, headerImageUrl: url });
        } else if (file) {
            toast.error("Please select a valid image file");
        }
    };

    const handleTemplateImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setFormData({ ...formData, headerImageUrl: url });
        }
        // reset input
        e.target.value = "";
    };

    const handleSync = async () => {
        setIsSyncing(true);
        const result = await syncTemplatesAction();
        setIsSyncing(false);
        if (result.success) {
            toast.success("Templates synced with Meta Successfully");
            window.location.reload();
        } else {
            toast.error("Sync failed: " + result.error);
        }
    };

    const addButton = (type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER") => {
        if (formData.buttons.length >= 3) {
            toast.error("Maximum 3 buttons allowed");
            return;
        }
        const newButton = { type, text: "", url: "", phone_number: "" };
        setFormData({ ...formData, buttons: [...formData.buttons, newButton] });
    };

    const removeButton = (index: number) => {
        const newButtons = [...formData.buttons];
        newButtons.splice(index, 1);
        setFormData({ ...formData, buttons: newButtons });
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.body) {
            toast.error("Name and Body are required");
            return;
        }

        const components: any[] = [];

        if (formData.headerType === "TEXT") {
            components.push({ type: "HEADER", format: "TEXT", text: formData.headerText });
        } else if (formData.headerType === "IMAGE") {
            components.push({ type: "HEADER", format: "IMAGE", example: { header_handle: ["IMAGE_UPLOAD_PLACEHOLDER"] } });
        }

        components.push({ type: "BODY", text: formData.body });

        if (formData.footer) {
            components.push({ type: "FOOTER", text: formData.footer });
        }

        if (formData.buttons.length > 0) {
            components.push({ type: "BUTTONS", buttons: formData.buttons });
        }

        const result = await createTemplateAction({
            name: formData.name,
            category: formData.category,
            language: formData.language,
            components,
        });

        if (result.success) {
            toast.success("Template submitted for approval");
            setIsCreating(false);
            window.location.reload();
        } else {
            toast.error("Error: " + result.error);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        const result = await deleteTemplateAction(deletingId);
        setIsDeleting(false);
        if (result.success) {
            toast.success("Template decommissioned successfully");
            setTemplates(templates.filter(t => t.id !== deletingId));
            setDeletingId(null);
        } else {
            toast.error("Deletion failed: " + result.error);
        }
    };

    return (
        <div className="p-8 space-y-10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Message Templates
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Design high-engagement interactive messages with absolute precision.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="rounded-xl h-12 px-6 border-border bg-white hover:bg-secondary/50"
                    >
                        <RefreshCw className={`w-5 h-5 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                        Sync Meta
                    </Button>
                    <Button
                        onClick={() => setIsCreating(true)}
                        className="rounded-xl h-12 px-6 shadow-glow shadow-primary/20 active:scale-95 transition-all font-black"
                    >
                        <Plus className="w-5 h-5 mr-2 stroke-[3px]" />
                        Create Template
                    </Button>
                </div>
            </div>

            {!isCreating ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templates.length === 0 ? (
                        <div className="col-span-full py-24 text-center border-2 border-dashed border-border rounded-[3rem] bg-secondary/20">
                            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Globe className="w-10 h-10 text-primary opacity-40" />
                            </div>
                            <p className="text-muted-foreground font-black uppercase tracking-widest opacity-40">No templates found in database.</p>
                        </div>
                    ) : (
                        templates.map((template) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                onDeleteClick={(id) => setDeletingId(id)}
                            />
                        ))
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <Card className="border-border shadow-elevated bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-6 md:p-10 pb-4 md:pb-6 border-b border-border shrink-0">
                            <CardTitle className="text-2xl md:text-3xl font-black tracking-tighter text-foreground">Template Designer</CardTitle>
                            <CardDescription className="text-xs md:text-sm font-medium mt-2">Configure header, body, and interactive buttons.</CardDescription>
                        </CardHeader>
                        <ScrollArea className="flex-1 lg:h-[600px]">
                            <CardContent className="p-6 md:p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Template Name</label>
                                        <Input
                                            placeholder="autumn_promo_2024"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="h-14 bg-secondary/50 border-none rounded-2xl focus:bg-background transition-all px-6 font-bold text-foreground placeholder:text-foreground/20"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Category</label>
                                        <select
                                            className="flex h-14 w-full rounded-2xl border-none bg-secondary/50 px-6 py-2 text-sm font-bold ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground appearance-none cursor-pointer"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option>MARKETING</option>
                                            <option>UTILITY</option>
                                            <option>AUTHENTICATION</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Language</label>
                                        <select
                                            className="flex h-14 w-full rounded-2xl border-none bg-secondary/50 px-6 py-2 text-sm font-bold ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground appearance-none cursor-pointer"
                                            value={formData.language}
                                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                        >
                                            <option value="en_US">English (US)</option>
                                            <option value="ar">Arabic</option>
                                            <option value="hi">Hindi</option>
                                            <option value="ml">Malayalam</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Header Type</label>
                                    <Tabs value={formData.headerType} onValueChange={(v: string) => setFormData({ ...formData, headerType: v as any })} className="w-full">
                                        <TabsList className="grid grid-cols-3 h-14 bg-secondary/50 rounded-2xl p-1 gap-1 border-none font-bold">
                                            <TabsTrigger value="NONE" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">None</TabsTrigger>
                                            <TabsTrigger value="TEXT" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">Text</TabsTrigger>
                                            <TabsTrigger value="IMAGE" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">Image</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="TEXT" className="mt-4">
                                            <Input
                                                placeholder="Enter header text..."
                                                value={formData.headerText}
                                                onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                                                className="h-14 bg-secondary/50 border-none rounded-2xl px-6 font-bold text-foreground placeholder:text-foreground/20"
                                            />
                                        </TabsContent>
                                        <TabsContent value="IMAGE" className="mt-4">
                                            <div 
                                                className="p-10 border-2 border-dashed border-primary/20 hover:border-primary/50 cursor-pointer transition-all rounded-2xl flex flex-col items-center gap-4 bg-primary/[0.02] hover:bg-primary/[0.05] relative overflow-hidden group"
                                                onClick={() => templateImageInputRef.current?.click()}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={handleTemplateImageDrop}
                                            >
                                                {formData.headerImageUrl ? (
                                                    <div className="absolute inset-0">
                                                        <img src={formData.headerImageUrl} alt="Header Preview" className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <RefreshCw className="w-8 h-8 text-primary shadow-sm mb-2" />
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary drop-shadow-md bg-white/80 px-2 py-1 rounded">Replace Image</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <ImageIcon className="w-10 h-10 text-primary opacity-40 group-hover:scale-110 transition-transform" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 transition-colors">Drop high-res image or click to upload</p>
                                                    </>
                                                )}
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="hidden" 
                                                    ref={templateImageInputRef}
                                                    onChange={handleTemplateImageSelect}
                                                />
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Body Content</label>
                                    <textarea
                                        className="flex min-h-[160px] w-full rounded-[2rem] border-none bg-secondary/50 px-8 py-6 text-sm font-medium ring-offset-background placeholder:text-muted-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground leading-relaxed"
                                        placeholder="Hello {{1}}, we're excited to help you Grow with Trigads..."
                                        value={formData.body}
                                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    />
                                    <p className="text-[10px] font-bold text-primary/40 uppercase tracking-tighter">Support Variables: {"{{1}}"}, {"{{2}}"}</p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Footer (Optional)</label>
                                    <Input
                                        placeholder="Trigads Digital Solutions LLP"
                                        value={formData.footer}
                                        onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
                                        className="h-14 bg-secondary/50 border-none rounded-2xl px-6 font-bold text-foreground placeholder:text-foreground/20"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Interactive Buttons</label>
                                        <div className="flex flex-wrap gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => addButton("QUICK_REPLY")} className="h-8 text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20">+ Reply</Button>
                                            <Button variant="ghost" size="sm" onClick={() => addButton("URL")} className="h-8 text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20">+ Link</Button>
                                            <Button variant="ghost" size="sm" onClick={() => addButton("PHONE_NUMBER")} className="h-8 text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20">+ Phone</Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {formData.buttons.map((btn, idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center animate-in slide-in-from-right-2 duration-300 p-4 sm:p-0 bg-secondary/20 sm:bg-transparent rounded-2xl sm:rounded-none">
                                                <div className="flex gap-3 items-center w-full sm:w-auto shrink-0">
                                                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shrink-0">
                                                        {btn.type === "QUICK_REPLY" && <MousePointer2 className="w-4 h-4 text-primary" />}
                                                        {btn.type === "URL" && <LinkIcon className="w-4 h-4 text-blue-500" />}
                                                        {btn.type === "PHONE_NUMBER" && <Phone className="w-4 h-4 text-green-500" />}
                                                    </div>
                                                    <Input
                                                        placeholder="Button text..."
                                                        value={btn.text}
                                                        onChange={(e) => {
                                                            const nb = [...formData.buttons];
                                                            nb[idx].text = e.target.value;
                                                            setFormData({ ...formData, buttons: nb });
                                                        }}
                                                        className="h-10 bg-secondary/50 border-none rounded-xl px-4 font-bold text-xs text-foreground flex-1 sm:w-32"
                                                    />
                                                </div>
                                                <div className="flex gap-3 items-center w-full sm:flex-1">
                                                    {btn.type === "URL" && (
                                                        <Input
                                                            placeholder="https://..."
                                                            value={btn.url}
                                                            onChange={(e) => {
                                                                const nb = [...formData.buttons];
                                                                nb[idx].url = e.target.value;
                                                                setFormData({ ...formData, buttons: nb });
                                                            }}
                                                            className="h-10 bg-secondary/50 border-none rounded-xl px-4 font-bold text-xs flex-1 text-foreground"
                                                        />
                                                    )}
                                                    {btn.type === "PHONE_NUMBER" && (
                                                        <Input
                                                            placeholder="+1234567890"
                                                            value={btn.phone_number}
                                                            onChange={(e) => {
                                                                const nb = [...formData.buttons];
                                                                nb[idx].phone_number = e.target.value;
                                                                setFormData({ ...formData, buttons: nb });
                                                            }}
                                                            className="h-10 bg-secondary/50 border-none rounded-xl px-4 font-bold text-xs flex-1 text-foreground"
                                                        />
                                                    )}
                                                    <Button variant="ghost" size="icon" onClick={() => removeButton(idx)} className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl shrink-0">
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </ScrollArea>
                        <div className="p-6 md:p-10 border-t border-border flex justify-end gap-3 shrink-0 bg-secondary/20">
                            <Button variant="ghost" onClick={() => setIsCreating(false)} className="rounded-[1.25rem] h-12 md:h-14 px-6 md:px-10 font-black uppercase tracking-widest text-muted-foreground w-full md:w-auto">Discard</Button>
                            <Button onClick={handleSubmit} className="rounded-[1.25rem] h-12 md:h-14 px-6 md:px-12 font-black uppercase tracking-widest shadow-glow w-full md:w-auto">Submit</Button>
                        </div>
                    </Card>

                    <div className="sticky top-8 flex flex-col gap-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary text-center">Live Preview Component</label>
                        <div className="bg-[#e5ddd5] rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative border border-border">
                            <div className="max-w-[340px] mx-auto space-y-1">
                                <div className="bg-white rounded-2xl rounded-tl-none overflow-hidden shadow-sm border border-black/5 p-1">
                                    {formData.headerType === "IMAGE" && (
                                        <div className="aspect-video bg-secondary rounded-xl flex items-center justify-center mb-1 overflow-hidden">
                                            {formData.headerImageUrl ? (
                                                <img src={formData.headerImageUrl} alt="Header Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-10 h-10 opacity-20" />
                                            )}
                                        </div>
                                    )}
                                    <div className="p-4 space-y-2">
                                        {formData.headerType === "TEXT" && formData.headerText && (
                                            <h4 className="font-bold text-[15px] text-foreground/90">{formData.headerText}</h4>
                                        )}
                                        <p className="text-[14.5px] text-foreground/80 whitespace-pre-wrap leading-tight">
                                            {formData.body || "Your body content will appear here..."}
                                        </p>
                                        {formData.footer && (
                                            <p className="text-[12px] text-foreground/40 font-medium uppercase text-[10px] tracking-tight">{formData.footer}</p>
                                        )}
                                    </div>
                                    <div className="border-t border-border">
                                        {formData.buttons.map((btn, i) => (
                                            <div key={i} className="flex items-center justify-center py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer transition-colors">
                                                <span className="text-[#00a884] text-[14px] font-bold">{btn.text || "Button Text"}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end pr-1">
                                    <span className="text-[10px] text-foreground/30 uppercase font-bold">14:02 PREVIEW</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <DialogContent className="rounded-[2rem] border-border bg-white/90 backdrop-blur-2xl p-10 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tighter uppercase italic">Decommission Template?</DialogTitle>
                        <DialogDescription className="text-sm font-medium pt-2">
                            This will permanently remove the logic signature from your local architect.
                            Official Meta records will remain unaffected.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-8 flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setDeletingId(null)}
                            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-muted-foreground"
                        >
                            Abort
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 h-14 rounded-2xl bg-destructive text-destructive-foreground font-black uppercase tracking-widest shadow-glow-soft hover:bg-destructive/90"
                        >
                            {isDeleting ? "Wiping..." : "Confirm Wipe"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function TemplateCard({ template, onDeleteClick }: { template: Template, onDeleteClick: (id: string) => void }) {
    const body = template.components?.find(c => c.type === 'BODY')?.text || "";
    const footer = template.components?.find(c => c.type === 'FOOTER')?.text || "";
    const header = template.components?.find(c => c.type === 'HEADER');
    const buttons = template.components?.find(c => c.type === 'BUTTONS')?.buttons || [];

    return (
        <Card className="overflow-hidden border border-border shadow-elevated bg-white group hover:translate-y-[-8px] transition-all duration-500 rounded-[2.5rem]">
            <CardHeader className="bg-secondary/30 p-8 border-b border-border">
                <div className="flex justify-between items-start">
                    <StatusBadge status={template.status} />
                    <Badge variant="ghost" className="bg-primary/10 text-[9px] font-black uppercase tracking-widest text-primary-foreground border-none">
                        {template.category}
                    </Badge>
                </div>
                <CardTitle className="mt-6 text-2xl font-black tracking-tighter group-hover:text-primary transition-colors text-foreground">
                    {template.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                    <Globe className="w-3.5 h-3.5 text-primary/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{template.language}</span>
                </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
                <div className="bg-secondary/40 rounded-3xl p-6 relative border border-border">
                    {header?.format === 'IMAGE' && (
                        <div className="w-full aspect-video bg-white/50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                            <ImageIcon className="w-8 h-8 opacity-20 text-primary" />
                        </div>
                    )}
                    {header?.format === 'TEXT' && (
                        <h4 className="font-black text-foreground text-sm mb-2">{header.text}</h4>
                    )}
                    <p className="text-[13px] text-muted-foreground font-medium leading-relaxed italic">
                        "{body}"
                    </p>
                    {footer && (
                        <p className="text-[10px] text-muted-foreground/40 font-black uppercase mt-3 tracking-widest">{footer}</p>
                    )}
                </div>

                {buttons.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-2">Action Components</p>
                        <div className="flex flex-wrap gap-2">
                            {buttons.map((btn: any, i: number) => (
                                <div key={i} className="flex items-center gap-1.5 px-4 py-2 bg-secondary/50 rounded-xl border border-border text-[10px] font-black uppercase text-primary">
                                    {btn.type === 'URL' ? <LinkIcon className="w-3 h-3" /> : <MousePointer2 className="w-3 h-3" />}
                                    {btn.text}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-4 flex gap-3">
                    <Button variant="ghost" className="flex-1 rounded-[1.25rem] h-12 text-[10px] font-black uppercase tracking-widest bg-secondary hover:bg-primary hover:text-white transition-all">Preview Details</Button>
                    <Button
                        variant="ghost"
                        onClick={() => onDeleteClick(template.id)}
                        className="w-12 h-12 rounded-[1.25rem] bg-destructive/5 text-destructive border border-destructive/10 hover:bg-destructive hover:text-white transition-all flex items-center justify-center p-0"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: "APPROVED" | "PENDING" | "REJECTED" }) {
    const styles = {
        APPROVED: "bg-green-500/10 text-green-600 border-green-200",
        PENDING: "bg-amber-500/10 text-amber-600 border-amber-200",
        REJECTED: "bg-red-500/10 text-red-600 border-red-200",
    };

    const icons = {
        APPROVED: <Check className="w-3 h-3" />,
        PENDING: <Clock className="w-3 h-3" />,
        REJECTED: <XCircle className="w-3 h-3" />,
    };

    return (
        <Badge variant="outline" className={`rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>
            {icons[status]}
            {status}
        </Badge>
    );
}
