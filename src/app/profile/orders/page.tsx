'use client';
import { Header } from '@/components/header';
import { useFirebaseUser, useCollection, useFirestore, useFsMemo } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersPage() {
  const { user } = useFirebaseUser();
  const firestore = useFirestore();
  
  const q = useFsMemo(() => 
    user && firestore ? query(collection(firestore, 'orders'), where('buyerId', '==', user.uid), orderBy('createdAt', 'desc')) : null
  , [user, firestore]);
  
  const { data: orders, isLoading } = useCollection(q);

  return (
    <div className="dark p-4 pt-20 max-w-xl mx-auto">
      <Header isMuted={true} onToggleMute={() => {}} />
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>
      {isLoading && (
          <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
          </div>
      )}
      {!isLoading && !orders?.length && <p className="text-gray-400 text-center py-10">You haven't placed any orders yet.</p>}
      <div className="space-y-3">
        {orders?.map((order: any) => (
            <Card key={order.id}>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="text-lg">Order #{order.id.slice(-6)}</CardTitle>
                    <CardDescription>
                        {order.createdAt?.toDate().toLocaleDateString()}
                    </CardDescription>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">TSh {order.amount?.toLocaleString()}</p>
                    <p className="text-sm capitalize text-muted-foreground">{order.status}</p>
                </div>
            </CardHeader>
            </Card>
        ))}
      </div>
    </div>
  );
}
