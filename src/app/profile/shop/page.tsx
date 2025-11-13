'use client';
import { Header } from '@/components/header';
import { useFirebaseUser, useCollection, useFirestore, useFsMemo } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ShopPage() {
  const { user } = useFirebaseUser();
  const firestore = useFirestore();
  
  const q = useFsMemo(() => 
    user && firestore ? query(collection(firestore, 'products'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc')) : null,
    [user, firestore]
  );
  const { data: products, isLoading } = useCollection(q);

  return (
    <div className="dark p-4 pt-20 max-w-xl mx-auto">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Shop</h1>
        <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Product</Button>
      </div>
      
      {isLoading && (
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {!isLoading && !products?.length && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-gray-400">You haven't listed any products yet.</p>
          <Button variant="link" className="text-primary">Create your first listing</Button>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-4">
        {products?.map((p: any) => (
          <Card key={p.id}>
            <CardHeader>
                <CardTitle>{p.title}</CardTitle>
                <CardDescription>{p.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-lg mb-2">TSh {p.price?.toLocaleString()}</p>
              <Button variant="outline" className="w-full">Edit Product</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
