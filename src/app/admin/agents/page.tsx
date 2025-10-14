'use client';

import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Header } from '@/components/header';
import Link from 'next/link';

// This corresponds to the AdminAgent entity in backend.json, without server-generated fields
type AdminAgentForm = {
  name: string;
  avatarUrl: string;
  pricePerSecondCredits: number;
  status: 'active' | 'paused' | 'archived';
  visibility: 'admin-only' | 'public';
};

const initialAgentState: AdminAgentForm = {
    name: '',
    avatarUrl: '',
    pricePerSecondCredits: 0.10,
    status: 'active',
    visibility: 'admin-only',
};


export default function AdminAgentsPage() {
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AdminAgentForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const agentsCollectionRef = useMemoFirebase(
    () => collection(firestore, 'adminAgents'),
    [firestore]
  );
  const { data: agents, isLoading } = useCollection<any>(agentsCollectionRef);

  const openNewAgentDialog = () => {
    setCurrentAgent(initialAgentState);
    setEditingId(null);
    setIsDialogOpen(true);
  }

  const openEditAgentDialog = (agent: any) => {
    const agentDataForForm = {
        name: agent.name,
        avatarUrl: agent.avatarUrl,
        pricePerSecondCredits: agent.pricePerSecondCredits,
        status: agent.status,
        visibility: agent.visibility
    };
    setCurrentAgent(agentDataForForm);
    setEditingId(agent.id);
    setIsDialogOpen(true);
  }
  
  const handleSaveAgent = async () => {
    if (!currentAgent) return;
    
    // Construct the payload, ensuring price is a number
    const payload = {
        ...currentAgent,
        pricePerSecondCredits: Number(currentAgent.pricePerSecondCredits) || 0,
    };

    if (editingId) {
      // Update existing agent
      const agentDocRef = doc(firestore, 'adminAgents', editingId);
      await updateDoc(agentDocRef, payload);
    } else {
      // Create new agent
      await addDoc(agentsCollectionRef, {
          ...payload,
          createdAt: serverTimestamp()
      });
    }
    
    setIsDialogOpen(false);
    setCurrentAgent(null);
    setEditingId(null);
  }

  const handleDeleteAgent = async (agentId: string) => {
      if (window.confirm("Are you sure you want to delete this agent?")) {
        const agentDocRef = doc(firestore, 'adminAgents', agentId);
        await deleteDoc(agentDocRef);
      }
  }


  return (
    <>
      <Header isMuted={true} onToggleMute={()=>{}} />
      <div className="max-w-4xl mx-auto p-4 pt-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Agents</h1>
          <div className='flex gap-2'>
            <Button variant="outline" asChild><Link href="/admin/settings">Settings</Link></Button>
            <Button onClick={openNewAgentDialog}><PlusCircle className="mr-2 h-4 w-4"/>Create Agent</Button>
          </div>
        </div>

        {isLoading && <p>Loading agents...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents?.map(agent => (
                <Card key={agent.id}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                           <span>{agent.name}</span>
                           <span className={`text-xs px-2 py-1 rounded-full ${agent.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{agent.status}</span>
                        </CardTitle>
                        <CardDescription>ID: {agent.id}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">Price/sec: {agent.pricePerSecondCredits} credits</p>
                        <p className="text-sm">Visibility: {agent.visibility}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditAgentDialog(agent)}><Edit className="h-4 w-4"/></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteAgent(agent.id)}><Trash2 className="h-4 w-4"/></Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingId ? 'Edit Agent' : 'Create New Agent'}</DialogTitle>
                    <DialogDescription>
                        Fill out the details for the AI agent.
                    </DialogDescription>
                </DialogHeader>
                {currentAgent && (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={currentAgent.name} onChange={(e) => setCurrentAgent({...currentAgent, name: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="avatarUrl" className="text-right">Avatar URL</Label>
                            <Input id="avatarUrl" value={currentAgent.avatarUrl} onChange={(e) => setCurrentAgent({...currentAgent, avatarUrl: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Price/sec (Credits)</Label>
                            <Input id="price" type="number" step="0.01" value={currentAgent.pricePerSecondCredits} onChange={(e) => setCurrentAgent({...currentAgent, pricePerSecondCredits: parseFloat(e.target.value)})} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Status</Label>
                            <select id="status" value={currentAgent.status} onChange={(e) => setCurrentAgent({...currentAgent, status: e.target.value as AdminAgentForm['status']})} className="col-span-3 bg-background border border-input rounded-md px-3 py-2 text-sm">
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="visibility" className="text-right">Visibility</Label>
                             <select id="visibility" value={currentAgent.visibility} onChange={(e) => setCurrentAgent({...currentAgent, visibility: e.target.value as AdminAgentForm['visibility']})} className="col-span-3 bg-background border border-input rounded-md px-3 py-2 text-sm">
                                <option value="admin-only">Admin Only</option>
                                <option value="public">Public</option>
                            </select>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" onClick={handleSaveAgent}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
