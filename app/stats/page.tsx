'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Lenis from 'lenis';

interface PlatformStats {
  totalGenerations: number;
  totalRevenueUSD: number;
  totalGENR8TokensUsed: number;
  generationsByModel: Record<string, number>;
  revenueByModel: Record<string, number>;
  lastUpdated: string;
}

const modelNames: Record<string, string> = {
  'gpt-image-1': 'GPT-4o Image',
  'ideogram': 'Ideogram V3',
  'qwen': 'Qwen',
  'nano-banan-pro': 'Nano Banana Pro',
  'sora-2': 'Sora 2',
  'veo-3.1': 'Veo 3.1',
  'grok-imagine': 'Grok Imagine',
};

function AnimatedNumber({ value, duration = 1500, suffix = '', prefix = '' }: { value: number; duration?: number; suffix?: string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) {
      setDisplayValue(value);
      return;
    }

    setHasAnimated(true);
    const startValue = 0;
    const steps = 60;
    const increment = value / steps;
    let current = startValue;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, duration, hasAnimated]);

  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

function StatCard({ 
  label, 
  value, 
  subtitle, 
  delay = 0,
  trend
}: { 
  label: string; 
  value: string | number; 
  subtitle?: string;
  delay?: number;
  trend?: string;
}) {
  return (
    <div 
      className="group relative bg-[#111] border border-[var(--dim)] rounded-xl p-6 transition-all duration-500 hover:border-[var(--accent)]/50 hover:shadow-lg hover:shadow-[var(--accent)]/5"
      style={{
        animation: `fadeSlideIn 0.6s ease-out ${delay}ms both`,
      }}
    >
      <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-3">{label}</p>
      <p className="text-3xl md:text-4xl font-bold text-[var(--fg)] mb-2">
        {typeof value === 'number' ? (
          <AnimatedNumber value={value} />
        ) : (
          value
        )}
      </p>
      {subtitle && (
        <p className="text-sm text-[var(--muted)]">{subtitle}</p>
      )}
      {trend && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-[var(--accent)]">{trend}</span>
        </div>
      )}
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    
    // Refresh every 5 seconds for live updates
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !stats) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-32 pb-24 px-6 md:px-12 lg:px-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-20">
              <div className="inline-block w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[var(--muted)] mt-4">Loading stats...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  const topModels = Object.entries(stats.generationsByModel)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const avgRevenuePerGen = stats.totalGenerations > 0 
    ? stats.totalRevenueUSD / stats.totalGenerations 
    : 0;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 pb-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          
          {/* Hero */}
          <div className="mb-16">
            <span className="text-xs text-[var(--accent)] tracking-[0.15em] uppercase mb-4 block font-medium">Live Stats</span>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
              Platform Statistics
            </h1>
            <p className="text-lg text-[var(--muted)] max-w-2xl leading-relaxed">
              Real-time insights into GENR8 platform activity
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]">
              <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse"></div>
              <span>Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard 
              label="Total Generations" 
              value={stats.totalGenerations}
              subtitle="All time"
              delay={0}
            />
            <StatCard 
              label="Total Revenue" 
              value={`$${stats.totalRevenueUSD.toFixed(2)}`}
              subtitle="USD"
              delay={100}
            />
            <StatCard 
              label="GENR8 Tokens Used" 
              value={stats.totalGENR8TokensUsed}
              subtitle="tokens"
              delay={200}
            />
            <StatCard 
              label="Avg. Per Generation" 
              value={`$${avgRevenuePerGen.toFixed(3)}`}
              subtitle="USD"
              delay={300}
            />
          </div>

          {/* Model Breakdown */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Top Models</h2>
                <p className="text-[var(--muted)]">Performance by model</p>
              </div>
              <div className="text-sm text-[var(--muted)]">
                {topModels.length} models tracked
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topModels.map(([model, count], index) => {
                const revenue = stats.revenueByModel[model] || 0;
                const percentage = stats.totalGenerations > 0 
                  ? (count / stats.totalGenerations) * 100 
                  : 0;
                const avgPerGen = count > 0 ? revenue / count : 0;
                
                return (
                  <div
                    key={model}
                    className="group relative bg-[#111] border border-[var(--dim)] rounded-xl p-6 transition-all duration-300 hover:border-[var(--accent)]/50 hover:shadow-lg hover:shadow-[var(--accent)]/5"
                    style={{
                      animation: `fadeSlideIn 0.6s ease-out ${400 + index * 50}ms both`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors mb-1">
                          {modelNames[model] || model}
                        </h3>
                        <p className="text-xs text-[var(--muted)]">Model ID: {model}</p>
                      </div>
                      <span className="text-lg font-bold text-[var(--accent)]">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--muted)]">Generations</span>
                        <span className="text-[var(--fg)] font-semibold">{count.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--muted)]">Revenue</span>
                        <span className="text-[var(--fg)] font-semibold">${revenue.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--muted)]">Avg. per gen</span>
                        <span className="text-[var(--fg)] font-semibold">${avgPerGen.toFixed(3)}</span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="h-2 bg-[var(--dim)] rounded-full overflow-hidden mt-4">
                        <div
                          className="h-full bg-[var(--accent)] transition-all duration-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Additional Stats Row */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111] border border-[var(--dim)] rounded-xl p-6">
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">Total Models</p>
              <p className="text-2xl font-bold text-[var(--fg)]">
                {Object.keys(stats.generationsByModel).length}
              </p>
              <p className="text-sm text-[var(--muted)] mt-2">Active models</p>
            </div>
            
            <div className="bg-[#111] border border-[var(--dim)] rounded-xl p-6">
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">Revenue Rate</p>
              <p className="text-2xl font-bold text-[var(--fg)]">
                ${avgRevenuePerGen.toFixed(3)}
              </p>
              <p className="text-sm text-[var(--muted)] mt-2">Per generation</p>
            </div>
            
            <div className="bg-[#111] border border-[var(--dim)] rounded-xl p-6">
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">Token Efficiency</p>
              <p className="text-2xl font-bold text-[var(--fg)]">
                {stats.totalGENR8TokensUsed > 0 
                  ? (stats.totalRevenueUSD / stats.totalGENR8TokensUsed).toFixed(2)
                  : '0.00'}
              </p>
              <p className="text-sm text-[var(--muted)] mt-2">USD per token</p>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
