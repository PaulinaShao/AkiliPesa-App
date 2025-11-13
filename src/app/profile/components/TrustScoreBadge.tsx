
'use client';

import { useFirestore, useDoc, useFsMemo } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ShieldCheck } from 'lucide-react';

interface TrustScore {
  trustScore: number;
  level: string;
}

const levelColors: Record<string, string> = {
  Bronze: 'text-yellow-700',
  Silver: 'text-gray-400',
  Gold: 'text-yellow-500',
  Platinum: 'text-green-400',
};

export function TrustScoreBadge({ sellerId }: { sellerId: string }) {
  const firestore = useFirestore();

  const scoreDocRef = useFsMemo(() => {
    if (!firestore || !sellerId) return null;
    return doc(firestore, 'trustScores', sellerId);
  }, [firestore, sellerId]);

  const { data: scoreData, isLoading } = useDoc<TrustScore>(scoreDocRef);

  if (isLoading) {
    return (
      <div className="my-4 p-4 bg-[#0A0A0A] rounded-2xl border border-[#1A1A1A]">
        <p className="text-sm text-center text-muted-foreground">Loading Trust Score...</p>
      </div>
    );
  }

  if (!scoreData) {
    return null; // Don't show anything if there's no score yet
  }

  const { trustScore, level } = scoreData;

  const scoreColor = trustScore >= 90 ? "text-green-400"
                   : trustScore >= 80 ? "text-primary"
                   : trustScore >= 60 ? "text-yellow-400"
                   : "text-red-500";

  return (
    <div
      className="my-4 p-4 bg-[#0A0A0A] rounded-2xl border border-[#1A1A1A] transition-shadow duration-300"
      style={{ boxShadow: '0 0 10px rgba(0, 190, 255, 0.2)' }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 190, 255, 0.3)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 190, 255, 0.2)'}
    >
      <div className="flex justify-between items-center mb-2">
         <h3 className="flex items-center text-sm font-semibold text-muted-foreground">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Trust Score
         </h3>
         <div className={`text-xl font-bold ${scoreColor}`}>{trustScore.toFixed(0)} / 100</div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2.5">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-teal-400"
          style={{ width: `${trustScore}%` }}
        ></div>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
        <span>Level: {level}</span>
      </div>
    </div>
  );
}
