'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { transactions as allTransactions } from '@/lib/data';
import type { Transaction } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, Plus, Send } from 'lucide-react';
import { format } from 'date-fns';

const transactionIcons: Record<string, JSX.Element> = {
  Received: <ArrowDownLeft className="h-5 w-5 text-green-500" />,
  Sent: <ArrowUpRight className="h-5 w-5 text-red-500" />,
  Earned: <ArrowDownLeft className="h-5 w-5 text-green-500" />,
  Commission: <ArrowDownLeft className="h-5 w-5 text-green-500" />,
  'Add Funds': <ArrowDownLeft className="h-5 w-5 text-green-500" />,
  Withdraw: <ArrowUpRight className="h-5 w-5 text-red-500" />,
};

const isCredit = (type: Transaction['type']) => ['Received', 'Earned', 'Add Funds'].includes(type);

export default function WalletPage() {
  const [balance] = useState(20000); // This should align with header balance

  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-4xl mx-auto p-4 md:p-8 pt-20">
        <Card className="mb-8 shadow-lg bg-card border-none">
          <CardHeader>
            <CardTitle className="text-muted-foreground font-medium text-center">Current Balance</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-5xl font-bold">TZS {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Button size="lg" className="h-16 text-lg">
            <Plus className="h-6 w-6 mr-2" /> Add Funds
          </Button>
          <Button size="lg" variant="secondary" className="h-16 text-lg">
            <Send className="h-6 w-6 mr-2" /> Withdraw/Send
          </Button>
        </div>

        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Transaction History</h2>
            <div className="flex justify-between text-muted-foreground font-semibold px-4">
                <span>Description</span>
                <span>Amount</span>
            </div>
            <Card className="bg-card border-none">
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {allTransactions.map(transaction => (
                      <li key={transaction.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                           <div className="p-2 bg-muted rounded-full">
                            {transactionIcons[transaction.type]}
                           </div>
                          <div>
                            <p className="font-semibold">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(transaction.date), 'yyyy-MM-dd')}</p>
                          </div>
                        </div>
                        <div className={cn(
                            "font-bold text-lg",
                            isCredit(transaction.type) ? 'text-green-500' : 'text-foreground'
                          )}>
                            {isCredit(transaction.type) ? '+' : '-'} TZS {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
        </div>
      </div>
    </div>
  );
}
