'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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


export default function AdminSettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [rates, setRates] = useState<CommissionRates | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const settingsDocRef = doc(firestore, 'adminSettings', 'settings');
  const ratesDocRef = doc(firestore, 'commissionRates', 'adminConfig');

  useEffect(() => {
    const fetchAllSettings = async () => {
      setIsLoading(true);
      
      // Fetch pricing settings
      const settingsSnap = await getDoc(settingsDocRef);
      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data() as AdminSettings);
      } else {
        await setDoc(settingsDocRef, defaultSettings);
        setSettings(defaultSettings);
      }
      
      // Fetch commission rates
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
          const newSettings = JSON.parse(JSON.stringify(prev)); // Deep copy
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
    if (!settings || !rates) return;
    try {
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

  if (isLoading) {
      return (
          <div className="dark">
              <Header isMuted={true} onToggleMute={() => {}}/>
              <div className="max-w-2xl mx-auto p-4 pt-20"><p>Loading settings...</p></div>
          </div>
      )
  }

  return (
    <div className="dark">
       <Header isMuted={true} onToggleMute={() => {}}/>
      <div className="max-w-2xl mx-auto p-4 pt-20">
         <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Settings</h1>
           <Button variant="outline" asChild><Link href="/admin/agents">Agents</Link></Button>
        </div>

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
      </div>
    </div>
  );
}
