'use client';
import React from 'react';

/**
 * AvailabilityCalendar
 * Displays the agent's available timeslots for booking.
 */
export function AvailabilityCalendar({ agentId }: { agentId: string }) {
  if (!agentId) return null;

  return (
    <div className="border rounded-lg p-4 bg-card mb-4">
      <h4 className="font-semibold mb-2">Availability</h4>
      <p className="text-muted-foreground text-sm">
        Calendar data for <span className="font-medium">{agentId}</span> will load here.
      </p>
    </div>
  );
}
