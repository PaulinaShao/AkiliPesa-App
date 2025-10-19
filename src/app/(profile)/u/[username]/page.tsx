
"use client";
import { useEffect, useState, useRef, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { useFirebaseUser, useFirestore } from '@/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  setDoc,
  deleteDoc,
  addDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Share2,
  Edit,
  Grid3X3,
  Bot,
  Grid,
  Briefcase,
  Gift,
  Settings,
  UserPlus,
  UserCheck,
  Bell,
  X,
  Save,
  ShoppingBag,
  Receipt,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileNav } from './components/ProfileNav';
import { TrustScoreBadge } from './components/TrustScoreBadge';
import { BuyerTrustBadge } from './components/BuyerTrustBadge';
import { AkiliPointsBadge } from './components/AkiliPointsBadge';
import { ProfileQuickActions } from './components/ProfileQuickActions';
import { Header } from '@/components/header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

function ProfileEditor({ profile, onSave, onCancel }: { profile: any, onSave: (updates: any) => void, onCancel: () => void }) {
    const [bio, setBio] = useState(profile.bio || "");
    const [displayName, setDisplayName] = useState(profile.displayName || "");

    const handleSave = () => {
        onSave({ bio, displayName });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={onCancel}
        >
            <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-lg border border-primary/30" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-input" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Bio</label>
                        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="bg-input" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
                </div>
            </div>
        </motion.div>
    );
}


export default function ProfilePage() {
  useAuthRedirect();
  const { username } = useParams() as { username?: string };
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [creditFlash, setCreditFlash] = useState(false);
  const { user: currentUser } = useFirebaseUser();
  const firestore = useFirestore();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const walletListenerRef = useRef<() => void>();
  const notifListenerRef = useRef<() => void>();
  const followListenerRef = useRef<() => void>();

  useEffect(() => {
    // Cleanup function to be called on unmount
    return () => {
        if (walletListenerRef.current) walletListenerRef.current();
        if (notifListenerRef.current) notifListenerRef.current();
        if (followListenerRef.current) followListenerRef.current();
    };
  }, []);

  useEffect(() => {
    if (!username || !firestore) {
      setLoading(false);
      return;
    }
    
    let profileData: any = null;

    const fetchProfile = async () => {
        setLoading(true);
        const usersRef = collection(firestore, "users");
        const handleQuery = query(usersRef, where("handle", "==", username), limit(1));
        const handleSnap = await getDocs(handleQuery);

        if (!handleSnap.empty) {
            profileData = { ...handleSnap.docs[0].data(), id: handleSnap.docs[0].id };
        } else {
            // Fallback to UID lookup
            const userRef = doc(firestore, "users", username);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                profileData = { ...userSnap.data(), id: userSnap.id };
            }
        }
        
        if (profileData) {
            setProfile(profileData);
            setupListeners(profileData.id);

            const postsQuery = query(collection(firestore, "posts"), where("authorId", "==", profileData.id), orderBy("createdAt", "desc"));
            const postsSnap = await getDocs(postsQuery);
            setPosts(postsSnap.docs.map(d => ({...d.data(), id: d.id })));
            
            const followersSnap = await getDocs(query(collection(firestore, "followers"), where("followedId", "==", profileData.id)));
            setFollowersCount(followersSnap.size);
            const followingSnap = await getDocs(query(collection(firestore, "followers"), where("followerId", "==", profileData.id)));
            setFollowingCount(followingSnap.size);

        } else {
           setProfile(null);
        }
        setLoading(false);
    };

    const setupListeners = (profileId: string) => {
        const walletRef = doc(firestore, "wallets", profileId);
        walletListenerRef.current = onSnapshot(walletRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                if (wallet && data.balanceTZS > (wallet.balanceTZS ?? 0)) {
                    setCreditFlash(true);
                    setTimeout(() => setCreditFlash(false), 1500);
                }
                setWallet(data);
            } else {
                setWallet({ balanceTZS: 0, escrow: 0, plan: { credits: 0 } });
            }
        });
        
        if (currentUser && currentUser.uid !== profileId) {
            const followRef = doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
            followListenerRef.current = onSnapshot(followRef, (snap) => {
                setIsFollowing(snap.exists());
            });
        }
    };
    
    fetchProfile();

  }, [username, currentUser, firestore]);


  useEffect(() => {
    if (!profile?.id || !firestore) return;

    const notifQuery = query(
      collection(firestore, "notifications"),
      where("uid", "==", profile.id),
      orderBy("createdAt", "desc")
    );

    const unsubNotif = onSnapshot(notifQuery, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.isRead).length);
    });

    notifListenerRef.current = unsubNotif;

    return () => unsubNotif();
  }, [profile?.id, firestore]);

  const markAllAsRead = async () => {
    if (!firestore) return;
    const unread = notifications.filter((n) => !n.isRead);
    for (const note of unread) {
      const ref = doc(firestore, "notifications", note.id);
      await updateDoc(ref, { isRead: true });
    }
    setUnreadCount(0);
  };

  const toggleNotifs = async () => {
    const newState = !showNotifs;
    setShowNotifs(newState);
    if (newState) await markAllAsRead();
  };

   const handleFollowToggle = async () => {
    if (!currentUser || !profile || !firestore) return;
    const followRef = doc(firestore, "followers", `${currentUser.uid}_${profile.id}`);
    const userRef = doc(firestore, "users", profile.id);

    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        await updateDoc(userRef, { "stats.followers": (profile.stats.followers || 1) - 1 });
      } else {
        await setDoc(followRef, {
          followerId: currentUser.uid,
          followedId: profile.id,
          createdAt: new Date(),
        });
        await updateDoc(userRef, { "stats.followers": (profile.stats.followers || 0) + 1 });
        await addDoc(collection(firestore, "notifications"), {
          uid: profile.id,
          type: "new_follower",
          message: `${currentUser.displayName || "Someone"} followed you.`,
          isRead: false,
          createdAt: new Date(),
        });
      }
    } catch (e) {
      console.error("Follow action failed:", e);
    }
  };

  const handleSaveProfile = async (updates: any) => {
    if (!currentUser || !profile || !firestore || currentUser.uid !== profile.id) return;
    try {
      const userRef = doc(firestore, "users", profile.id);
      await updateDoc(userRef, { ...updates, updatedAt: new Date() });
      setProfile((prev: any) => ({ ...prev, ...updates }));
      setShowEditor(false);
    } catch (e) {
      console.error("Profile update failed:", e);
    }
  };
  
  if (loading) return <div className="flex justify-center items-center h-screen text-gray-400">Loading...</div>;
  if (!profile) return <div className="flex justify-center items-center h-screen text-gray-400">User not found.</div>;
  
  const isOwnProfile = currentUser?.uid === profile.id;

  const renderPostGrid = () => {
    if(posts.length === 0) return <div className="text-center text-muted-foreground py-16">No posts yet.</div>

    return (
        <div className="grid grid-cols-3 gap-1 mt-4">
            {posts.map(post => (
                <div key={post.id} className="relative aspect-[9/16] bg-muted overflow-hidden rounded-md group">
                    <Image src={post.media.url} alt={post.caption || 'Post'} fill objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" data-ai-hint="lifestyle content" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 text-white flex items-center gap-1 text-sm font-bold">
                        <Heart size={14}/>
                        <span>{post.likes || 0}</span>
                    </div>
                </div>
            ))}
        </div>
    )
  }

  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={()=>{}}/>
      
      {isOwnProfile && (
        <div className="fixed top-4 right-6 flex gap-3 z-50 items-center">
            <motion.div
            animate={creditFlash ? { scale: [1, 1.1, 1], opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 0.8 }}
            className="bg-[#0e0e10]/80 border border-[#8B5CF6]/40 px-4 py-2 rounded-xl backdrop-blur-md text-sm flex items-center gap-2"
            >
                <Wallet size={16} className="text-[#8B5CF6]" />
                <span className="font-semibold">
                    {wallet ? `TZS ${wallet.balanceTZS?.toLocaleString()}` : "TZS 0"}
                </span>
            </motion.div>
            <button
              onClick={toggleNotifs}
              className="relative bg-[#0e0e10]/80 border border-[#8B5CF6]/30 p-2.5 rounded-xl hover:border-[#8B5CF6]/70"
            >
              <Bell size={18} className="text-[#8B5CF6]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#8B5CF6] text-xs text-white w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
        </div>
      )}

      <AnimatePresence>
        {showNotifs && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-6 w-80 bg-[#0e0e10]/95 backdrop-blur-xl border border-[#8B5CF6]/40 rounded-2xl p-4 z-50 shadow-lg"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[#8B5CF6] text-sm font-semibold">Notifications</h3>
              <button onClick={() => setShowNotifs(false)}>
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            {notifications.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`bg-[#18181b]/60 border border-[#8B5CF6]/20 p-3 rounded-lg text-xs text-gray-300 ${!n.isRead ? 'font-bold' : 'opacity-70'}`}
                  >
                    <p>{n.message}</p>
                    <p className="text-gray-500 text-[10px] mt-1">{new Date(n.createdAt?.toDate()).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center py-6">
                No notifications yet
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showEditor && <ProfileEditor profile={profile} onSave={handleSaveProfile} onCancel={() => setShowEditor(false)} />}
      </AnimatePresence>

      <div className="max-w-xl mx-auto p-4 pt-20 supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(env(safe-area-inset-bottom)+80px)]">
        <ProfileHeader
          user={{
            id: profile.id,
            username: profile.handle,
            name: profile.displayName,
            avatar: profile.photoURL,
            bio: profile.bio || '',
            stats: { ...profile.stats, followers: followersCount, following: followingCount }
          }}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
          onEditClick={() => setShowEditor(true)}
        />
        
        {isOwnProfile && <TrustScoreBadge sellerId={profile.id} />}
        {isOwnProfile && <BuyerTrustBadge buyerId={profile.id} />}
        {isOwnProfile && <AkiliPointsBadge userId={profile.id} />}
        {isOwnProfile && <ProfileQuickActions />}
        <ProfileNav />
        
        <div className="pb-16 md:pb-0">
          {renderPostGrid()}
        </div>
      </div>
    </div>
  );
}
