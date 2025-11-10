
'use client';

import { useFirestore, useCollection, useMemoFirebase, useFirebaseUser } from '@/firebase';
import { collection, collectionGroup, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type BookingRequest = {
    id: string;
    agentId: string;
    userId: string;
    start: { toDate: () => Date };
    end: { toDate: () => Date };
    status: 'pending' | 'approved' | 'declined';
    createdAt: { toDate: () => Date };
};

export function BookingTable({ adminMode, agentId }: { adminMode: boolean; agentId?: string }) {
    const firestore = useFirestore();
    const { user } = useFirebaseUser();
    const { toast } = useToast();

    const bookingsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        if (adminMode) {
            return query(collectionGroup(firestore, 'requests'), orderBy('createdAt', 'desc'));
        }
        if (agentId) {
            return query(collection(firestore, 'agentBookings', agentId, 'requests'), orderBy('createdAt', 'desc'));
        }
        return null;
    }, [firestore, adminMode, agentId]);

    const { data: bookings, isLoading } = useCollection<BookingRequest>(bookingsQuery);

    const handleStatusChange = async (booking: BookingRequest, newStatus: 'approved' | 'declined') => {
        if (!firestore) return;
        const agentIdForUpdate = adminMode ? booking.agentId : agentId;
        if (!agentIdForUpdate) return;
        
        const bookingRef = doc(firestore, 'agentBookings', agentIdForUpdate, 'requests', booking.id);
        try {
            await updateDoc(bookingRef, { status: newStatus });
            toast({
                title: "Booking Updated",
                description: `Booking has been ${newStatus}.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Could not update booking status.",
            });
        }
    };
    
    const canManage = (booking: BookingRequest) => {
        if (adminMode) return true;
        if (agentId && user?.uid === agentId) return true;
        return false;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {adminMode && <TableHead>Agent</TableHead>}
                    <TableHead>User</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>}
                {!isLoading && bookings?.map(booking => (
                    <TableRow key={booking.id}>
                        {adminMode && <TableCell className="font-mono text-xs">{booking.agentId?.slice(0,8)}...</TableCell>}
                        <TableCell className="font-mono text-xs">{booking.userId.slice(0,8)}...</TableCell>
                        <TableCell>{format(booking.start.toDate(), 'Pp')}</TableCell>
                        <TableCell>{format(booking.end.toDate(), 'Pp')}</TableCell>
                        <TableCell>
                            <Badge variant={booking.status === 'approved' ? 'default' : booking.status === 'declined' ? 'destructive' : 'secondary'}>
                                {booking.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                            {booking.status === 'pending' && canManage(booking) && (
                                <>
                                    <Button size="sm" onClick={() => handleStatusChange(booking, 'approved')}>Approve</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange(booking, 'declined')}>Decline</Button>
                                </>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
                {!isLoading && bookings?.length === 0 && <TableRow><TableCell colSpan={6} className="text-center">No bookings found.</TableCell></TableRow>}
            </TableBody>
        </Table>
    );
}
