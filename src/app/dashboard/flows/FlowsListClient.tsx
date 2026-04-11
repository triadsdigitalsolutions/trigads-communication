"use client";

import { useState } from "react";
import { Zap, Plus, Settings2, Play, Pause, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { createFlowAction, toggleFlowAction } from "@/app/actions/flows";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface Flow {
    id: string;
    name: string;
    description: string | null;
    trigger: string;
    isActive: boolean;
    updatedAt: Date;
}

export default function FlowsListClient({ initialFlows }: { initialFlows: any[] }) {
    const [flows, setFlows] = useState(initialFlows);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newFlowName, setNewFlowName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateFlow = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFlowName.trim()) return;

        setIsCreating(true);
        const result = await createFlowAction(newFlowName);
        setIsCreating(false);

        if (result.success) {
            toast.success("Automation flow initialized.");
            setFlows([result.flow, ...flows]);
            setIsCreateOpen(false);
            setNewFlowName("");
        } else {
            toast.error("Process failed: " + result.error);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        const result = await toggleFlowAction(id, !currentStatus);
        if (result.success) {
            setFlows(flows.map(f => f.id === id ? { ...f, isActive: !currentStatus } : f));
            toast.success(!currentStatus ? "Flow activated." : "Flow deactivated.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-xl p-5 rounded-2xl border border-border shadow-premium">
                <div className="flex gap-8">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Active Systems</p>
                        <p className="text-2xl font-black text-foreground">{flows.filter(f => f.isActive).length}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Total Workflows</p>
                        <p className="text-2xl font-black text-foreground">{flows.length}</p>
                    </div>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-10 px-6 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-glow hover:shadow-glow-lg transition-all active:scale-95 flex items-center gap-2 text-xs">
                            <Plus className="w-4 h-4 stroke-[3px]" />
                            Forge New Flow
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-none rounded-[3.5rem] p-12 max-w-xl shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-4xl font-black tracking-tighter mb-8 bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent italic">Initialize Automation</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateFlow} className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60 ml-4">Flow Identifier</label>
                                <Input
                                    placeholder="e.g. Welcome Sequence"
                                    value={newFlowName}
                                    onChange={(e) => setNewFlowName(e.target.value)}
                                    className="h-20 bg-secondary/30 border-none rounded-[2rem] px-8 text-xl font-bold focus-visible:ring-primary/20 transition-all shadow-inner"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isCreating}
                                className="w-full h-20 rounded-[2rem] font-black text-xl uppercase tracking-[0.2em] shadow-glow-lg active:scale-95 transition-all"
                            >
                                {isCreating ? "Constructing..." : "Commence Engineering"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto">
                {flows.length === 0 ? (
                    <div className="col-span-full p-32 flex flex-col items-center justify-center gap-6 bg-secondary/10 rounded-[4rem] border-2 border-dashed border-border group">
                        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-premium group-hover:scale-110 transition-transform duration-700">
                            <Zap className="w-10 h-10 text-muted-foreground/20" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/30 italic">Automated logic pending</p>
                    </div>
                ) : (
                    flows.map((flow) => (
                        <div
                            key={flow.id}
                            className="group relative bg-white rounded-2xl p-5 border border-border shadow-premium hover:shadow-glow-soft transition-all duration-700 overflow-hidden"
                        >
                            {/* Status Indicator */}
                            <div className={`absolute top-0 right-0 w-32 h-1 bg-gradient-to-l ${flow.isActive ? 'from-green-500 to-transparent' : 'from-muted-foreground/20 to-transparent'}`} />

                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black tracking-tighter text-foreground group-hover:text-primary transition-colors duration-500">{flow.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${flow.isActive ? 'bg-green-500 shadow-glow' : 'bg-muted-foreground/30'}`} />
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            {flow.isActive ? 'System Live' : 'Stationary'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleToggle(flow.id, flow.isActive)}
                                        className={`h-8 w-8 rounded-xl transition-all duration-500 ${flow.isActive ? 'bg-destructive/5 text-destructive hover:bg-destructive/10' : 'bg-green-500/5 text-green-600 hover:bg-green-500/10'}`}
                                    >
                                        {flow.isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                    </Button>
                                    <Link href={`/dashboard/flows/${flow.id}`}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-all duration-500"
                                        >
                                            <Settings2 className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <div className="p-4 bg-secondary/20 rounded-xl border border-white/40 mb-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Trigger</p>
                                    <span className="px-2 py-0.5 bg-white rounded-full text-[9px] font-black text-primary border border-border">{flow.trigger}</span>
                                </div>
                                <p className="text-xs font-semibold text-foreground/70 leading-relaxed italic line-clamp-2">
                                    {flow.description || "Experimental automation sequence with undefined parameters."}
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/30">Sync: {new Date(flow.updatedAt).toLocaleDateString()}</span>
                                <Link
                                    href={`/dashboard/flows/${flow.id}`}
                                    className="flex items-center gap-2 group/link"
                                >
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary group-hover/link:mr-1 transition-all">Enter Lab</span>
                                    <ArrowRight className="w-3 h-3 text-primary" />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
