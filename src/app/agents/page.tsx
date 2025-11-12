'use client';

import { useState, useMemo } from 'react';
import {
  useFirestore,
  useCollection,
  useMemoFirebase
} from '@/firebase';
import { collection, query, where, type Query, type DocumentData } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import FallbackAvatar from '@/components/ui/FallbackAvatar';
import { Button } from '@/components/ui/button';
import { Search, Phone, Video } from 'lucide-react';
import Link from 'next/link';
import { useInitiateCall } from '@/hooks/useInitiateCall';
import { NextAvailableBadge } from '@/components/NextAvailableBadge';
import { CallPriceChip } from '@/components/CallPriceChip';

// ✅ Local definition for UserProfile since 'docs/backend' doesn’t exist
export interface UserProfile {
  uid: string;
  displayName?: string;
  handle?: string;
  bio?: string;
  role?: string;
  photoURL?: string;
  categories?: string[];
}

export default function AgentMarketplacePage() {
  // ✅ Prevents Next.js SSR from crashing due to Firebase usage
  if (typeof window === 'undefined') {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Preparing AkiliPesa experience…
      </div>
    );
  }

  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const { initiateCall } = useInitiateCall();

  // ✅ Properly memoized and typed Firestore query
  const agentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const q = query(collection(firestore, 'users'), where('role', '==', 'agent'));
    return q;
  }, [firestore]) as unknown as Query<DocumentData> | null;

  const { data: agents, isLoading } = useCollection<UserProfile>(agentsQuery);

  // ✅ Filter agents client-side
  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    return agents.filter((agent) => {
      const nameMatch = agent.displayName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const handleMatch = agent.handle
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const categoryMatch =
        !category ||
        (agent.categories && agent.categories.includes(category));
      return (nameMatch || handleMatch) && categoryMatch;
    });
  }, [agents, searchTerm, category]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    agents?.forEach((agent) =>
      agent.categories?.forEach((cat) => cats.add(cat))
    );
    return Array.from(cats);
  }, [agents]);

  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-4xl mx-auto p-4 pt-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient">Agent Marketplace</h1>
          <p className="text-muted-foreground mt-2">
            Find and connect with an expert agent.
          </p>
        </div>

        {/* Search + Category Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or handle..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="bg-card p-2 rounded-md border text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-64 bg-muted/50"></Card>
            ))}

          {filteredAgents?.map((agent) => (
            <Card key={agent.uid} className="flex flex-col">
              <CardContent className="pt-6 flex flex-col items-center text-center flex-1">
                <FallbackAvatar
                  src={agent.photoURL}
                  alt={agent.handle}
                  size={80}
                />
                <h3 className="font-bold mt-3">{agent.displayName}</h3>
                <p className="text-sm text-muted-foreground">@{agent.handle}</p>
                <p className="text-xs text-muted-foreground mt-2 flex-1">
                  {agent.bio}
                </p>
                <div className="my-3">
                  <NextAvailableBadge agentId={agent.uid} />
                </div>
              </CardContent>

              <div className="p-4 border-t grid grid-cols-2 gap-2">
                <Button
                  onClick={() =>
                    initiateCall({
                      agentId: agent.uid,
                      agentType: 'user',
                      mode: 'audio'
                    })
                  }
                  variant="outline"
                  size="sm"
                  className="flex-col h-14"
                >
                  <Phone className="h-5 w-5 mb-1" />
                  <CallPriceChip agentId={agent.uid} mode="audio" />
                </Button>
                <Button
                  onClick={() =>
                    initiateCall({
                      agentId: agent.uid,
                      agentType: 'user',
                      mode: 'video'
                    })
                  }
                  variant="outline"
                  size="sm"
                  className="flex-col h-14"
                >
                  <Video className="h-5 w-5 mb-1" />
                  <CallPriceChip agentId={agent.uid} mode="video" />
                </Button>
                <Button asChild variant="secondary" className="col-span-2">
                  <Link href={`/agent/${agent.handle}`}>View Profile</Link>
                </Button>
              </div>
            </Card>
          ))}

          {!isLoading && filteredAgents?.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-10">
              No agents found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
