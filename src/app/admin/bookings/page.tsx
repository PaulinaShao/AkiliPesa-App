
'use client';
import { Header } from "@/components/header";
import { BookingTable } from "@/components/BookingTable";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminBookingsPage() {
    return (
        <div className="dark">
            <Header isMuted={true} onToggleMute={() => {}} />
            <div className="p-4 md:p-6 pt-20">
                 <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gradient">All Agent Bookings</h1>
                     <div className='flex gap-2'>
                        <Button variant="outline" asChild><Link href="/admin/marketplace">Marketplace</Link></Button>
                        <Button variant="outline" asChild><Link href="/admin/agents">Agents</Link></Button>
                        <Button variant="outline" asChild><Link href="/admin/earnings">Earnings</Link></Button>
                        <Button variant="outline" asChild><Link href="/admin/sessions">Sessions</Link></Button>
                        <Button variant="outline" asChild><Link href="/admin/revenue">Revenue</Link></Button>
                        <Button variant="outline" asChild><Link href="/admin/settings">Settings</Link></Button>
                        <Button variant="outline" asChild><Link href="/admin/verification">Verification</Link></Button>
                        <Button variant="outline" asChild><Link href="/admin/trust">Trust</Link></Button>
                        <Button variant="outline" asChild><Link href="/admin/community">Community</Link></Button>
                        <Button asChild><Link href="/admin/bookings">Bookings</Link></Button>
                    </div>
                </div>
                <BookingTable adminMode={true} />
            </div>
        </div>
    );
}
