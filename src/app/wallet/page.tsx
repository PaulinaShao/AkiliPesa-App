
'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, Plus, Send, ShieldCheck, Hourglass, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';


const transactionIcons: Record<string, JSX.Element> = {
  purchase: <CreditCard className="h-5 w-5 text-blue-400" />,
  deduction: <ArrowUpRight className="h-5 w-5 text-red-400" />,
  topup: <ArrowDownLeft className="h-5 w-5 text-green-400" />,
  transfer: <Send className="h-5 w-5 text-purple-400" />,
  credit: <ArrowDownLeft className="h-5 w-5 text-green-400" />,
  'Completed Sale Payout': <ArrowDownLeft className="h-5 w-5 text-green-400" />,
  'Escrow Released': <ShieldCheck className="h-5 w-5 text-blue-400" />,
  'Commission Credit': <ArrowDownLeft className="h-5 w-5 text-green-400" />,
  'Transaction Credit': <ArrowDownLeft className="h-5 w-5 text-green-400" />,
};


export default function WalletPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const walletDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, "wallets", user.uid) : null),
    [user, firestore]
  );
  const { data: walletData, isLoading: isWalletLoading } = useDoc<any>(walletDocRef);
  const wallet = walletData || { balanceTZS: 0, escrow: 0, plan: { credits: 0 } };

  const transactionsQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(
            collection(firestore, "transactions"),
            where("uid", "==", user.uid),
            orderBy("createdAt", "desc")
          )
        : null,
    [user, firestore]
  );
  const { data: transactions, isLoading: areTransactionsLoading } = useCollection<any>(transactionsQuery);

  const isLoading = isUserLoading || isWalletLoading || areTransactionsLoading;
  
  if (isUserLoading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;

  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={() => {}}/>
      <div className="max-w-2xl mx-auto p-4 md:p-6 pt-20">
        <Card className="mb-6 shadow-2xl bg-primary/90 text-primary-foreground border-none overflow-hidden">
          <div className="relative p-6">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
             <div className="absolute -bottom-12 -left-8 w-28 h-28 bg-white/10 rounded-full"></div>
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-sm font-light text-primary-foreground/80">Available Balance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-4xl font-bold">TZS {wallet.balanceTZS?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</p>
            </CardContent>
          </div>
        </Card>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="shadow-lg bg-card/50 backdrop-blur-md border-border/50">
                <CardHeader className="flex-row items-center justify-between p-4">
                <div>
                    <CardTitle className="text-sm font-light text-muted-foreground">Escrow</CardTitle>
                    <CardDescription className="text-xl font-bold text-foreground">TZS {wallet.escrow?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</CardDescription>
                </div>
                <Hourglass className="h-8 w-8 text-yellow-400"/>
                </CardHeader>
            </Card>
            <Card className="shadow-lg bg-card/50 backdrop-blur-md border-border/50">
                <CardHeader className="flex-row items-center justify-between p-4">
                <div>
                    <CardTitle className="text-sm font-light text-muted-foreground">Plan Credits</CardTitle>
                    <CardDescription className="text-xl font-bold text-foreground">{wallet.plan?.credits ?? '0'}</CardDescription>
                </div>
                <CreditCard className="h-8 w-8 text-green-400"/>
                </CardHeader>
            </Card>
        </div>


        <div className="grid grid-cols-3 gap-4 mb-8">
          <Button size="lg" className="h-16 text-base bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 flex-col">
            <Plus className="h-5 w-5 mb-1" /> Add Funds
          </Button>
          <Button size="lg" variant="secondary" className="h-16 text-base bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 flex-col">
            <Send className="h-5 w-5 mb-1" /> Send
          </Button>
           <Button size="lg" variant="secondary" className="h-16 text-base bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 flex-col">
            <CreditCard className="h-5 w-5 mb-1" /> Buy Plan
          </Button>
        </div>

        <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="plan">
                    <CreditCard className="h-4 w-4 mr-2" /> Plan Usage
                </TabsTrigger>
            </TabsList>
            <TabsContent value="activity">
                <Card className="bg-card/50 border-border/50 mt-4">
                    <CardContent className="p-0">
                    <ul className="divide-y divide-border/50">
                        {isLoading && <li className="p-4 text-center">Loading transactions...</li>}
                        {transactions?.map(tx => (
                        <li key={tx.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                            <div className="p-3 bg-muted rounded-full">
                                {transactionIcons[tx.description] || transactionIcons[tx.type] || <CreditCard className="h-5 w-5" />}
                            </div>
                            <div>
                                <p className="font-semibold">{tx.description}</p>
                                <p className="text-sm text-muted-foreground">{tx.createdAt ? format(tx.createdAt.toDate(), 'MMM d, yyyy') : 'Date unavailable'}</p>
                            </div>
                            </div>
                            <div className={cn(
                                "font-semibold text-base",
                                tx.amount > 0 ? 'text-green-400' : 'text-foreground'
                            )}>
                                {tx.amount > 0 ? '+' : ''} {tx.amount.toLocaleString('en-US')} {tx.currency}
                            </div>
                        </li>
                        ))}
                         {!isLoading && transactions?.length === 0 && <li className="p-4 text-center text-muted-foreground">No transactions yet.</li>}
                    </ul>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="plan">
                 <Card className="bg-card/50 border-border/50 mt-4">
                    <CardHeader>
                        <CardTitle>Current Plan: {wallet?.plan?.id ?? 'N/A'}</CardTitle>
                        <CardDescription>Your plan is active and gives you access to premium features.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {wallet?.plan ? (
                            <>
                            <div>
                                <div className="flex justify-between mb-1 text-sm">
                                    <span className="font-medium">Credits Remaining</span>
                                    <span className="font-bold">{wallet.plan.credits}</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5">
                                    <div className="bg-green-500 h-2.5 rounded-full" style={{width: `${(wallet.plan.credits / 200) * 100}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Expires on: <span className="font-bold">{wallet.plan.expiry ? format(wallet.plan.expiry.toDate(), 'MMMM d, yyyy') : 'N/A'}</span></p>
                            </div>
                            </>
                        ) : (
                           <p className="text-muted-foreground text-center">You are on the trial plan.</p>
                        )}
                        <Button className="w-full">Upgrade Plan</Button>
                    </CardContent>
                 </Card>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
