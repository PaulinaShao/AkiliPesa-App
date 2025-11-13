
'use client';

import { useFirestore, useDoc, useFsMemo } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ShieldCheck } from 'lucide-react';

interface BuyerTrust {
  trustScore: number;
  level: string;
}

export function BuyerTrustBadge({ buyerId }: { buyerId: string }) {
  const firestore = useFirestore();

  const scoreDocRef = useFsMemo(() => {
    if (!firestore || !buyerId) return null;
    return doc(firestore, 'buyerTrust', buyerId);
  }, [firestore, buyerId]);

  const { data: scoreData, isLoading } = useDoc<BuyerTrust>(scoreDocRef);

  if (isLoading) {
    return (
      <div className="my-4 p-4 bg-[#0A0A0A] rounded-2xl border border-[#1A1A1A]">
        <p className="text-sm text-center text-muted-foreground">Loading Buyer Score...</p>
      </div>
    );
  }

  if (!scoreData) {
    return null; // Don't show if no score yet
  }

  const { trustScore = 0, level = 'Bronze' } = scoreData || {};

  const scoreColor = trustScore >= 90 ? "text-green-400"
                   : trustScore >= 80 ? "text-primary"
                   : trustScore >= 60 ? "text-yellow-400"
                   : "text-red-500";

  return (
    <div
      className="my-4 p-4 bg-[#0A0A0A] rounded-2xl border border-[#1A1A1A] transition-shadow duration-300"
      style={{ boxShadow: '0 0 10px rgba(0, 220, 180, 0.2)' }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 220, 180, 0.3)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 220, 180, 0.2)'}
    >
      <div className="flex justify-between items-center mb-2">
         <h3 className="flex items-center text-sm font-semibold text-muted-foreground">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Buyer Score
         </h3>
         <div className={`text-xl font-bold ${scoreColor}`}>{trustScore.toFixed(0)} / 100</div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2.5">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-400"
          style={{ width: `${trustScore}%` }}
        ></div>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
        <span>Level: {level}</span>
      </div>
    </div>
  );
}
