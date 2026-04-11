"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    ReactFlow,
    addEdge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Panel,
    Connection,
    Edge,
    ReactFlowInstance,
    Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { StartNode, MessageNode, WaitNode, ConditionNode } from './nodes/FlowNodes';
import { Button } from "@/components/ui/button";
import { Zap, Save, ChevronLeft, Layout, MousePointer2, Plus, MessageCircle, Clock, Split, Play, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { updateFlowDefinitionAction } from '@/app/actions/flows';
import { getTemplatesAction } from '@/app/actions/whatsapp';
import { toast } from 'sonner';
import PropertiesPanel from './PropertiesPanel';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const nodeTypes = {
    start: StartNode,
    message: MessageNode,
    wait: WaitNode,
    condition: ConditionNode,
};

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'start',
        position: { x: 250, y: 5 },
        data: {
            triggerType: 'ON_MESSAGE',
            keyword: '',
        },
    },
];

export default function FlowEditor({ flow }: { flow: any }) {
    const [nodes, setNodes, onNodesChange] = useNodesState(flow.definition.nodes && flow.definition.nodes.length > 0 ? flow.definition.nodes : initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(flow.definition.edges || []);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [templates, setTemplates] = useState<any[]>([]);

    const onDeleteNode = useCallback((id: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== id));
        toast.success("Block deconstructed from logic grid.");
    }, [setNodes]);

    // Inject onDelete into nodes after initialization and whenever they change (e.g. from DB load)
    useEffect(() => {
        setNodes((nds) => nds.map((node) => {
            if (node.data.onDelete === onDeleteNode) return node;
            return {
                ...node,
                data: { ...node.data, onDelete: onDeleteNode }
            };
        }));
    }, [onDeleteNode, setNodes]);

    useEffect(() => {
        const fetchTemplates = async () => {
            const result = await getTemplatesAction();
            if (result.success && result.templates) {
                setTemplates(result.templates);
            }
        };
        fetchTemplates();
    }, []);

    const onNodeClick = useCallback((_: any, node: Node) => {
        setSelectedNodeId(node.id);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    const onNodeDataChange = useCallback((nodeId: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: { ...node.data, ...newData } };
                }
                return node;
            })
        );
    }, [setNodes]);

    const selectedNode = useMemo(
        () => nodes.find((node) => node.id === selectedNodeId),
        [nodes, selectedNodeId]
    );

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onSave = useCallback(async () => {
        if (reactFlowInstance) {
            setIsSaving(true);
            const flowData = reactFlowInstance.toObject();

            // Extract trigger settings from the Start node
            const startNode = flowData.nodes.find(n => n.type === 'start');
            const triggerType = startNode?.data?.triggerType || 'ON_MESSAGE';
            const keyword = startNode?.data?.keyword || '';

            // Critical fix: Strip out non-serializable functions (onDelete) from nodes before sending to server
            // This prevents "Functions cannot be passed to Server Action" errors.
            const sanitizedNodes = flowData.nodes.map(node => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { onDelete, ...cleanData } = node.data;
                return { ...node, data: cleanData };
            });

            const sanitizedFlowData = {
                ...flowData,
                nodes: sanitizedNodes
            };

            const result = await updateFlowDefinitionAction(flow.id, sanitizedFlowData, triggerType as any, keyword as string);
            setIsSaving(false);

            if (result.success) {
                toast.success("Logic architecture committed to persistence.");
            } else {
                toast.error("Protocol failure: " + result.error);
            }
        }
    }, [reactFlowInstance, flow.id]);

    const handleReset = useCallback(() => {
        setNodes(initialNodes);
        setEdges([]);
        setIsResetOpen(false);
        toast.success("Canvas reset to baseline configuration.");
    }, [setNodes, setEdges]);

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!reactFlowInstance) return;

            const type = event.dataTransfer.getData('application/reactflow');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: `node_${Date.now()}`,
                type,
                position,
                data: {
                    label: `${type} node`,
                    onDelete: onDeleteNode,
                    // Initial defaults for different types
                    ...(type === 'message' ? { mode: 'text', text: '' } : {}),
                    ...(type === 'wait' ? { duration: '5', unit: 'Minutes' } : {}),
                    ...(type === 'condition' ? { variable: 'last message' } : {}),
                },
            };

            setNodes((nds) => nds.concat(newNode));
            setSelectedNodeId(newNode.id);
        },
        [reactFlowInstance, setNodes]
    );

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
            {/* Minimalist Editor Header */}
            <header className="h-24 bg-white/50 backdrop-blur-2xl border-b border-border px-10 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard/flows">
                        <Button variant="ghost" size="icon" className="group rounded-2xl h-14 w-14 bg-secondary/50 border border-border/50 hover:bg-primary/10 hover:border-primary/20 transition-all">
                            <ChevronLeft className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-black tracking-tighter text-foreground italic uppercase">Lab: {flow.name}</h2>
                            <span className={`px-3 py-0.5 rounded-full text-[9px] font-black border tracking-widest uppercase ${flow.isActive ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                {flow.isActive ? 'Live System' : 'Draft'}
                            </span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Visual Logic Architect</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="h-14 px-6 rounded-2xl bg-destructive/5 text-destructive hover:bg-destructive/10 border border-destructive/10 transition-all flex items-center gap-2">
                                <RotateCcw className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Reset Lab</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-none rounded-[3rem] p-12 max-w-md shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-black tracking-tighter text-destructive italic uppercase mb-4">Confirm Reset</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-8">
                                <p className="text-sm font-bold text-muted-foreground leading-relaxed italic">
                                    Executing this protocol will clear all nodes and connections from the grid. This action is irreversible.
                                </p>
                                <div className="flex gap-4">
                                    <Button onClick={() => setIsResetOpen(false)} variant="ghost" className="flex-1 h-16 rounded-[1.5rem] font-bold uppercase tracking-widest hover:bg-secondary/50">Abort</Button>
                                    <Button onClick={handleReset} className="flex-1 h-16 rounded-[1.5rem] bg-destructive text-white font-black uppercase tracking-widest shadow-lg shadow-destructive/20 hover:bg-destructive/90">Confirm Wipe</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div className="flex items-center gap-2 px-6 h-14 bg-secondary/30 rounded-2xl border border-border/50">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-glow animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Auto-sync Active</span>
                    </div>
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-glow transition-all active:scale-95 flex items-center gap-3"
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-3">
                                <RotateCcw className="w-5 h-5 animate-spin" />
                                Engineering...
                            </div>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Commit Changes
                            </>
                        )}
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Visual Palette Sidebar */}
                <aside className="w-96 bg-white/40 backdrop-blur-3xl border-r border-border p-10 flex flex-col gap-10 shrink-0 overflow-y-auto z-10">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.4em] text-muted-foreground mb-8 opacity-40 italic">Logic Components</h3>
                        <div className="space-y-6">
                            <PaletteItem
                                icon={<MessageCircle className="w-5 h-5" />}
                                title="Message Block"
                                description="Dispatch automated WhatsApp content."
                                type="message"
                                color="blue"
                                onDragStart={onDragStart}
                            />
                            <PaletteItem
                                icon={<Clock className="w-5 h-5" />}
                                title="Wait Protocol"
                                description="Introduce temporal displacement."
                                type="wait"
                                color="amber"
                                onDragStart={onDragStart}
                            />
                            <PaletteItem
                                icon={<Split className="w-5 h-5" />}
                                title="Logic Gate"
                                description="Conditional path divergence."
                                type="condition"
                                color="purple"
                                onDragStart={onDragStart}
                            />
                        </div>
                    </div>

                    <div className="mt-auto">
                        <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 space-y-4">
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-primary fill-primary/20" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Proton Engine</span>
                            </div>
                            <p className="text-[11px] font-bold text-muted-foreground leading-relaxed italic opacity-70">
                                Drag components onto the grid to architect your conversation flow. Connect handles to define causality.
                            </p>
                        </div>
                    </div>
                </aside>

                {/* Main Node Canvas */}
                <main className="flex-1 relative bg-secondary/10 overflow-hidden flex">
                    <div className="flex-1 relative">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onInit={setReactFlowInstance}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onNodeClick={onNodeClick}
                            onPaneClick={onPaneClick}
                            nodeTypes={nodeTypes}
                            className="bg-dots-pattern"
                            snapToGrid
                            fitView
                        >
                            <Background color="#ccc" variant={"dots" as any} gap={40} size={1} />
                            <Controls className="bg-white border-border shadow-premium rounded-xl" />
                            <MiniMap
                                className="bg-white/80 border-border shadow-premium rounded-[2rem] p-2"
                                nodeColor={(node) => {
                                    if (node.type === 'start') return '#16a34a';
                                    if (node.type === 'message') return '#3b82f6';
                                    if (node.type === 'wait') return '#f59e0b';
                                    if (node.type === 'condition') return '#a855f7';
                                    return '#eee';
                                }}
                            />
                        </ReactFlow>
                    </div>

                    {/* Properties Panel Integration */}
                    {selectedNode && (
                        <PropertiesPanel
                            node={selectedNode}
                            templates={templates}
                            onChange={(newData: any) => onNodeDataChange(selectedNode.id, newData)}
                            onClose={() => setSelectedNodeId(null)}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}

function PaletteItem({ icon, title, description, type, color, onDragStart }: any) {
    const colorClasses: any = {
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    };

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className="group cursor-grab active:cursor-grabbing p-6 bg-white/60 border border-border rounded-[2rem] hover:shadow-glow-soft hover:border-primary/30 transition-all duration-500"
        >
            <div className="flex items-center gap-4 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorClasses[color]}`}>
                    {icon}
                </div>
                <h4 className="font-black text-[13px] uppercase tracking-wider text-foreground">{title}</h4>
            </div>
            <p className="text-[11px] font-bold text-muted-foreground/60 leading-tight italic ml-4">
                {description}
            </p>
        </div>
    );
}
