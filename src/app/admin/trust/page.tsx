
'use client';

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

type TrustScoreRecord = {
  sellerId: string;
  trustScore: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | string;
  metrics: {
    verifiedListings: number;
    flaggedListings: number;
    onTimeDeliveries: number;
  };
};

export default function TrustAdminPage() {
  const [records, setRecords] = useState<TrustScoreRecord[]>([]);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    const q = query(collection(firestore, "trustScores"), orderBy("trustScore", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const recordList = snap.docs.map(
        (doc) => doc.data() as TrustScoreRecord
      );
      setRecords(recordList);
    });

    return () => unsubscribe();
  }, [firestore]);

  const levelColors: Record<string, string> = {
    Bronze: "text-yellow-700",
    Silver: "text-gray-400",
    Gold: "text-yellow-500",
    Platinum: "text-green-400",
  };

  return (
    <>
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="min-h-screen p-6 pt-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gradient">Seller Trust &amp; Reputation</h1>
          <div className='flex gap-2'>
            <Button variant="outline" asChild><Link href="/admin/marketplace">Marketplace</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/agents">Agents</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/sessions">Sessions</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/revenue">Revenue</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/settings">Settings</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/verification">Verification</Link></Button>
          </div>
        </div>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="p-3 text-left font-medium">Seller ID</th>
                <th className="p-3 text-left font-medium">Trust Score</th>
                <th className="p-3 text-left font-medium">Level</th>
                <th className="p-3 text-left font-medium">Verified Listings</th>
                <th className="p-3 text-left font-medium">Flagged Listings</th>
                <th className="p-3 text-left font-medium">On-Time Orders</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.sellerId} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">{r.sellerId}</td>
                  <td className="p-3 font-semibold">{r.trustScore.toFixed(1)} / 100</td>
                  <td className={`p-3 font-bold ${levelColors[r.level] || 'text-foreground'}`}>{r.level}</td>
                  <td className="p-3 text-green-400">{r.metrics?.verifiedListings || 0}</td>
                  <td className="p-3 text-red-400">{r.metrics?.flaggedListings || 0}</td>
                  <td className="p-3">{r.metrics?.onTimeDeliveries || 0}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    No trust scores calculated yet.
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
