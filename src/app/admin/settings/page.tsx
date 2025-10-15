

'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, setDoc, collection, query, where, Timestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type AdminSettings = {
    pricing: {
        tzsPerCredit: number;
        defaultAdminPricePerSecondCredits: number;
    },
    commissionModels: {
        product: {
            platform: number;
            creator: number;
        },
        serviceAccess: {
            platform: number;
            commission: number;
            creator: number;
        }
    }
}

type CommissionRates = {
    productCommission: number;
    serviceCommission: number;
    callCommission: number;
}

const defaultSettings: AdminSettings = {
    pricing: {
        tzsPerCredit: 100,
        defaultAdminPricePerSecondCredits: 0.1
    },
    commissionModels: {
        product: {
            platform: 0.1,
            creator: 0.9
        },
        serviceAccess: {
            platform: 0.1,
            commission: 0.1,
            creator: 0.8
        }
    }
};

const defaultCommissionRates: CommissionRates = {
    productCommission: 0.9,
    serviceCommission: 0.6,
    callCommission: 0.0
};

type WithdrawalRequest = {
    id: string;
    agentId: string;
    amount: number;
    status: 'pending' | 'approved' | 'paid' | 'failed';
    paymentMethod: string;
    walletNumber: string;
    createdAt: Timestamp;
};

export default function AdminSettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [rates, setRates] = useState<CommissionRates | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  
  const withdrawalRequestsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'withdrawalRequests'), where('status', '==', 'pending')) : null,
    [firestore]
  );
  const { data: withdrawalRequests, isLoading: withdrawalsLoading } = useCollection<WithdrawalRequest>(withdrawalRequestsQuery);

  useEffect(() => {
    const fetchAllSettings = async () => {
      if (!firestore) return;
      setIsLoading(true);
      
      const settingsDocRef = doc(firestore, 'adminSettings', 'settings');
      const ratesDocRef = doc(firestore, 'commissionRates', 'adminConfig');

      const settingsSnap = await getDoc(settingsDocRef);
      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data() as AdminSettings);
      } else {
        await setDoc(settingsDocRef, defaultSettings);
        setSettings(defaultSettings);
      }
      
      const ratesSnap = await getDoc(ratesDocRef);
      if (ratesSnap.exists()) {
        setRates(ratesSnap.data() as CommissionRates);
      } else {
        await setDoc(ratesDocRef, defaultCommissionRates);
        setRates(defaultCommissionRates);
      }

      setIsLoading(false);
    };

    fetchAllSettings();
  }, [firestore]);

  const handleInputChange = (path: string, value: string, target: 'settings' | 'rates') => {
    const numValue = Number(value);
    if (target === 'settings' && settings) {
      const keys = path.split('.');
      setSettings(prev => {
          const newSettings = JSON.parse(JSON.stringify(prev));
          let current: any = newSettings;
          for(let i = 0; i < keys.length - 1; i++) {
              current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = numValue;
          return newSettings;
      });
    } else if (target === 'rates' && rates) {
       setRates(prev => ({...prev!, [path]: numValue}));
    }
  };

  const handleSave = async () => {
    if (!settings || !rates || !firestore) return;
    try {
      const settingsDocRef = doc(firestore, 'adminSettings', 'settings');
      const ratesDocRef = doc(firestore, 'commissionRates', 'adminConfig');
      await updateDoc(settingsDocRef, settings);
      await updateDoc(ratesDocRef, rates);
      toast({
        title: "Settings Saved",
        description: "All configurations have been successfully saved.",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save settings.",
      });
    }
  };

  const approvePayout = async (id: string) => {
    if (!firestore) return;
    try {
      const requestRef = doc(firestore, "withdrawalRequests", id);
      await updateDoc(requestRef, {
        status: "approved",
        processedAt: new Date().toISOString()
      });
      toast({
        title: "Payout Approved",
        description: "The payout process has been initiated.",
      });
    } catch (error) {
       console.error("Error approving payout:", error);
       toast({
        variant: "destructive",
        title: "Approval Failed",
        description: "Could not approve the payout request.",
      });
    }
  };

  if (isLoading) {
      return (
          <div className="dark">
              <Header isMuted={true} onToggleMute={() => {}}/>
              <div className="max-w-4xl mx-auto p-4 pt-20"><p>Loading settings...</p></div>
          </div>
      )
  }

  return (
    <div className="dark">
       <Header isMuted={true} onToggleMute={() => {}}/>
      <div className="max-w-4xl mx-auto p-4 pt-20">
         <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Settings &amp; Payouts</h1>
           <div className='flex gap-2'>
            <Button variant="outline" asChild><Link href="/admin/marketplace">Marketplace</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/agents">Agents</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/sessions">Sessions</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/revenue">Revenue</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/verification">Verification</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/trust">Trust</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/community">Community</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(settings && rates) && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Core Pricing</CardTitle>
                            <CardDescription>Configure credit pricing and default agent costs.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="tzsPerCredit">TZS per Credit</Label>
                                <Input id="tzsPerCredit" type="number" value={settings.pricing.tzsPerCredit} onChange={e => handleInputChange('pricing.tzsPerCredit', e.target.value, 'settings')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="defaultAdminPrice">Default Admin Agent Price/sec (Credits)</Label>
                                <Input id="defaultAdminPrice" type="number" step="0.01" value={settings.pricing.defaultAdminPricePerSecondCredits} onChange={e => handleInputChange('pricing.defaultAdminPricePerSecondCredits', e.target.value, 'settings')} />
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Agent Commission Rates</CardTitle>
                            <CardDescription>Set the percentage of sales that goes to the agent. E.g., 0.9 = 90%.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="productCommission">Product Sale Commission Rate</Label>
                                <Input id="productCommission" type="number" step="0.01" max="1" min="0" value={rates.productCommission} onChange={e => handleInputChange('productCommission', e.target.value, 'rates')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="serviceCommission">Service Access Commission Rate</Label>
                                <Input id="serviceCommission" type="number" step="0.01" max="1" min="0" value={rates.serviceCommission} onChange={e => handleInputChange('serviceCommission', e.target.value, 'rates')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="callCommission">Real-time Call Commission Rate</Label>
                                <Input id="callCommission" type="number" step="0.01" max="1" min="0" value={rates.callCommission} onChange={e => handleInputChange('callCommission', e.target.value, 'rates')} />
                            </div>
                        </CardContent>
                    </Card>

                    <Button size="lg" className="w-full" onClick={handleSave}>Save All Settings</Button>
                </div>
            )}
            
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Withdrawals</CardTitle>
                        <CardDescription>Approve pending requests to trigger mobile-money payouts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {withdrawalsLoading ? <p>Loading requests...</p> : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Agent ID</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawalRequests?.map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-mono text-xs">{req.agentId.substring(0,8)}...</TableCell>
                                            <TableCell>{req.amount.toLocaleString()} TZS</TableCell>
                                            <TableCell>{req.paymentMethod}</TableCell>
                                            <TableCell>
                                                {req.status === "pending" ? (
                                                    <Button size="sm" onClick={() => approvePayout(req.id)}>Approve</Button>
                                                ) : (
                                                    <span className="text-xs text-green-400 capitalize">{req.status}</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                     {!withdrawalsLoading && withdrawalRequests?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">No pending withdrawals.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
