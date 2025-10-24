'use client';
import { Header } from '@/components/header';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/auth/login');
    }
  };


  return (
    <div className="dark p-4 pt-20 max-w-xl mx-auto">
      <Header isMuted={true} onToggleMute={() => {}} />
      <Card>
        <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your application preferences and account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
                <Label htmlFor="notifications" className="font-normal">Push Notifications</Label>
                <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="flex justify-between items-center py-3 border-b">
                <Label htmlFor="darkMode" className="font-normal">Dark Mode</Label>
                <Switch id="darkMode" checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
            <div className="flex justify-between items-center py-3 border-b">
                <Label className="font-normal">Current Plan</Label>
                <span className="text-primary font-semibold">Premium</span>
            </div>
             <Button variant="outline" className="w-full">Manage Subscription</Button>
             <Button variant="destructive" className="w-full" onClick={handleSignOut}>Sign Out</Button>
        </CardContent>
      </Card>
    </div>
  );
}
