

'use client';

import { useEffect, useState } from "react";
import { useFirestore, useUser } from "@/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

type VerificationRecord = {
  id: string;
  productId: string;
  sellerId: string;
  status: 'verified' | 'flagged';
  confidenceScore: number;
  flags: string[];
};

export default function VerificationAdmin() {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
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

    const q = query(collection(firestore, "productVerification"), orderBy("checkedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const recordList = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as VerificationRecord)
      );
      setRecords(recordList);
    });

    return () => unsubscribe();
  }, [user, isUserLoading, firestore, router]);

  return (
    <>
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="min-h-screen p-6 pt-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gradient">AI Verification & Fraud Monitor</h1>
          <div className='flex gap-2'>
            <Button variant="outline" asChild><Link href="/admin/marketplace">Marketplace</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/agents">Agents</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/sessions">Sessions</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/revenue">Revenue</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/settings">Settings</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/trust">Trust</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/community">Community</Link></Button>
          </div>
        </div>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="p-3 text-left font-medium">Product ID</th>
                <th className="p-3 text-left font-medium">Seller ID</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Confidence</th>
                <th className="p-3 text-left font-medium">Flags</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">{r.productId}</td>
                  <td className="p-3 font-mono text-xs">{r.sellerId}</td>
                  <td className={`p-3 font-semibold capitalize ${r.status === "verified" ? "text-green-500" : "text-red-500"}`}>
                    {r.status}
                  </td>
                  <td className="p-3">{(r.confidenceScore * 100).toFixed(1)}%</td>
                  <td className="p-3 text-xs">{r.flags?.join(", ") || "-"}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No verification records found.
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
