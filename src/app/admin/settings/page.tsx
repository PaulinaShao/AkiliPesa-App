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

export default function AdminSettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const settingsDocRef = doc(firestore, 'adminSettings', 'settings');

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      const docSnap = await getDoc(settingsDocRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AdminSettings);
      } else {
        // If doc doesn't exist, create it with default values
        await setDoc(settingsDocRef, defaultSettings);
        setSettings(defaultSettings);
        console.log("No settings document found, created one with default values.");
      }
      setIsLoading(false);
    };

    fetchSettings();
  }, [firestore]);

  const handleInputChange = (path: string, value: string) => {
    if (!settings) return;
    const keys = path.split('.');
    setSettings(prev => {
        const newSettings = JSON.parse(JSON.stringify(prev)); // Deep copy
        let current: any = newSettings;
        for(let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = Number(value);
        return newSettings;
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      await updateDoc(settingsDocRef, settings);
      toast({
        title: "Settings Saved",
        description: "Your changes have been successfully saved.",
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

        {settings && (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pricing</CardTitle>
                        <CardDescription>Configure credit pricing and default agent costs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="tzsPerCredit">TZS per Credit</Label>
                            <Input id="tzsPerCredit" type="number" value={settings.pricing.tzsPerCredit} onChange={e => handleInputChange('pricing.tzsPerCredit', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="defaultAdminPrice">Default Admin Agent Price/sec (Credits)</Label>
                            <Input id="defaultAdminPrice" type="number" step="0.01" value={settings.pricing.defaultAdminPricePerSecondCredits} onChange={e => handleInputChange('pricing.defaultAdminPricePerSecondCredits', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Commission Models</CardTitle>
                        <CardDescription>Set revenue splits for products and services. Values should sum to 1.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Product Sales</h3>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="prodPlatform">Platform Share</Label>
                                    <Input id="prodPlatform" type="number" step="0.01" max="1" value={settings.commissionModels.product.platform} onChange={e => handleInputChange('commissionModels.product.platform', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prodCreator">Creator Share</Label>
                                    <Input id="prodCreator" type="number" step="0.01" max="1" value={settings.commissionModels.product.creator} onChange={e => handleInputChange('commissionModels.product.creator', e.target.value)} />
                                </div>
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2">Service Access (Calls)</h3>
                             <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="servPlatform">Platform Share</Label>
                                    <Input id="servPlatform" type="number" step="0.01" max="1" value={settings.commissionModels.serviceAccess.platform} onChange={e => handleInputChange('commissionModels.serviceAccess.platform', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="servCommission">Affiliate Share</Label>
                                    <Input id="servCommission" type="number" step="0.01" max="1" value={settings.commissionModels.serviceAccess.commission} onChange={e => handleInputChange('commissionModels.serviceAccess.commission', e.target.value)} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="servCreator">Creator Share</Label>
                                    <Input id="servCreator" type="number" step="0.01" max="1" value={settings.commissionModels.serviceAccess.creator} onChange={e => handleInputChange('commissionModels.serviceAccess.creator', e.target.value)} />
                                </div>
                            </div>
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
