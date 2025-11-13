'use client';
import React from 'react';

/**
 * AgentProfilePanel
 * Displays the agent's overview, stats, or about section.
 */
export function AgentProfilePanel({ agentId }: { agentId: string }) {
  if (!agentId) return null;

  return (
    <section className="border bg-card rounded-xl p-4 mt-6">
      <h2 className="font-semibold text-xl mb-2">About This Agent</h2>
      <p className="text-muted-foreground text-sm">
        Detailed profile content for agent <span className="font-medium">{agentId}</span> will appear here.
      </p>
    </section>
  );
}
