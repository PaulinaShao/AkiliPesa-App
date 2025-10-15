
"use client";
import { useEffect, useState, useMemo } from "react";
import { useUser, useFirestore } from "@/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Sale = {
  amount: number;
  type: "product" | "service";
};

type Withdrawal = {
  amount: number;
  status: "paid";
};

type DataState = {
  totalSales: number;
  totalCommission: number;
  totalPayouts: number;
  totalPlatformFee: number;
  netProfit: number;
};

export default function RevenueDashboard() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [data, setData] = useState<DataState>({
    totalSales: 0,
    totalCommission: 0,
    totalPayouts: 0,
    totalPlatformFee: 0,
    netProfit: 0,
  });

  useEffect(() => {
    if (isUserLoading) return;
    if (!user || user.email !== "blagridigital@gmail.com") {
      router.push("/auth/login");
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (!firestore) return;

    const qSales = query(collection(firestore, "sales"));
    const unsubSales = onSnapshot(qSales, (snap) => {
      let sales = 0;
      let commission = 0;
      snap.forEach((doc) => {
        const s = doc.data() as Sale;
        sales += s.amount || 0;
        commission += s.amount * (s.type === "product" ? 0.9 : 0.6);
      });
      setData((prev) => ({ ...prev, totalSales: sales, totalCommission: commission }));
    });

    const qPayouts = query(collection(firestore, "withdrawalRequests"));
    const unsubPayouts = onSnapshot(qPayouts, (snap) => {
      let paid = 0;
      snap.forEach((doc) => {
        const w = doc.data() as Withdrawal;
        if (w.status === "paid") paid += w.amount;
      });
      setData((prev) => ({ ...prev, totalPayouts: paid }));
    });

    return () => {
      unsubSales();
      unsubPayouts();
    };
  }, [firestore]);

  useEffect(() => {
    const platformFee = data.totalSales - data.totalCommission;
    const net = platformFee; // Payouts are a transfer of funds, not an operational cost against platform fees in this model.
    setData((d) => ({ ...d, totalPlatformFee: platformFee, netProfit: net }));
  }, [data.totalSales, data.totalCommission]);

  const memoizedDoughnutData = useMemo(() => ({
    labels: ["Agent Commissions", "Platform Fees"],
    datasets: [
      {
        data: [
          data.totalCommission,
          data.totalPlatformFee,
        ],
        backgroundColor: ["hsl(var(--primary))", "hsl(var(--accent))"],
        borderColor: "hsl(var(--background))",
        borderWidth: 2,
      },
    ],
  }), [data.totalCommission, data.totalPlatformFee]);

  const summaryCards = [
    { label: "Total Sales", val: data.totalSales, color: "text-primary" },
    { label: "Agent Commissions", val: data.totalCommission, color: "text-primary" },
    { label: "Platform Fee", val: data.totalPlatformFee, color: "text-accent" },
    { label: "Total Payouts", val: data.totalPayouts, color: "text-red-400" },
    { label: "Net Profit", val: data.netProfit, color: "text-green-400" },
  ];

  return (
    <>
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="min-h-screen p-4 md:p-6 pt-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gradient">Revenue &amp; Reconciliation</h1>
          <div className='flex gap-2'>
            <Button variant="outline" asChild><Link href="/admin/marketplace">Marketplace</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/agents">Agents</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/sessions">Sessions</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/settings">Settings</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/verification">Verification</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {summaryCards.map((item) => (
            <Card key={item.label}>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${item.color}`}>
                  TSh {item.val.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Composition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64 md:h-80 flex items-center justify-center">
                 <Doughnut data={memoizedDoughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }}}} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>More Analytics</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64 md:h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">Additional charts and tables will go here.</p>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

    