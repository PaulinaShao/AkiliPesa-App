

'use client';

import { useEffect, useState } from "react";
import { useFirestore, useUser } from "@/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Order = {
  id: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: string;
  escrowId: string;
};

export default function MarketplaceAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
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

    const q = query(collection(firestore, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const orderList = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Order)
      );
      setOrders(orderList);
    });

    return () => unsubscribe();
  }, [user, isUserLoading, firestore, router]);

  return (
    <>
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="min-h-screen p-6 pt-20">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gradient">Marketplace & Escrow Admin</h1>
             <div className='flex gap-2'>
                <Button variant="outline" asChild><Link href="/admin/agents">Agents</Link></Button>
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
                <th className="p-3 text-left font-medium">Order ID</th>
                <th className="p-3 text-left font-medium">Buyer</th>
                <th className="p-3 text-left font-medium">Seller</th>
                <th className="p-3 text-left font-medium">Amount</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Escrow ID</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">{o.id}</td>
                  <td className="p-3 font-mono text-xs">{o.buyerId}</td>
                  <td className="p-3 font-mono text-xs">{o.sellerId}</td>
                  <td className="p-3">TSh {o.amount?.toLocaleString()}</td>
                  <td className="p-3 capitalize">{o.status}</td>
                  <td className="p-3 font-mono text-xs">{o.escrowId}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                 <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                        No orders found.
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
