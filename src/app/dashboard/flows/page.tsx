import { getFlowsAction } from "@/app/actions/flows";
import { Zap, Plus, Settings2, Play, Pause, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import FlowsListClient from "./FlowsListClient";

export default async function FlowsPage() {
    const flows = await getFlowsAction();

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                        <Zap className="w-4 h-4 text-primary fill-primary/20" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Automation Engine</span>
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter text-foreground">Flows</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium leading-relaxed">
                        Design intelligent WhatsApp conversation paths with our high-precision node editor.
                    </p>
                </div>

                <FlowCreationDialog />
            </div>

            {/* Flows Grid/List */}
            <FlowsListClient initialFlows={flows} />
        </div>
    );
}

function FlowCreationDialog() {
    // This will be handled by the client component for better UX
    return null;
}
