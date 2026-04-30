"use client";

import { useState, useMemo } from "react";
import {
    Plus, Globe, Check, Clock, XCircle, Image as ImageIcon,
    RefreshCw, Trash2, Search, X, MousePointer2, Link as LinkIcon,
    Phone, ChevronRight, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createTemplateAction, syncTemplatesAction, deleteTemplateAction } from "@/app/actions/whatsapp";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Template {
    id: string; name: string; language: string;
    category: string; status: "APPROVED" | "PENDING" | "REJECTED";
    components: any[]; preview: string;
}

const STATUS = {
    APPROVED: { label: "Approved", icon: Check,   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    PENDING:  { label: "Pending",  icon: Clock,   cls: "bg-amber-50  text-amber-700  border-amber-200"  },
    REJECTED: { label: "Rejected", icon: XCircle, cls: "bg-red-50    text-red-600    border-red-200"    },
};

const EMPTY_FORM = {
    name: "", category: "MARKETING", language: "en_US",
    headerType: "NONE", headerText: "", body: "", footer: "",
    buttons: [] as any[],
};

export default function TemplatesClient({ initialTemplates }: { initialTemplates: Template[] }) {
    const [templates, setTemplates]   = useState(initialTemplates);
    const [view, setView]             = useState<"grid" | "create">("grid");
    const [isSyncing, setIsSyncing]   = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewId, setPreviewId]   = useState<string | null>(null);
    const [search, setSearch]         = useState("");
    const [formData, setFormData]     = useState(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return q ? templates.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)) : templates;
    }, [templates, search]);

    const previewTemplate = templates.find(t => t.id === previewId) ?? null;

    /* ── Actions ── */
    const handleSync = async () => {
        setIsSyncing(true);
        const r = await syncTemplatesAction();
        setIsSyncing(false);
        if (r.success) { toast.success("Synced with Meta"); window.location.reload(); }
        else toast.error("Sync failed: " + r.error);
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        const r = await deleteTemplateAction(deletingId);
        setIsDeleting(false);
        if (r.success) { setTemplates(t => t.filter(x => x.id !== deletingId)); setDeletingId(null); toast.success("Template removed"); }
        else toast.error("Delete failed: " + r.error);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.body) { toast.error("Name and body are required"); return; }
        setIsSubmitting(true);
        const components: any[] = [];
        if (formData.headerType === "TEXT") components.push({ type: "HEADER", format: "TEXT", text: formData.headerText });
        if (formData.headerType === "IMAGE") components.push({ type: "HEADER", format: "IMAGE", example: { header_handle: ["IMAGE_UPLOAD_PLACEHOLDER"] } });
        components.push({ type: "BODY", text: formData.body });
        if (formData.footer) components.push({ type: "FOOTER", text: formData.footer });
        if (formData.buttons.length) components.push({ type: "BUTTONS", buttons: formData.buttons });
        const r = await createTemplateAction({ name: formData.name, category: formData.category, language: formData.language, components });
        setIsSubmitting(false);
        if (r.success) { toast.success("Template submitted for approval"); setView("grid"); setFormData(EMPTY_FORM); window.location.reload(); }
        else toast.error("Error: " + r.error);
    };

    const addBtn = (type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER") => {
        if (formData.buttons.length >= 3) { toast.error("Max 3 buttons"); return; }
        setFormData(f => ({ ...f, buttons: [...f.buttons, { type, text: "", url: "", phone_number: "" }] }));
    };

    const removeBtn = (i: number) => setFormData(f => ({ ...f, buttons: f.buttons.filter((_, idx) => idx !== i) }));
    const updateBtn = (i: number, key: string, val: string) => setFormData(f => {
        const b = [...f.buttons]; b[i] = { ...b[i], [key]: val }; return { ...f, buttons: b };
    });

    /* ── Render ── */
    return (
        <div className="h-full flex flex-col">
            {/* Page header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-white sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground">Message Templates</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{templates.length} template{templates.length !== 1 ? "s" : ""} · WhatsApp Cloud API</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSync} disabled={isSyncing} className="h-10 px-4 rounded-xl border-border font-bold text-sm">
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} /> Sync Meta
                    </Button>
                    <Button onClick={() => { setView(v => v === "grid" ? "create" : "grid"); setFormData(EMPTY_FORM); }} className="h-10 px-4 rounded-xl font-bold text-sm shadow-glow">
                        {view === "create" ? <><X className="w-4 h-4 mr-2" /> Cancel</> : <><Plus className="w-4 h-4 mr-2" /> New Template</>}
                    </Button>
                </div>
            </div>

            {view === "grid" && (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                    {/* Search */}
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…"
                            className="pl-10 h-10 bg-secondary/50 border-none rounded-xl font-medium" />
                        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"><X className="w-4 h-4" /></button>}
                    </div>

                    {/* Grid */}
                    {filtered.length === 0 ? (
                        <div className="py-32 flex flex-col items-center gap-4 text-center border-2 border-dashed border-border rounded-3xl bg-secondary/20">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Globe className="w-8 h-8 text-primary/40" />
                            </div>
                            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/40">
                                {search ? "No templates match your search" : "No templates yet — sync Meta or create one"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filtered.map(t => (
                                <TemplateCard key={t.id} template={t}
                                    onPreview={() => setPreviewId(t.id)}
                                    onDelete={() => setDeletingId(t.id)} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {view === "create" && (
                <div className="flex-1 overflow-hidden flex">
                    {/* Form side */}
                    <ScrollArea className="flex-1 border-r border-border">
                        <div className="p-8 space-y-6 max-w-2xl">
                            <h2 className="text-lg font-black tracking-tight">Template Details</h2>

                            {/* Meta fields */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: "Template Name", field: "name", placeholder: "promo_offer_v1" },
                                ].map(({ label, field, placeholder }) => (
                                    <div key={field} className="col-span-3 space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{label}</label>
                                        <Input value={(formData as any)[field]} onChange={e => setFormData(f => ({ ...f, [field]: e.target.value }))}
                                            placeholder={placeholder} className="h-11 bg-secondary/50 border-none rounded-xl px-4 font-medium" />
                                    </div>
                                ))}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Category</label>
                                    <select value={formData.category} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
                                        className="w-full h-11 rounded-xl bg-secondary/50 border-none px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                                        <option>MARKETING</option><option>UTILITY</option><option>AUTHENTICATION</option>
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Language</label>
                                    <select value={formData.language} onChange={e => setFormData(f => ({ ...f, language: e.target.value }))}
                                        className="w-full h-11 rounded-xl bg-secondary/50 border-none px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                                        <option value="en_US">English (US)</option><option value="ar">Arabic</option>
                                        <option value="hi">Hindi</option><option value="ml">Malayalam</option>
                                    </select>
                                </div>
                            </div>

                            {/* Header */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Header</label>
                                <Tabs value={formData.headerType} onValueChange={v => setFormData(f => ({ ...f, headerType: v }))}>
                                    <TabsList className="h-10 bg-secondary/50 rounded-xl p-1 gap-1 border-none">
                                        {["NONE", "TEXT", "IMAGE"].map(v => (
                                            <TabsTrigger key={v} value={v} className="rounded-lg text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white">{v}</TabsTrigger>
                                        ))}
                                    </TabsList>
                                    <TabsContent value="TEXT" className="mt-3">
                                        <Input value={formData.headerText} onChange={e => setFormData(f => ({ ...f, headerText: e.target.value }))}
                                            placeholder="Header text…" className="h-11 bg-secondary/50 border-none rounded-xl px-4 font-medium" />
                                    </TabsContent>
                                    <TabsContent value="IMAGE" className="mt-3">
                                        <div className="h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground/40">
                                            <ImageIcon className="w-5 h-5" /><span className="text-xs font-bold uppercase tracking-widest">Image header (set via Meta)</span>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Body */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Body <span className="text-primary/50">*</span></label>
                                <textarea value={formData.body} onChange={e => setFormData(f => ({ ...f, body: e.target.value }))}
                                    placeholder={"Hello {{1}}, your order {{2}} is confirmed!"}
                                    className="w-full min-h-[120px] rounded-xl bg-secondary/50 border-none px-4 py-3 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed" />
                                <p className="text-[10px] text-primary/40 font-bold uppercase tracking-tight">Use {"{{1}}"} {"{{2}}"} for dynamic variables</p>
                            </div>

                            {/* Footer */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Footer (optional)</label>
                                <Input value={formData.footer} onChange={e => setFormData(f => ({ ...f, footer: e.target.value }))}
                                    placeholder="Trigads Digital Solutions LLP" className="h-11 bg-secondary/50 border-none rounded-xl px-4 font-medium" />
                            </div>

                            {/* Buttons */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Buttons (max 3)</label>
                                    <div className="flex gap-1.5">
                                        {(["QUICK_REPLY", "URL", "PHONE_NUMBER"] as const).map(type => (
                                            <button key={type} onClick={() => addBtn(type)}
                                                className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                                + {type === "QUICK_REPLY" ? "Reply" : type === "URL" ? "Link" : "Phone"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {formData.buttons.map((btn, i) => (
                                        <div key={i} className="flex gap-2 items-center p-3 bg-secondary/40 rounded-xl">
                                            <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center shrink-0">
                                                {btn.type === "URL" ? <LinkIcon className="w-3.5 h-3.5 text-blue-500" /> : btn.type === "PHONE_NUMBER" ? <Phone className="w-3.5 h-3.5 text-green-500" /> : <MousePointer2 className="w-3.5 h-3.5 text-primary" />}
                                            </div>
                                            <Input value={btn.text} onChange={e => updateBtn(i, "text", e.target.value)} placeholder="Button label" className="h-8 flex-1 bg-background border-none rounded-lg text-xs font-medium" />
                                            {btn.type === "URL" && <Input value={btn.url} onChange={e => updateBtn(i, "url", e.target.value)} placeholder="https://…" className="h-8 flex-1 bg-background border-none rounded-lg text-xs" />}
                                            {btn.type === "PHONE_NUMBER" && <Input value={btn.phone_number} onChange={e => updateBtn(i, "phone_number", e.target.value)} placeholder="+91…" className="h-8 flex-1 bg-background border-none rounded-lg text-xs" />}
                                            <button onClick={() => removeBtn(i)} className="w-7 h-7 rounded-lg text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0"><XCircle className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="ghost" onClick={() => { setView("grid"); setFormData(EMPTY_FORM); }} className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-muted-foreground">Discard</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest shadow-glow">
                                    {isSubmitting ? "Submitting…" : "Submit for Approval"}
                                </Button>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Live preview side */}
                    <div className="hidden lg:flex flex-col w-80 xl:w-96 bg-secondary/30 p-8 gap-4 shrink-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 text-center">Live Preview</p>
                        <WAPreview
                            headerType={formData.headerType}
                            headerText={formData.headerText}
                            body={formData.body || "Your message body will appear here…"}
                            footer={formData.footer}
                            buttons={formData.buttons}
                        />
                    </div>
                </div>
            )}

            {/* Delete dialog */}
            <Dialog open={!!deletingId} onOpenChange={o => !o && setDeletingId(null)}>
                <DialogContent className="rounded-2xl p-8 max-w-sm border-border bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight text-destructive">Delete Template?</DialogTitle>
                        <DialogDescription className="text-sm pt-1">This removes the template from your local records. Meta records are unaffected.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex gap-3">
                        <Button variant="ghost" onClick={() => setDeletingId(null)} disabled={isDeleting} className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest">Cancel</Button>
                        <Button onClick={handleDelete} disabled={isDeleting} className="flex-1 h-11 rounded-xl bg-destructive text-white font-black uppercase tracking-widest hover:bg-destructive/90">
                            {isDeleting ? "Deleting…" : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview dialog */}
            <Dialog open={!!previewId} onOpenChange={o => !o && setPreviewId(null)}>
                <DialogContent className="rounded-2xl p-0 max-w-md border-border bg-white overflow-hidden">
                    {previewTemplate && (
                        <>
                            <div className="p-6 border-b border-border flex items-start justify-between">
                                <div>
                                    <p className="font-black text-foreground text-lg tracking-tight">{previewTemplate.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <StatusBadge status={previewTemplate.status} />
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-border">{previewTemplate.category}</Badge>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase">{previewTemplate.language}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-[#e5ddd5]">
                                <WAPreview
                                    headerType={previewTemplate.components?.find(c => c.type === "HEADER")?.format || "NONE"}
                                    headerText={previewTemplate.components?.find(c => c.type === "HEADER")?.text || ""}
                                    body={previewTemplate.components?.find(c => c.type === "BODY")?.text || ""}
                                    footer={previewTemplate.components?.find(c => c.type === "FOOTER")?.text || ""}
                                    buttons={previewTemplate.components?.find(c => c.type === "BUTTONS")?.buttons || []}
                                />
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* ── Template Card ── */
function TemplateCard({ template, onPreview, onDelete }: { template: Template; onPreview: () => void; onDelete: () => void }) {
    const body    = template.components?.find(c => c.type === "BODY")?.text || "";
    const header  = template.components?.find(c => c.type === "HEADER");
    const buttons = template.components?.find(c => c.type === "BUTTONS")?.buttons || [];

    return (
        <div className="group bg-white border border-border rounded-2xl overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300">
            {/* Card header strip */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/30">
                <StatusBadge status={template.status} />
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-border text-muted-foreground">{template.category}</Badge>
            </div>

            <div className="p-5 space-y-4">
                {/* Name + language */}
                <div>
                    <p className="font-black text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors">{template.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <Globe className="w-3 h-3 text-muted-foreground/40" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{template.language}</span>
                    </div>
                </div>

                {/* Body preview */}
                <div className="bg-secondary/50 rounded-xl p-4 space-y-1.5">
                    {header?.format === "TEXT" && <p className="font-black text-foreground text-xs">{header.text}</p>}
                    {header?.format === "IMAGE" && (
                        <div className="w-full h-14 bg-secondary rounded-lg flex items-center justify-center mb-2">
                            <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-3">"{body}"</p>
                </div>

                {/* Buttons */}
                {buttons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {buttons.map((b: any, i: number) => (
                            <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-primary/8 border border-primary/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary">
                                {b.type === "URL" ? <LinkIcon className="w-2.5 h-2.5" /> : b.type === "PHONE_NUMBER" ? <Phone className="w-2.5 h-2.5" /> : <MousePointer2 className="w-2.5 h-2.5" />}
                                {b.text}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <Button variant="ghost" size="sm" onClick={onPreview}
                        className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest bg-secondary/60 hover:bg-primary hover:text-white transition-all">
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onDelete}
                        className="h-9 w-9 rounded-xl bg-destructive/5 text-destructive border border-destructive/10 hover:bg-destructive hover:text-white transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ── WhatsApp-style Preview ── */
function WAPreview({ headerType, headerText, body, footer, buttons }: {
    headerType: string; headerText: string; body: string; footer: string; buttons: any[];
}) {
    return (
        <div className="max-w-[300px] mx-auto">
            <div className="bg-white rounded-2xl rounded-tl-none shadow-md overflow-hidden text-[13px]">
                {headerType === "IMAGE" && (
                    <div className="w-full aspect-video bg-secondary/80 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                )}
                <div className="p-3 space-y-1.5">
                    {headerType === "TEXT" && headerText && (
                        <p className="font-black text-foreground text-sm">{headerText}</p>
                    )}
                    <p className="text-foreground/80 whitespace-pre-wrap leading-snug">{body}</p>
                    {footer && <p className="text-[10px] text-foreground/35 font-medium mt-1">{footer}</p>}
                    <div className="flex justify-end pt-1">
                        <span className="text-[10px] text-foreground/30">14:02 ✓✓</span>
                    </div>
                </div>
                {buttons.length > 0 && (
                    <div className="border-t border-border/50">
                        {buttons.map((b: any, i: number) => (
                            <div key={i} className="flex items-center justify-center py-2.5 border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer">
                                <span className="text-[#00a884] text-sm font-bold">{b.text || "Button"}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex justify-end pr-1 mt-1">
                <span className="text-[9px] text-foreground/25 uppercase font-bold tracking-widest">PREVIEW</span>
            </div>
        </div>
    );
}

/* ── Status Badge ── */
function StatusBadge({ status }: { status: "APPROVED" | "PENDING" | "REJECTED" }) {
    const s = STATUS[status];
    const Icon = s.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${s.cls}`}>
            <Icon className="w-3 h-3" />{s.label}
        </span>
    );
}
