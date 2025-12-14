'use client';

import Header from '@/components/Header';
import GrainBackground from '@/components/GrainBackground';
import ChatDashboard from '@/components/ChatDashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen relative">
      <GrainBackground />
      {/* Subtle gradient overlay for depth */}
      <div className="fixed inset-0 bg-gradient-to-br from-[var(--accent)]/[0.03] via-transparent to-[var(--accent)]/[0.02] pointer-events-none" />
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-24">
          <ChatDashboard />
        </main>
      </div>
    </div>
  );
}

