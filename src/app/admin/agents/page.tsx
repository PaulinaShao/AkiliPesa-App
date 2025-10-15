

'use client';

import { useEffect, useState } from "react";
import { useFirestore, useUser } from "@/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

type AgentStat = {
    agentId: string;
    totalSales: number;
    totalRevenue: number;
    referralsConverted?: number;
    rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | string;
}

export default function AgentRanking() {
  const [agents, setAgents] = useState<AgentStat[]>([]);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return;
    if (!user || user.email !== "blagridigital@gmail.com") {
      router.push("/auth/login");
      return;
    }
    if (!firestore) return;

    const q = query(collection(firestore, "agentStats"), orderBy("totalRevenue", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const agentList: AgentStat[] = snap.docs.map((doc) => doc.data() as AgentStat);
      setAgents(agentList);
    });
    return () => unsubscribe();
  }, [user, isUserLoading, firestore, router]);

  const rankColors: Record<string, string> = {
    Bronze: "text-yellow-700",
    Silver: "text-gray-400",
    Gold: "text-yellow-500",
    Platinum: "text-primary"
  };

  return (
    <>
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="min-h-screen p-6 pt-20">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gradient">Agent Performance Leaderboard</h1>
             <div className='flex gap-2'>
                <Button variant="outline" asChild><Link href="/admin/marketplace">Marketplace</Link></Button>
                <Button variant="outline" asChild><Link href="/admin/sessions">Sessions</Link></Button>
                <Button variant="outline" asChild><Link href="/admin/revenue">Revenue</Link></Button>
                <Button variant="outline" asChild><Link href="/admin/settings">Settings</Link></Button>
                 <Button variant="outline" asChild><Link href="/admin/verification">Verification</Link></Button>
                 <Button variant="outline" asChild><Link href="/admin/trust">Trust</Link></Button>
                 <Button variant="outline" asChild><Link href="/admin/community">Community</Link></Button>
            </div>
        </div>
        <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
                <thead className="bg-muted/50">
                <tr className="border-b">
                    <th className="p-3 text-left font-medium">Agent ID</th>
                    <th className="p-3 text-left font-medium">Sales</th>
                    <th className="p-3 text-left font-medium">Revenue (TZS)</th>
                    <th className="p-3 text-left font-medium">Referrals</th>
                    <th className="p-3 text-left font-medium">Rank</th>
                </tr>
                </thead>
                <tbody>
                {agents.map((a) => (
                    <tr key={a.agentId} className="border-t hover:bg-muted/50">
                    <td className="p-3 font-mono text-xs">{a.agentId}</td>
                    <td className="p-3">{a.totalSales}</td>
                    <td className="p-3">{a.totalRevenue.toLocaleString()}</td>
                    <td className="p-3">{a.referralsConverted || 0}</td>
                    <td className={`p-3 font-bold ${rankColors[a.rank] || 'text-foreground'}`}>{a.rank}</td>
                    </tr>
                ))}
                {agents.length === 0 && (
                    <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                            No agent stats available yet.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
      </div>
    </>
  );
}
