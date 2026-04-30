"use client";

import { useState, useMemo } from "react";
import {
    Plus, X, CalendarClock, Clock, Calendar, MessageSquare,
    Layout, Loader2, XCircle, Check, AlertCircle, Search,
    ChevronDown, Users, Timer, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createScheduledMessageAction, cancelScheduledMessageAction } from "@/app/actions/whatsapp";
import type { ScheduleMode, MessageType } from "@/app/actions/whatsapp";

interface Contact  { id: string; name: string; phone: string; }
interface Template { id: string; name: string; language: string; components: any[]; }
interface Schedule {
    id: string; contactId: string; contactName: string; contactPhone: string;
    type: MessageType; messageText?: string; templateName?: string;
    scheduleMode: ScheduleMode; scheduledAt: string | null;
    delayValue?: number; delayUnit?: string; afterMessageDelayMinutes?: number;
    status: "PENDING" | "SENT" | "FAILED" | "CANCELLED"; errorMessage?: string;
    createdAt: string; sentAt?: string;
}

const STATUS_CONFIG = {
    PENDING:   { label: "Pending",   cls: "bg-amber-50  text-amber-700  border-amber-200",  icon: Clock     },
    SENT:      { label: "Sent",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Check   },
    FAILED:    { label: "Failed",    cls: "bg-red-50    text-red-600    border-red-200",    icon: AlertCircle },
    CANCELLED: { label: "Cancelled", cls: "bg-secondary text-muted-foreground border-border", icon: XCircle },
};

const MODE_CONFIG = {
    delay:         { label: "Delay",         icon: Timer,   desc: "Send after X minutes/hours from now" },
    fixed:         { label: "Fixed Time",    icon: Calendar,desc: "Send at a specific date & time" },
    after_message: { label: "After Message", icon: Bell,    desc: "Send X minutes after contact replies" },
};

export default function SchedulerClient({ schedules: initial, contacts, templates }: {
    schedules: Schedule[]; contacts: Contact[]; templates: Template[];
}) {
    const [schedules, setSchedules] = useState<Schedule[]>(initial);
    const [showForm, setShowForm]   = useState(false);
    const [search, setSearch]       = useState("");
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    // Form state
    const [contactSearch, setContactSearch]   = useState("");
    const [contactOpen, setContactOpen]       = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [msgType, setMsgType]               = useState<MessageType>("text");
    const [messageText, setMessageText]       = useState("");
    const [templateName, setTemplateName]     = useState("");
    const [templateParams, setTemplateParams] = useState<string[]>([]);
    const [scheduleMode, setScheduleMode]     = useState<ScheduleMode>("delay");
    const [delayValue, setDelayValue]         = useState(30);
    const [delayUnit, setDelayUnit]           = useState<"minutes" | "hours">("minutes");
    const [fixedDatetime, setFixedDatetime]   = useState("");
    const [afterDelay, setAfterDelay]         = useState(30);
    const [isSubmitting, setIsSubmitting]     = useState(false);

    const filteredSchedules = useMemo(() => {
        const q = search.toLowerCase();
        return q ? schedules.filter(s => s.contactName.toLowerCase().includes(q) || s.templateName?.toLowerCase().includes(q)) : schedules;
    }, [schedules, search]);

    const filteredContacts = useMemo(() => {
        const q = contactSearch.toLowerCase();
        return q ? contacts.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)) : contacts;
    }, [contacts, contactSearch]);

    const selectedTemplate = templates.find(t => t.name === templateName);
    const bodyText = selectedTemplate?.components?.find((c: any) => c.type === "BODY")?.text || "";
    const varCount = (bodyText.match(/\{\{\d+\}\}/g) || []).length;

    const resetForm = () => {
        setSelectedContact(null); setMsgType("text"); setMessageText("");
        setTemplateName(""); setTemplateParams([]); setScheduleMode("delay");
        setDelayValue(30); setDelayUnit("minutes"); setFixedDatetime("");
        setAfterDelay(30); setContactSearch("");
    };

    const handleSubmit = async () => {
        if (!selectedContact) { toast.error("Select a contact"); return; }
        if (msgType === "text" && !messageText.trim()) { toast.error("Enter message text"); return; }
        if (msgType === "template" && !templateName) { toast.error("Select a template"); return; }
        if (scheduleMode === "fixed" && !fixedDatetime) { toast.error("Set a date and time"); return; }

        setIsSubmitting(true);
        const result = await createScheduledMessageAction({
            contactId: selectedContact.id,
            type: msgType,
            messageText: msgType === "text" ? messageText : undefined,
            templateName: msgType === "template" ? templateName : undefined,
            templateParameters: msgType === "template" ? templateParams : undefined,
            scheduleMode,
            delayValue: scheduleMode === "delay" ? delayValue : undefined,
            delayUnit:  scheduleMode === "delay" ? delayUnit  : undefined,
            fixedDatetime: scheduleMode === "fixed" ? fixedDatetime : undefined,
            afterMessageDelayMinutes: scheduleMode === "after_message" ? afterDelay : undefined,
        });
        setIsSubmitting(false);

        if (result.success) {
            toast.success("Message scheduled!");
            setShowForm(false);
            resetForm();
            window.location.reload();
        } else {
            toast.error(result.error || "Failed to schedule message");
        }
    };

    const handleCancel = async (id: string) => {
        setCancellingId(id);
        const result = await cancelScheduledMessageAction(id);
        setCancellingId(null);
        if (result.success) {
            setSchedules(s => s.map(x => x.id === id ? { ...x, status: "CANCELLED" } : x));
            toast.success("Schedule cancelled");
        } else {
            toast.error(result.error || "Failed to cancel");
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-white sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground">Message Scheduler</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {schedules.filter(s => s.status === "PENDING").length} pending · {schedules.filter(s => s.status === "SENT").length} sent
                    </p>
                </div>
                <Button onClick={() => { setShowForm(v => !v); resetForm(); }} className="h-10 px-4 rounded-xl font-bold text-sm shadow-glow">
                    {showForm ? <><X className="w-4 h-4 mr-2" />Cancel</> : <><Plus className="w-4 h-4 mr-2" />New Schedule</>}
                </Button>
            </div>

            <div className="flex-1 overflow-hidden flex">
                {/* List */}
                <div className={`flex flex-col overflow-hidden transition-all duration-300 ${showForm ? "w-1/2 border-r border-border" : "flex-1"}`}>
                    <div className="p-6 border-b border-border">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search schedules…"
                                className="pl-10 h-10 bg-secondary/50 border-none rounded-xl" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredSchedules.length === 0 ? (
                            <div className="py-28 flex flex-col items-center gap-4 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <CalendarClock className="w-8 h-8 text-primary/40" />
                                </div>
                                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/40">No scheduled messages yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {filteredSchedules.map(s => <ScheduleRow key={s.id} schedule={s} onCancel={handleCancel} cancellingId={cancellingId} />)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Form panel */}
                {showForm && (
                    <div className="w-1/2 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                            <h2 className="text-lg font-black tracking-tight">Create Schedule</h2>

                            {/* Contact picker */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Contact</label>
                                <div className="relative">
                                    <button onClick={() => setContactOpen(v => !v)}
                                        className="w-full h-11 px-4 rounded-xl bg-secondary/50 border-none text-left flex items-center justify-between font-medium text-sm">
                                        {selectedContact ? (
                                            <span className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-primary" />
                                                <span className="font-black">{selectedContact.name}</span>
                                                <span className="text-muted-foreground text-xs">{selectedContact.phone}</span>
                                            </span>
                                        ) : <span className="text-muted-foreground">Pick a contact…</span>}
                                        <ChevronDown className="w-4 h-4 text-muted-foreground/50" />
                                    </button>
                                    {contactOpen && (
                                        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-border rounded-xl shadow-elevated z-20 overflow-hidden">
                                            <div className="p-2 border-b border-border">
                                                <Input value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                                                    placeholder="Search contacts…" className="h-9 bg-secondary/50 border-none rounded-lg text-sm" />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                {filteredContacts.map(c => (
                                                    <button key={c.id} onClick={() => { setSelectedContact(c); setContactOpen(false); setContactSearch(""); }}
                                                        className="w-full px-4 py-2.5 text-left hover:bg-secondary/50 flex items-center gap-3 transition-colors">
                                                        <span className="font-black text-sm">{c.name}</span>
                                                        <span className="text-muted-foreground text-xs">{c.phone}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Message type */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Message Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {([["text", "Text Message", MessageSquare], ["template", "Template", Layout]] as const).map(([val, lbl, Icon]) => (
                                        <button key={val} onClick={() => setMsgType(val as MessageType)}
                                            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${msgType === val ? "border-primary bg-primary/5 text-primary" : "border-border bg-white text-muted-foreground hover:border-primary/30"}`}>
                                            <Icon className="w-4 h-4" />{lbl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message content */}
                            {msgType === "text" ? (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Message</label>
                                    <textarea value={messageText} onChange={e => setMessageText(e.target.value)}
                                        placeholder="Type your message…"
                                        className="w-full min-h-[100px] rounded-xl bg-secondary/50 border-none px-4 py-3 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Template</label>
                                        <select value={templateName} onChange={e => { setTemplateName(e.target.value); setTemplateParams([]); }}
                                            className="w-full h-11 rounded-xl bg-secondary/50 border-none px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                                            <option value="">Select a template…</option>
                                            {templates.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    {varCount > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Variables</p>
                                            {Array.from({ length: varCount }, (_, i) => (
                                                <Input key={i} value={templateParams[i] || ""}
                                                    onChange={e => { const p = [...templateParams]; p[i] = e.target.value; setTemplateParams(p); }}
                                                    placeholder={`{{${i + 1}}} value`}
                                                    className="h-10 bg-secondary/50 border-none rounded-xl px-4 text-sm font-medium" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Schedule mode */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Schedule Mode</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(Object.entries(MODE_CONFIG) as [ScheduleMode, typeof MODE_CONFIG[ScheduleMode]][]).map(([val, cfg]) => {
                                        const Icon = cfg.icon;
                                        return (
                                            <button key={val} onClick={() => setScheduleMode(val)}
                                                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 font-bold text-xs transition-all text-center ${scheduleMode === val ? "border-primary bg-primary/5 text-primary" : "border-border bg-white text-muted-foreground hover:border-primary/30"}`}>
                                                <Icon className="w-4 h-4" />{cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-muted-foreground/50 font-medium pl-1">{MODE_CONFIG[scheduleMode].desc}</p>
                            </div>

                            {/* Mode-specific inputs */}
                            {scheduleMode === "delay" && (
                                <div className="flex gap-3">
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Amount</label>
                                        <Input type="number" min={1} value={delayValue} onChange={e => setDelayValue(Number(e.target.value))}
                                            className="h-11 bg-secondary/50 border-none rounded-xl px-4 font-bold text-center" />
                                    </div>
                                    <div className="w-36 space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Unit</label>
                                        <select value={delayUnit} onChange={e => setDelayUnit(e.target.value as any)}
                                            className="w-full h-11 rounded-xl bg-secondary/50 border-none px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                                            <option value="minutes">Minutes</option>
                                            <option value="hours">Hours</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            {scheduleMode === "fixed" && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Send At</label>
                                    <Input type="datetime-local" value={fixedDatetime} onChange={e => setFixedDatetime(e.target.value)}
                                        className="h-11 bg-secondary/50 border-none rounded-xl px-4 font-medium" />
                                </div>
                            )}
                            {scheduleMode === "after_message" && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Delay after contact replies (minutes)</label>
                                    <Input type="number" min={0} value={afterDelay} onChange={e => setAfterDelay(Number(e.target.value))}
                                        className="h-11 bg-secondary/50 border-none rounded-xl px-4 font-bold text-center" />
                                    <p className="text-[10px] text-primary/50 font-bold pl-1">The message fires when this contact next sends you a message.</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}
                                    className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-muted-foreground">Cancel</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest shadow-glow">
                                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Scheduling…</> : "Schedule Message"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ScheduleRow({ schedule: s, onCancel, cancellingId }: { schedule: Schedule; onCancel: (id: string) => void; cancellingId: string | null }) {
    const cfg = STATUS_CONFIG[s.status];
    const Icon = cfg.icon;
    const ModeIcon = MODE_CONFIG[s.scheduleMode].icon;

    const scheduledLabel = s.scheduleMode === "after_message" && !s.scheduledAt
        ? "Waiting for reply…"
        : s.scheduledAt
            ? new Date(s.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
            : "—";

    return (
        <div className="flex items-center gap-4 px-6 py-4 hover:bg-secondary/30 transition-colors">
            {/* Mode icon */}
            <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                <ModeIcon className="w-4 h-4 text-primary/60" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-sm text-foreground">{s.contactName}</p>
                    <span className="text-muted-foreground/40 text-xs">{s.contactPhone}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs font-medium text-muted-foreground">
                        {s.type === "text" ? `"${(s.messageText || "").slice(0, 40)}…"` : `Template: ${s.templateName}`}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground/40" />
                    <span className="text-[11px] text-muted-foreground/60 font-medium">{scheduledLabel}</span>
                </div>
                {s.status === "FAILED" && s.errorMessage && (
                    <p className="text-[10px] text-destructive mt-0.5 font-medium">{s.errorMessage}</p>
                )}
            </div>

            {/* Status + action */}
            <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${cfg.cls}`}>
                    <Icon className="w-3 h-3" />{cfg.label}
                </span>
                {s.status === "PENDING" && (
                    <Button variant="ghost" size="icon" onClick={() => onCancel(s.id)}
                        disabled={cancellingId === s.id}
                        className="h-8 w-8 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all">
                        {cancellingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    </Button>
                )}
            </div>
        </div>
    );
}
