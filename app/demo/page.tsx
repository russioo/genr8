'use client';

import { useEffect } from 'react';
import Header from '@/components/Header';
import DemoDashboard from '@/components/DemoDashboard';
import Lenis from 'lenis';

export default function DemoPage() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-24">
          <DemoDashboard />
        </main>
      </div>
    </div>
  );
}

