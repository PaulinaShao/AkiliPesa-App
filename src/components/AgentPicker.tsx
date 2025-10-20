
'use client';

import { useState } from 'react';
import { useFirestore, useFirebaseUser } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FallbackAvatar from './ui/FallbackAvatar';

interface Agent {
    id: string;
    name: string;
    avatarUrl: string;
    pricePerSecondCredits: number;
    specialty?: string;
}

interface AgentPickerProps {
  show: boolean;
  onSelect: (agent: { id: string; type: 'admin' | 'user' }) => void;
  onCancel: () => void;
}

export function AgentPicker({ show, onSelect, onCancel }: AgentPickerProps) {
  const firestore = useFirestore();
  const { user } = useFirebaseUser();

  const adminAgentsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'adminAgents'), where('status', '==', 'active'))
        : null,
    [firestore]
  );
  const { data: adminAgents, isLoading: adminLoading } = useCollection<Agent>(adminAgentsQuery);
  
  const userAgentsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, `users/${user.uid}/agents`), where('status', '==', 'active'))
        : null,
    [firestore, user]
  );
  const { data: userAgents, isLoading: userLoading } = useCollection<Agent>(userAgentsQuery);

  const handleSelect = (agent: Agent, type: 'admin' | 'user') => {
      onSelect({ id: agent.id, type });
  }

  const isLoading = adminLoading || userLoading;

  return (
    <Dialog open={show} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select an Agent</DialogTitle>
          <DialogDescription>
            Choose an agent to start your call with.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin">Admin Agents</TabsTrigger>
            <TabsTrigger value="user">My Agents</TabsTrigger>
          </TabsList>
          <TabsContent value="admin" className="mt-4 max-h-[50vh] overflow-y-auto">
            {isLoading && <p>Loading...</p>}
            <div className="space-y-2">
                {adminAgents?.map(agent => (
                    <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                        <div className="flex items-center gap-3">
                            <FallbackAvatar src={agent.avatarUrl} alt={agent.name} size={40}/>
                            <div>
                                <p className="font-semibold">{agent.name}</p>
                                <p className="text-xs text-muted-foreground">{agent.pricePerSecondCredits} credits/sec</p>
                            </div>
                        </div>
                        <Button size="sm" onClick={() => handleSelect(agent, 'admin')}>Call</Button>
                    </div>
                ))}
                {!isLoading && adminAgents?.length === 0 && <p className="text-center text-muted-foreground py-4">No admin agents available.</p>}
            </div>
          </TabsContent>
          <TabsContent value="user" className="mt-4 max-h-[50vh] overflow-y-auto">
             {isLoading && <p>Loading...</p>}
             <div className="space-y-2">
                {userAgents?.map(agent => (
                    <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                         <div className="flex items-center gap-3">
                            <FallbackAvatar src={agent.avatarUrl} alt={agent.name} size={40}/>
                            <div>
                                <p className="font-semibold">{agent.name}</p>
                                <p className="text-xs text-muted-foreground">{agent.specialty}</p>
                                <p className="text-xs text-muted-foreground">{agent.pricePerSecondCredits} credits/sec</p>
                            </div>
                        </div>
                        <Button size="sm" onClick={() => handleSelect(agent, 'user')}>Call</Button>
                    </div>
                ))}
                 {!isLoading && userAgents?.length === 0 && <p className="text-center text-muted-foreground py-4">You haven't created any agents yet.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
