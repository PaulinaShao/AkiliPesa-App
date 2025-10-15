
"use client";

import { useEffect, useState, useMemo } from "react";
import { useFirestore, useUser } from "@/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type SessionRecord = {
  id: string;
  sessionId: string;
  userId: string;
  agentId: string;
  agentType: string;
  mode: "audio" | "video" | "chat";
  lastUpdated: number;
  duration?: number;
  isActive: boolean;
  vendor?: string;
  costPerSec?: number;
  totalCost?: number;
};

export default function AdminSessions() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [filter, setFilter] = useState({ type: "all", status: "all" });
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

    const q = query(collection(firestore, "aiSessions"), orderBy("lastUpdated", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: SessionRecord[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        const totalCost = (d.duration || 0) * (d.costPerSec || 0);
        list.push({ ...(d as any), id: docSnap.id, totalCost });
      });
      setSessions(list);
    });
    return () => unsub();
  }, [user, isUserLoading, firestore, router]);

  const summary = useMemo(() => {
    const totalRevenue = sessions.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    const activeCalls = sessions.filter((r) => r.isActive).length;
    const inactiveCalls = sessions.filter((r) => !r.isActive).length;

    const agentEarnings: Record<string, number> = {};
    sessions.forEach((r) => {
      if(r.agentId) {
        agentEarnings[r.agentId] = (agentEarnings[r.agentId] || 0) + (r.totalCost || 0);
      }
    });

    const topAgent = Object.keys(agentEarnings).length > 0
      ? Object.entries(agentEarnings).sort((a, b) => b[1] - a[1])[0][0]
      : "-";

    return { totalRevenue, activeCalls, inactiveCalls, topAgent };
  }, [sessions]);


  const filteredSessions = useMemo(() => sessions.filter((s) => {
    const typeMatch = filter.type === "all" || s.agentType === filter.type;
    const statusMatch =
      filter.status === "all" ||
      (filter.status === "active" ? s.isActive : !s.isActive);
    return typeMatch && statusMatch;
  }), [sessions, filter]);

  const chartData = useMemo(() => {
     const agentEarnings: Record<string, number> = {};
    filteredSessions.forEach((r) => {
       if(r.agentId) {
        agentEarnings[r.agentId] = (agentEarnings[r.agentId] || 0) + (r.totalCost || 0);
      }
    });
    return Object.entries(agentEarnings)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, revenue]) => ({ name, revenue }));
  }, [filteredSessions]);


  return (
    <>
    <Header isMuted={true} onToggleMute={()=>{}}/>
    <div className="min-h-screen p-4 md:p-6 pt-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gradient">AI Session Dashboard</h1>
         <div className='flex gap-2'>
            <Button variant="outline" asChild><Link href="/admin/marketplace">Marketplace</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/agents">Agents</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/revenue">Revenue</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/settings">Settings</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/verification">Verification</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/trust">Trust</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/community">Community</Link></Button>
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
            <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold text-primary">
                    TZS {summary.totalRevenue.toLocaleString()}
                </p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-medium">Active Calls</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold text-green-500">{summary.activeCalls}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-medium">Ended Calls</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold text-red-500">{summary.inactiveCalls}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-medium">Top Agent</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold text-amber-400 truncate">{summary.topAgent}</p>
            </CardContent>
        </Card>
      </div>

      <div className="flex space-x-4 mb-6">
        <select
          className="bg-card p-2 rounded-md border text-sm"
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
        >
          <option value="all">All Agent Types</option>
          <option value="admin">Admin Agents</option>
          <option value="user">User Agents</option>
        </select>

        <select
          className="bg-card p-2 rounded-md border text-sm"
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <Card className="mb-8">
        <CardHeader>
            <CardTitle className="text-lg">Top 10 Agent Revenues</CardTitle>
        </CardHeader>
        <CardContent>
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `TSh ${value}`} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                        }}
                    />
                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-medium">Session ID</th>
              <th className="px-4 py-3 text-left font-medium">Agent</th>
              <th className="px-4 py-3 text-left font-medium">Mode</th>
              <th className="px-4 py-3 text-left font-medium">Vendor</th>
              <th className="px-4 py-3 text-left font-medium">Duration</th>
              <th className="px-4 py-3 text-left font-medium">Earnings</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((s) => (
              <tr
                key={s.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="px-4 py-3 font-mono text-xs">{s.sessionId.substring(0,12)}...</td>
                <td className="px-4 py-3">{s.agentId}</td>
                <td className="px-4 py-3 capitalize">{s.mode}</td>
                <td className="px-4 py-3">{s.vendor || "-"}</td>
                <td className="px-4 py-3">{s.duration ? `${s.duration}s` : "—"}</td>
                <td className="px-4 py-3 text-primary">
                  {s.totalCost ? `TZS ${s.totalCost.toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      s.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {s.isActive ? "Active" : "Ended"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(s.lastUpdated).toLocaleString()}
                </td>
              </tr>
            ))}
             {filteredSessions.length === 0 && (
                <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">No sessions match the current filter.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
