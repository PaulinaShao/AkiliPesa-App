'use client';
import { Header } from '@/components/header';
import { useFirebaseUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditProfilePage() {
  const { user } = useFirebaseUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: profile, isLoading } = useDoc<any>(userDocRef);

  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setHandle(profile.handle || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user || !firestore) return;
    try {
      await updateDoc(doc(firestore, 'users', user.uid), { 
        displayName, 
        handle,
        bio, 
        updatedAt: new Date() 
      });
      toast({ title: 'Profile Updated', description: 'Your changes have been saved.'});
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.'});
    }
  };

  if (isLoading) {
      return (
          <div className="dark p-4 pt-20 max-w-xl mx-auto">
              <Header isMuted={true} onToggleMute={() => {}} />
              <Skeleton className="h-8 w-48 mb-4"/>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
          </div>
      )
  }

  return (
    <div className="dark p-4 pt-20 max-w-xl mx-auto">
      <Header isMuted={true} onToggleMute={() => {}} />
      <Card>
        <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your public profile information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" />
            </div>
             <div>
                <Label htmlFor="handle">Username</Label>
                <Input id="handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="Your @username" />
            </div>
            <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself" />
            </div>
            <Button className="w-full" onClick={handleSave}>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
