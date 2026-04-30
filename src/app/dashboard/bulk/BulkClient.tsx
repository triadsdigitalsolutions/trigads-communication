"use client";

import { useState, useMemo } from "react";
import {
    Search, X, Check, Loader2, Send, ChevronRight,
    ChevronLeft, Users, Layout, Radio, CheckSquare,
    Square, AlertCircle, CheckCircle2, Image as ImageIcon,
    MousePointer2, Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { sendBulkTemplateAction } from "@/app/actions/whatsapp";

interface Contact { id: string; name: string; phone: string; }
interface Template { id: string; name: string; language: string; category: string; status: string; components: any[]; }
type SendResult = { contactId: string; name: string; success: boolean; error?: string };

export default function BulkClient({ contacts, templates }: { contacts: Contact[]; templates: Template[] }) {
    const [step, setStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [recipientSearch, setRecipientSearch] = useState("");
    const [templateSearch, setTemplateSearch] = useState("");
    const [parametersMap, setParametersMap] = useState<Record<string, string[]>>({});
    const [isSending, setIsSending] = useState(false);
    const [results, setResults] = useState<SendResult[] | null>(null);

    // Detect variable slots in body, e.g. {{1}}, {{2}}
    const bodyText = selectedTemplate?.components?.find(c => c.type === "BODY")?.text || "";
    const variableCount = (bodyText.match(/\{\{\d+\}\}/g) || []).length;

    const filteredTemplates = useMemo(() => {
        const q = templateSearch.toLowerCase();
        return q ? templates.filter(t => t.name.toLowerCase().includes(q)) : templates;
    }, [templates, templateSearch]);

    const filteredContacts = useMemo(() => {
        const q = recipientSearch.toLowerCase();
        return q ? contacts.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(q)) : contacts;
    }, [contacts, recipientSearch]);

    const selectedContacts = useMemo(() => contacts.filter(c => selectedIds.has(c.id)), [contacts, selectedIds]);

    const toggleContact = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelectedIds(new Set(filteredContacts.map(c => c.id)));
    const clearAll = () => setSelectedIds(new Set());

    const getParam = (contactId: string, idx: number) =>
        parametersMap[contactId]?.[idx] || "";

    const setParam = (contactId: string, idx: number, value: string) => {
        setParametersMap(prev => {
            const arr = [...(prev[contactId] || Array(variableCount).fill(""))];
            arr[idx] = value;
            return { ...prev, [contactId]: arr };
        });
    };

    const handleSend = async () => {
        if (!selectedTemplate) return;
        setIsSending(true);
        try {
            const { results } = await sendBulkTemplateAction(
                Array.from(selectedIds),
                selectedTemplate.name,
                parametersMap
            );
            setResults(results);
        } catch (e: any) {
            toast.error("Broadcast failed: " + e.message);
        } finally {
            setIsSending(false);
        }
    };

    const resetAll = () => {
        setStep(1); setSelectedTemplate(null); setSelectedIds(new Set());
        setParametersMap({}); setResults(null); setRecipientSearch(""); setTemplateSearch("");
    };

    // ---- RESULTS SCREEN ----
    if (results) {
        const succeeded = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        return (
            <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-3 pt-6">
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
                        <Radio className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Broadcast Complete</h1>
                    <p className="text-muted-foreground">
                        Sent to <span className="font-black text-foreground">{results.length}</span> contacts
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-[2rem] p-6 text-center">
                        <p className="text-4xl font-black text-green-600">{succeeded}</p>
                        <p className="text-xs font-black uppercase tracking-widest text-green-500 mt-1">Delivered</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-[2rem] p-6 text-center">
                        <p className="text-4xl font-black text-red-500">{failed}</p>
                        <p className="text-xs font-black uppercase tracking-widest text-red-400 mt-1">Failed</p>
                    </div>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {results.map(r => (
                        <div key={r.contactId} className="flex items-center gap-3 p-4 bg-secondary/40 rounded-2xl">
                            {r.success
                                ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                : <AlertCircle className="w-5 h-5 text-destructive shrink-0" />}
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-sm truncate">{r.name}</p>
                                {!r.success && <p className="text-xs text-destructive truncate">{r.error}</p>}
                            </div>
                            <Badge className={r.success ? "bg-green-100 text-green-700 border-none text-[10px] font-black uppercase" : "bg-red-100 text-red-600 border-none text-[10px] font-black uppercase"}>
                                {r.success ? "Sent" : "Failed"}
                            </Badge>
                        </div>
                    ))}
                </div>
                <Button onClick={resetAll} className="w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-glow">
                    New Broadcast
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Bulk Messaging
                </h1>
                <p className="text-muted-foreground mt-2 text-base">Broadcast an approved template to multiple contacts at once.</p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
                {[
                    { n: 1, label: "Template" },
                    { n: 2, label: "Recipients" },
                    { n: 3, label: "Send" },
                ].map(({ n, label }, i) => (
                    <div key={n} className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all font-black text-sm ${step === n ? "bg-primary text-white" : step > n ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${step > n ? "bg-primary text-white" : ""}`}>
                                {step > n ? <Check className="w-3 h-3" /> : n}
                            </span>
                            <span className="hidden sm:block">{label}</span>
                        </div>
                        {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground/40" />}
                    </div>
                ))}
            </div>

            {/* ---- STEP 1: Template ---- */}
            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input placeholder="Search templates…" value={templateSearch} onChange={e => setTemplateSearch(e.target.value)}
                            className="pl-11 h-12 bg-secondary/50 border-none rounded-2xl font-medium" />
                    </div>
                    {filteredTemplates.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-border rounded-[3rem] bg-secondary/20">
                            <Layout className="w-10 h-10 text-primary opacity-30 mx-auto mb-4" />
                            <p className="text-muted-foreground font-black uppercase tracking-widest opacity-40 text-sm">No approved templates found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTemplates.map(t => (
                                <TemplateCard key={t.id} template={t} selected={selectedTemplate?.id === t.id} onSelect={() => setSelectedTemplate(t)} />
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end pt-2">
                        <Button disabled={!selectedTemplate} onClick={() => setStep(2)}
                            className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest shadow-glow">
                            Next: Pick Recipients <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* ---- STEP 2: Recipients ---- */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                            <Input placeholder="Search contacts…" value={recipientSearch} onChange={e => setRecipientSearch(e.target.value)}
                                className="pl-11 h-12 bg-secondary/50 border-none rounded-2xl font-medium" />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={selectAll} className="h-10 rounded-xl font-black text-xs uppercase">
                                <CheckSquare className="w-3.5 h-3.5 mr-1" /> All
                            </Button>
                            <Button variant="outline" size="sm" onClick={clearAll} className="h-10 rounded-xl font-black text-xs uppercase">
                                <Square className="w-3.5 h-3.5 mr-1" /> None
                            </Button>
                        </div>
                        {selectedIds.size > 0 && (
                            <Badge className="bg-primary text-white border-none px-3 py-1 rounded-full font-black text-sm">
                                {selectedIds.size} selected
                            </Badge>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                        {filteredContacts.map(c => {
                            const checked = selectedIds.has(c.id);
                            return (
                                <button key={c.id} onClick={() => toggleContact(c.id)}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${checked ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/30"}`}>
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checked ? "bg-primary border-primary" : "border-border"}`}>
                                        {checked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-sm truncate">{c.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{c.phone}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-between pt-2">
                        <Button variant="ghost" onClick={() => setStep(1)} className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-muted-foreground">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                        <Button disabled={selectedIds.size === 0} onClick={() => setStep(3)}
                            className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest shadow-glow">
                            Next: Personalize <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* ---- STEP 3: Personalize & Send ---- */}
            {step === 3 && selectedTemplate && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    {/* Template preview */}
                    <div className="bg-secondary/40 border border-border rounded-[2rem] p-6 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Layout className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-black text-foreground">{selectedTemplate.name}</p>
                            <p className="text-sm text-muted-foreground mt-1 italic">"{bodyText}"</p>
                        </div>
                    </div>

                    {/* Variable table */}
                    {variableCount > 0 ? (
                        <div className="space-y-3">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                                Fill in variables for each recipient
                            </p>
                            <div className="overflow-x-auto rounded-[1.5rem] border border-border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-secondary/60">
                                            <th className="text-left px-5 py-3 font-black text-xs uppercase tracking-widest text-muted-foreground/60">Contact</th>
                                            {Array.from({ length: variableCount }, (_, i) => (
                                                <th key={i} className="text-left px-5 py-3 font-black text-xs uppercase tracking-widest text-primary/60">
                                                    {`{{${i + 1}}}`}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedContacts.map((c, ri) => (
                                            <tr key={c.id} className={ri % 2 === 0 ? "bg-white" : "bg-secondary/20"}>
                                                <td className="px-5 py-3">
                                                    <p className="font-black text-sm">{c.name}</p>
                                                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                                                </td>
                                                {Array.from({ length: variableCount }, (_, vi) => (
                                                    <td key={vi} className="px-5 py-2">
                                                        <Input
                                                            value={getParam(c.id, vi)}
                                                            onChange={e => setParam(c.id, vi, e.target.value)}
                                                            placeholder={`Value for {{${vi + 1}}}`}
                                                            className="h-9 bg-secondary/50 border-none rounded-xl px-3 text-xs font-medium min-w-[140px]"
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                            <p className="text-sm font-medium text-foreground">
                                This template has no variables — it will be sent as-is to all{" "}
                                <span className="font-black">{selectedIds.size}</span> recipients.
                            </p>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="bg-secondary/40 border border-border rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="text-sm font-black">{selectedIds.size} Recipients</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Layout className="w-4 h-4 text-primary" />
                            <span className="text-sm font-black">{selectedTemplate.name}</span>
                        </div>
                    </div>

                    <div className="flex justify-between pt-2">
                        <Button variant="ghost" onClick={() => setStep(2)} disabled={isSending}
                            className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-muted-foreground">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                        <Button onClick={handleSend} disabled={isSending}
                            className="h-12 px-10 rounded-2xl font-black uppercase tracking-widest shadow-glow">
                            {isSending ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending…</>
                            ) : (
                                <><Send className="w-4 h-4 mr-2" /> Send Broadcast</>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function TemplateCard({ template, selected, onSelect }: { template: Template; selected: boolean; onSelect: () => void }) {
    const body = template.components?.find(c => c.type === "BODY")?.text || "";
    const header = template.components?.find(c => c.type === "HEADER");
    const buttons = template.components?.find(c => c.type === "BUTTONS")?.buttons || [];

    return (
        <button onClick={onSelect}
            className={`text-left w-full rounded-[2rem] border-2 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-elevated ${selected ? "border-primary bg-primary/5 shadow-glow shadow-primary/10" : "border-border bg-white hover:border-primary/30"}`}>
            <div className="flex justify-between items-start mb-4">
                <Badge className="bg-secondary text-secondary-foreground border-none text-[9px] font-black uppercase tracking-widest">
                    {template.category}
                </Badge>
                {selected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    </div>
                )}
            </div>
            <p className="font-black text-foreground text-base tracking-tight mb-3">{template.name}</p>
            {header?.format === "IMAGE" && (
                <div className="w-full aspect-video bg-secondary/60 rounded-xl mb-3 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 opacity-20 text-primary" />
                </div>
            )}
            {header?.format === "TEXT" && (
                <p className="font-black text-sm text-foreground/80 mb-1">{header.text}</p>
            )}
            <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-3">"{body}"</p>
            {buttons.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                    {buttons.map((btn: any, i: number) => (
                        <span key={i} className="text-[9px] font-black uppercase px-2 py-1 bg-primary/10 text-primary rounded-lg flex items-center gap-1">
                            {btn.type === "URL" ? <LinkIcon className="w-2.5 h-2.5" /> : <MousePointer2 className="w-2.5 h-2.5" />}
                            {btn.text}
                        </span>
                    ))}
                </div>
            )}
        </button>
    );
}
