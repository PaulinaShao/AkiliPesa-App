
'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { transactions as allTransactions } from '@/lib/data';
import type { Transaction } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, Plus, Minus, Send, Download, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const transactionIcons = {
  Received: <ArrowDownLeft className="h-5 w-5 text-green-500" />,
  Sent: <ArrowUpRight className="h-5 w-5 text-red-500" />,
  Earned: <DollarSign className="h-5 w-5 text-blue-500" />,
  Commission: <DollarSign className="h-5 w-5 text-purple-500" />,
  'Add Funds': <Plus className="h-5 w-5 text-green-500" />,
  Withdraw: <Download className="h-5 w-5 text-yellow-500" />,
};

export default function WalletPage() {
  const [filter, setFilter] = useState('All');
  const balance = 20000;

  const filteredTransactions = allTransactions.filter(t => {
    if (filter === 'All') return true;
    return t.type === filter;
  });

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto p-4 md:p-8 pt-20">
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-muted-foreground font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">TZS {balance.toLocaleString()}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button size="lg" className="flex-col h-20"><Plus className="h-6 w-6 mb-1" /> Add Funds</Button>
          <Button size="lg" className="flex-col h-20"><Minus className="h-6 w-6 mb-1" /> Withdraw</Button>
          <Button size="lg" className="flex-col h-20"><Send className="h-6 w-6 mb-1" /> Send</Button>
          <Button size="lg" variant="outline" className="flex-col h-20"><Download className="h-6 w-6 mb-1" /> Statement</Button>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
          <Tabs defaultValue="All" onValueChange={setFilter}>
            <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-4">
              <TabsTrigger value="All">All</TabsTrigger>
              <TabsTrigger value="Received">Received</TabsTrigger>
              <TabsTrigger value="Sent">Sent</TabsTrigger>
              <TabsTrigger value="Earned">Earned</TabsTrigger>
              <TabsTrigger value="Commission">Commission</TabsTrigger>
            </TabsList>
            <TabsContent value={filter}>
              <Card>
                <CardContent className="p-0">
                  <ul className="divide-y">
                    {filteredTransactions.map(transaction => (
                      <li key={transaction.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                           <div className="p-2 bg-muted rounded-full">
                            {transactionIcons[transaction.type as keyof typeof transactionIcons]}
                           </div>
                          <div>
                            <p className="font-semibold">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(transaction.date), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-bold",
                            ['Received', 'Earned', 'Add Funds'].includes(transaction.type) ? 'text-green-500' : 'text-red-500'
                          )}>
                            {['Received', 'Earned', 'Add Funds'].includes(transaction.type) ? '+' : '-'} TZS {transaction.amount.toLocaleString()}
                          </p>
                          <p className={cn("text-xs", 
                            transaction.status === 'Completed' && 'text-green-500',
                            transaction.status === 'Pending' && 'text-yellow-500',
                            transaction.status === 'Failed' && 'text-red-500'
                            )}>{transaction.status}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
