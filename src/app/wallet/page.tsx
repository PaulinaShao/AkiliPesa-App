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
  Received: <ArrowDownLeft className="h-5 w-5 text-green-400" />,
  Sent: <ArrowUpRight className="h-5 w-5 text-red-400" />,
  Earned: <ArrowDownLeft className="h-5 w-5 text-green-400" />,
  Commission: <ArrowDownLeft className="h-5 w-5 text-green-400" />,
  'Add Funds': <ArrowDownLeft className="h-5 w-5 text-green-400" />,
  Withdraw: <ArrowUpRight className="h-5 w-5 text-red-400" />,
};

const isCredit = (type: Transaction['type']) => ['Received', 'Earned', 'Add Funds', 'Commission'].includes(type);

export default function WalletPage() {
  const [balance] = useState(20000); // This should align with header balance

  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-2xl mx-auto p-4 md:p-6 pt-20">
        <Card className="mb-8 shadow-2xl bg-primary/90 text-primary-foreground border-none overflow-hidden">
          <div className="relative p-6">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
             <div className="absolute -bottom-12 -left-8 w-28 h-28 bg-white/10 rounded-full"></div>
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-sm font-light text-primary-foreground/80">Total Balance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-4xl font-bold">TZS {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </CardContent>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Button size="lg" className="h-16 text-base bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20">
            <Plus className="h-5 w-5 mr-2" /> Add Funds
          </Button>
          <Button size="lg" variant="secondary" className="h-16 text-base bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20">
            <Send className="h-5 w-5 mr-2" /> Send
          </Button>
        </div>

        <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Recent Transactions</h2>
            <Card className="bg-card/50 border-border/50">
                <CardContent className="p-0">
                  <ul className="divide-y divide-border/50">
                    {allTransactions.map(transaction => (
                      <li key={transaction.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-muted rounded-full">
                            {transactionIcons[transaction.type]}
                           </div>
                          <div>
                            <p className="font-semibold">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(transaction.date), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <div className={cn(
                            "font-semibold text-base",
                            isCredit(transaction.type) ? 'text-green-400' : 'text-foreground'
                          )}>
                            {isCredit(transaction.type) ? '+' : '-'} {transaction.amount.toLocaleString('en-US')}
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
