
'use client';

import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Header } from '@/components/header';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';

type CallTransaction = {
    id: string;
    mode: 'audio' | 'video';
    participants: string[];
    minutes: number;
    gross: number;
    commission: number;
    payout: number;
    createdAt: { toDate: () => Date };
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F'];

export default function AdminEarningsPage() {
    const firestore = useFirestore();

    const transactionsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'transactions'), where('type', '==', 'call'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: transactions, isLoading } = useCollection<CallTransaction>(transactionsQuery as any);

    const summary = useMemo(() => {
        if (!transactions) return { gross: 0, commission: 0, payout: 0, totalCalls: 0, totalMinutes: 0 };
        
        return transactions.reduce((acc, tx) => {
            acc.gross += tx.gross || 0;
            acc.commission += tx.commission || 0;
            acc.payout += tx.payout || 0;
            acc.totalCalls += 1;
            acc.totalMinutes += tx.minutes || 0;
            return acc;
        }, { gross: 0, commission: 0, payout: 0, totalCalls: 0, totalMinutes: 0 });
    }, [transactions]);
    
    const modeData = useMemo(() => {
        if (!transactions) return [];
        const modes = transactions.reduce((acc, tx) => {
            const mode = tx.mode || 'unknown';
            acc[mode] = (acc[mode] || 0) + tx.gross;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(modes).map(([name, value]) => ({ name, value }));
    }, [transactions]);

    return (
        <div className="dark">
            <Header isMuted={true} onToggleMute={() => {}} />
            <div className="p-4 md:p-6 pt-20 max-w-7xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gradient">Call Earnings Dashboard</CardTitle>
                    <CardDescription>Analytics for all real-time call transactions.</CardDescription>
                </CardHeader>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 my-6">
                     <Card>
                        <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">TZS {summary.gross.toLocaleString()}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm text-muted-foreground">Platform Commission</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">TZS {summary.commission.toLocaleString()}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm text-muted-foreground">Agent Payouts</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">TZS {summary.payout.toLocaleString()}</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Calls</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{summary.totalCalls}</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Minutes</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{summary.totalMinutes.toLocaleString()}</p></CardContent>
                    </Card>
                </div>
                
                 <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue by Call Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={modeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                         {modeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `TZS ${value.toLocaleString()}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                 </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Call Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Call ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Participants</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Minutes</TableHead>
                                    <TableHead className="text-right">Gross</TableHead>
                                    <TableHead className="text-right">Commission</TableHead>
                                    <TableHead className="text-right">Payout</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && <TableRow><TableCell colSpan={8} className="text-center">Loading transactions...</TableCell></TableRow>}
                                {!isLoading && transactions?.length === 0 && <TableRow><TableCell colSpan={8} className="text-center">No call transactions found.</TableCell></TableRow>}
                                {transactions?.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="font-mono text-xs">{tx.id.slice(0, 8)}</TableCell>
                                        <TableCell>{tx.createdAt ? format(tx.createdAt.toDate(), 'Pp') : 'N/A'}</TableCell>
                                        <TableCell className="font-mono text-xs">{tx.participants?.map(p => p.slice(0,4)).join(' & ')}</TableCell>
                                        <TableCell>{tx.mode}</TableCell>
                                        <TableCell>{tx.minutes}</TableCell>
                                        <TableCell className="text-right font-semibold">TZS {tx.gross.toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{tx.commission.toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-green-400">{tx.payout.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
