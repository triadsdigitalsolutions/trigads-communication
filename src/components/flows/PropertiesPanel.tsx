"use client";

import React from 'react';
import { X, MessageCircle, Clock, Split, Trash2, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PropertiesPanelProps {
    node: any;
    templates: any[];
    onChange: (newData: any) => void;
    onClose: () => void;
}

export default function PropertiesPanel({ node, templates, onChange, onClose }: PropertiesPanelProps) {
    const data = node.data;

    return (
        <aside className="w-[400px] bg-white border-l border-border flex flex-col z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.05)]">
            <div className="h-24 px-8 flex items-center justify-between border-b border-border bg-secondary/5">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${node.type === 'message' ? 'bg-blue-500/10 text-blue-600' :
                        node.type === 'wait' ? 'bg-amber-500/10 text-amber-600' :
                            node.type === 'condition' ? 'bg-purple-500/10 text-purple-600' :
                                'bg-primary/10 text-primary'
                        }`}>
                        {node.type === 'message' && <MessageCircle className="w-5 h-5" />}
                        {node.type === 'wait' && <Clock className="w-5 h-5" />}
                        {node.type === 'condition' && <Split className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest italic">{node.type} Configuration</h3>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Node ID: {node.id}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/5 hover:text-destructive transition-all">
                    <X className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Start Node Config */}
                {node.type === 'start' && (
                    <div className="space-y-8">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-4 block italic">Activation Protocol</label>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => onChange({ triggerType: 'ON_MESSAGE', keyword: '' })}
                                    className={`p-6 rounded-[1.5rem] border text-left transition-all ${data.triggerType !== 'KEYWORD' ? 'bg-primary/5 border-primary/40 ring-2 ring-primary/10' : 'bg-white border-border hover:border-primary/20'}`}
                                >
                                    <div className="flex items-center gap-3 mb-1">
                                        <Zap className="w-4 h-4 text-primary" />
                                        <span className="text-[11px] font-black uppercase tracking-widest italic">Any Entry Trigger</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-muted-foreground/60 italic leading-relaxed">System activates on any incoming communication stimulus.</p>
                                </button>
                                <button
                                    onClick={() => onChange({ triggerType: 'KEYWORD' })}
                                    className={`p-6 rounded-[1.5rem] border text-left transition-all ${data.triggerType === 'KEYWORD' ? 'bg-primary/5 border-primary/40 ring-2 ring-primary/10' : 'bg-white border-border hover:border-primary/20'}`}
                                >
                                    <div className="flex items-center gap-3 mb-1">
                                        <ArrowRight className="w-4 h-4 text-primary" />
                                        <span className="text-[11px] font-black uppercase tracking-widest italic">Specific Message Match</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-muted-foreground/60 italic leading-relaxed">Activates only when user input contains a precise keyword.</p>
                                </button>
                            </div>
                        </div>

                        {data.triggerType === 'KEYWORD' && (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 block italic">Keyword Logic</label>
                                <Input
                                    value={data.keyword || ""}
                                    onChange={(e) => onChange({ keyword: e.target.value })}
                                    className="h-16 rounded-2xl border-2 border-primary/20 bg-primary/5 px-6 font-black text-lg italic outline-none placeholder:text-muted-foreground/30"
                                    placeholder="Enter trigger keyword..."
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Message Node Config */}
                {node.type === 'message' && (
                    <div className="space-y-8">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-4 block italic">Transmission Protocol</label>
                            <div className="grid grid-cols-2 gap-2 p-1.5 bg-secondary/20 rounded-2xl border border-border/50">
                                <button
                                    onClick={() => onChange({ mode: 'text' })}
                                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${data.mode !== 'template' ? 'bg-white shadow-sm text-primary border border-border/50' : 'text-muted-foreground/50 hover:text-muted-foreground'
                                        }`}
                                >
                                    Custom Text
                                </button>
                                <button
                                    onClick={() => onChange({ mode: 'template' })}
                                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${data.mode === 'template' ? 'bg-white shadow-sm text-primary border border-border/50' : 'text-muted-foreground/50 hover:text-muted-foreground'
                                        }`}
                                >
                                    Meta Template
                                </button>
                            </div>
                        </div>

                        {data.mode === 'template' ? (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 block italic">Catalog Selection</label>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {templates.length === 0 && (
                                        <p className="text-xs font-bold text-muted-foreground italic">No Meta-approved templates found.</p>
                                    )}
                                    {templates.map((t) => (
                                        <div
                                            key={t.id}
                                            onClick={() => onChange({ templateName: t.name, text: t.name })}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${data.templateName === t.name
                                                ? 'bg-primary/5 border-primary/40 ring-2 ring-primary/10'
                                                : 'bg-white border-border hover:border-primary/20 hover:bg-secondary/5'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-black tracking-tighter uppercase italic">{t.name}</span>
                                                <span className="text-[9px] font-bold px-2 py-0.5 bg-secondary rounded-lg text-muted-foreground/70 uppercase">{t.category}</span>
                                            </div>
                                            <p className="text-[10px] font-medium text-muted-foreground/60 leading-tight line-clamp-2 italic">
                                                {(t.components as any[]).find(c => c.type === 'BODY')?.text || "No preview available..."}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 block italic">Payload Discovery</label>
                                <textarea
                                    value={data.text || ""}
                                    onChange={(e) => onChange({ text: e.target.value })}
                                    className="w-full h-40 p-6 bg-secondary/5 border-2 border-border/30 rounded-3xl outline-none focus:border-primary/20 transition-all text-sm font-bold text-foreground italic placeholder:text-muted-foreground/30 resize-none leading-relaxed"
                                    placeholder="Engineer your automated message here..."
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Wait Node Config */}
                {node.type === 'wait' && (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 block italic">Temporal Quantity</label>
                            <Input
                                type="number"
                                value={data.duration || "5"}
                                onChange={(e) => onChange({ duration: e.target.value })}
                                className="h-16 rounded-2xl border-2 border-border/30 bg-secondary/5 px-6 font-black text-xl italic outline-none"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 block italic">Chrono Unit</label>
                            <div className="flex flex-wrap gap-2">
                                {['Seconds', 'Minutes', 'Hours', 'Days'].map((unit) => (
                                    <button
                                        key={unit}
                                        onClick={() => onChange({ unit })}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${data.unit === unit
                                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 shadow-sm'
                                            : 'bg-white border-border text-muted-foreground/50 hover:border-amber-500/20 hover:text-amber-500/60'
                                            }`}
                                    >
                                        {unit}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Condition Node Config */}
                {node.type === 'condition' && (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 block italic">Logic Sensitivity</label>
                            <p className="text-[11px] font-bold text-muted-foreground/60 italic leading-relaxed">
                                The system will diverge the conversation path if the incoming payload contains the following trigger:
                            </p>
                            <Input
                                value={data.variable || ""}
                                onChange={(e) => onChange({ variable: e.target.value })}
                                className="h-16 rounded-2xl border-2 border-purple-500/20 bg-purple-500/5 px-6 font-black text-lg italic outline-none placeholder:text-muted-foreground/30"
                                placeholder="Enter keyword logic..."
                            />
                        </div>
                        <div className="p-6 bg-secondary/20 rounded-3xl border border-border/50 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">True Sequence: Matches trigger</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-destructive" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">False Sequence: No match found</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-10 border-t border-border/50">
                    <Button
                        variant="ghost"
                        onClick={() => data.onDelete(node.id)}
                        className="w-full h-16 rounded-2xl bg-destructive/5 text-destructive font-black uppercase tracking-widest border border-destructive/10 hover:bg-destructive/10 flex items-center gap-3"
                    >
                        <Trash2 className="w-5 h-5" />
                        Decommission Block
                    </Button>
                </div>
            </div>
        </aside>
    );
}
