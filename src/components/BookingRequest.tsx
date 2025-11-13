'use client';
import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * BookingRequest
 * Form for submitting a booking request to an agent.
 */
export function BookingRequest({ agentId }: { agentId: string }) {
  if (!agentId) return null;

  function handleBooking() {
    console.log(`Booking requested for agent: ${agentId}`);
    // Future: integrate Firestore or Cloud Function here
  }

  return (
    <div className="border rounded-lg p-4 bg-card">
      <h4 className="font-semibold mb-2">Request a Booking</h4>
      <p className="text-muted-foreground text-sm mb-3">
        Click below to request a session with this agent.
      </p>
      <Button onClick={handleBooking} className="w-full">Book Now</Button>
    </div>
  );
}
