'use client';

import Header from '@/components/Header';
import InteractiveBackground from '@/components/InteractiveBackground';
import ChatDashboard from '@/components/ChatDashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <InteractiveBackground />
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-24">
          <ChatDashboard />
        </main>
      </div>
    </div>
  );
}

