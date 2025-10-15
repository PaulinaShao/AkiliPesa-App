
'use client';

import { useEffect, useState, useMemo } from "react";
import { useFirestore, useUser } from "@/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import { Header } from "@/components/header";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type BuyerTrustRecord = {
  buyerId: string;
  trustScore: number;
};

export default function CommunityTrustAdmin() {
  const [buyers, setBuyers] = useState<BuyerTrustRecord[]>([]);
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

    const q = query(collection(firestore, "buyerTrust"), orderBy("trustScore", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const buyerList = snap.docs.map((d) => d.data() as BuyerTrustRecord);
      setBuyers(buyerList);
    });
    return () => unsubscribe();
  }, [user, isUserLoading, firestore, router]);

  const chartData = useMemo(() => {
    const sortedBuyers = [...buyers].sort((a, b) => b.trustScore - a.trustScore);
    return {
      labels: sortedBuyers.map((b) => b.buyerId.substring(0, 8) + "..."),
      datasets: [
        {
          label: "Buyer Trust Score",
          data: sortedBuyers.map((b) => b.trustScore),
          backgroundColor: "hsl(var(--primary))",
          borderColor: "hsl(var(--primary-foreground))",
          borderWidth: 1,
        },
      ],
    };
  }, [buyers]);

  return (
    <>
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="min-h-screen p-6 pt-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gradient">Community Trust Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/admin/marketplace">Marketplace</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/agents">Agents</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/sessions">Sessions</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/revenue">Revenue</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/settings">Settings</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/verification">Verification</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/trust">Trust</Link></Button>
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          {buyers.length > 0 ? (
            <Bar
              data={chartData}
              options={{
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: 'hsl(var(--muted-foreground))' },
                  },
                  x: {
                    ticks: { color: 'hsl(var(--muted-foreground))' },
                  },
                },
                plugins: {
                  legend: {
                    labels: { color: 'hsl(var(--foreground))' },
                  },
                },
              }}
            />
          ) : (
            <p className="text-center text-muted-foreground py-16">
              No buyer trust data available to display.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
