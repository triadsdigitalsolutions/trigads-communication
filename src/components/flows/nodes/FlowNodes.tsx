"use client";

import { Handle, Position } from '@xyflow/react';
import { Play, MessageCircle, Clock, Split, Zap, Settings2, Trash2, MousePointerClick, List, Image as ImageIcon } from 'lucide-react';

const nodeBaseClass = "relative min-w-[280px] bg-white/80 backdrop-blur-2xl border border-white/40 rounded-[2rem] shadow-premium overflow-visible group transition-all duration-500 hover:shadow-glow-soft hover:border-primary/20";

export const StartNode = ({ data }: any) => {
    return (
        <div className={nodeBaseClass}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/40" />
            <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Play className="w-6 h-6 text-primary fill-primary/20" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Trigger Block</p>
                        <h4 className="font-black text-xl text-foreground">Entry Point</h4>
                    </div>
                </div>
                <div className="bg-secondary/20 p-4 rounded-2xl border border-white/50">
                    <p className="text-xs font-bold text-muted-foreground/80 leading-relaxed italic">
                        {data.triggerType === 'KEYWORD' ? (
                            <>Matches keyword: <span className="text-primary font-black uppercase tracking-tighter ml-1">"{data.keyword || "..."}"</span></>
                        ) : (
                            "System awaits incoming message stimulus."
                        )}
                    </p>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-primary border-4 border-white shadow-sm !-bottom-2" />
        </div>
    );
};

export const MessageNode = ({ data, id }: any) => {
    return (
        <div className={nodeBaseClass}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-300" />
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                            {data.mode === 'template' ? <Zap className="w-6 h-6 text-blue-500" /> : 
                             data.mode === 'interactive_button' ? <MousePointerClick className="w-6 h-6 text-blue-500" /> :
                             data.mode === 'interactive_list' ? <List className="w-6 h-6 text-blue-500" /> :
                             <MessageCircle className="w-6 h-6 text-blue-500" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/60">
                                {data.mode === 'template' ? 'Meta Template' : 
                                 data.mode === 'interactive_button' ? 'Interactive Buttons' :
                                 data.mode === 'interactive_list' ? 'Interactive List' : 'Communication'}
                            </p>
                            <h4 className="font-black text-xl text-foreground">
                                {data.mode === 'template' ? 'Official Relay' : 
                                 data.mode === 'interactive_button' ? 'Quick Replies' :
                                 data.mode === 'interactive_list' ? 'Menu List' : 'Send Message'}
                            </h4>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Trash2
                            className="w-4 h-4 text-muted-foreground/30 hover:text-destructive transition-colors cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
                        />
                    </div>
                </div>
                <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10 space-y-2">
                    {data.mediaUrl && (
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-500/10 p-2 rounded-xl">
                            <ImageIcon className="w-4 h-4" /> Media Attached
                        </div>
                    )}
                    <p className="text-[13px] font-semibold text-foreground/80 leading-relaxed truncate italic">
                        {data.mode === 'template' ? (
                            <span className="text-blue-600 uppercase text-[11px] font-black">ID: {data.templateName || "Unselected"}</span>
                        ) : (
                            data.text || "Message content pending transcription..."
                        )}
                    </p>
                    {data.mode === 'interactive_button' && (
                        <div className="flex gap-2 mt-2">
                            {(data.buttons || []).map((b: any, i: number) => (
                                <span key={i} className="px-2 py-1 bg-white rounded-lg border text-[10px] font-bold text-primary truncate max-w-[80px]">
                                    {b.title || "Btn"}
                                </span>
                            ))}
                        </div>
                    )}
                    {data.mode === 'interactive_list' && (
                        <div className="mt-2 px-3 py-1.5 bg-white rounded-xl border text-xs font-bold text-primary text-center">
                            {data.listButtonText || "View List"}
                        </div>
                    )}
                </div>
            </div>
            <Handle type="target" position={Position.Top} className="w-4 h-4 bg-blue-500 border-4 border-white shadow-sm !-top-2" />
            <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-blue-500 border-4 border-white shadow-sm !-bottom-2" />
        </div>
    );
};

export const WaitNode = ({ data, id }: any) => {
    return (
        <div className={nodeBaseClass}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-300" />
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60">Chronos</p>
                            <h4 className="font-black text-xl text-foreground">Time Delay</h4>
                        </div>
                    </div>
                    <Trash2
                        className="w-4 h-4 text-muted-foreground/30 hover:text-destructive transition-colors cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
                    />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-amber-600">{data.duration || "5"}</span>
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">{data.unit || "Minutes"}</span>
                </div>
            </div>
            <Handle type="target" position={Position.Top} className="w-4 h-4 bg-amber-500 border-4 border-white shadow-sm !-top-2" />
            <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-amber-500 border-4 border-white shadow-sm !-bottom-2" />
        </div>
    );
};

export const ConditionNode = ({ data, id }: any) => {
    return (
        <div className={nodeBaseClass}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-300" />
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                            <Split className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500/60">Logic Gate</p>
                            <h4 className="font-black text-xl text-foreground">Condition</h4>
                        </div>
                    </div>
                    <Trash2
                        className="w-4 h-4 text-muted-foreground/30 hover:text-destructive transition-colors cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
                    />
                </div>
                <div className="bg-purple-500/5 p-4 rounded-2xl border border-purple-500/10 mb-4">
                    <p className="text-xs font-bold text-foreground/70 italic text-center truncate">
                        IF contains: {data.variable || "..."}
                    </p>
                </div>
                <div className="flex justify-between px-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500/80">True Path</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-destructive/80">False Path</span>
                </div>
            </div>
            <Handle type="target" position={Position.Top} className="w-4 h-4 bg-purple-500 border-4 border-white shadow-sm !-top-2" />
            <Handle type="source" position={Position.Bottom} id="true" className="w-4 h-4 bg-green-500 border-4 border-white shadow-sm !-bottom-2 !left-[30%]" />
            <Handle type="source" position={Position.Bottom} id="false" className="w-4 h-4 bg-destructive border-4 border-white shadow-sm !-bottom-2 !left-[70%]" />
        </div>
    );
};
