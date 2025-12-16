'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Lenis from 'lenis';
import { ChevronDown } from 'lucide-react';

export default function RoadmapPage() {
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
        <main className="flex-1 pt-32 pb-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-5xl mx-auto">
          
          {/* Hero */}
          <div className="mb-24">
            <p className="text-xs text-[var(--accent)] tracking-widest uppercase mb-4">Roadmap</p>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              The Future<br />of GENR8
            </h1>
            <p className="text-xl text-[var(--muted)] max-w-lg">
              Our vision for the next generation of AI content generation.
            </p>
          </div>

          {/* Upcoming Features */}
          <section className="mb-24">
            <h2 className="text-3xl font-bold mb-8">Upcoming Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: 'More AI Models',
                  desc: 'Integration with Claude, Midjourney, and other leading AI models.',
                  status: 'In Progress',
                  statusColor: 'bg-[var(--accent)]/20 text-[var(--accent)]'
                },
                {
                  title: 'Batch Generation',
                  desc: 'Generate multiple images or videos in a single request.',
                  status: 'Planned',
                  statusColor: 'bg-[var(--muted)]/20 text-[var(--muted)]'
                },
                {
                  title: 'API Access',
                  desc: 'Developer API for programmatic access to GENR8 services.',
                  status: 'Coming Soon',
                  statusColor: 'bg-[var(--accent)]/10 text-[var(--accent)]'
                },
                {
                  title: 'Custom Styles',
                  desc: 'Save and reuse your favorite generation styles and presets.',
                  status: 'Planned',
                  statusColor: 'bg-[var(--muted)]/20 text-[var(--muted)]'
                },
                {
                  title: 'Team Workspaces',
                  desc: 'Collaborate with your team and share generated content.',
                  status: 'Coming Soon',
                  statusColor: 'bg-[var(--accent)]/10 text-[var(--accent)]'
                },
                {
                  title: 'Advanced Editing',
                  desc: 'In-app editing tools for fine-tuning generated content.',
                  status: 'Planned',
                  statusColor: 'bg-[var(--muted)]/20 text-[var(--muted)]'
                },
              ].map((feature, i) => (
                <div key={i} className="group relative p-6 bg-[#111] border border-[var(--dim)] transition-all duration-500 hover:border-[var(--accent)] hover:shadow-xl hover:shadow-[var(--accent)]/20 hover:-translate-y-2 rounded-2xl cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/5 group-hover:to-transparent transition-all duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold group-hover:text-[var(--accent)] transition-colors duration-500">{feature.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${feature.statusColor}`}>{feature.status}</span>
                    </div>
                    <p className="text-[var(--muted)] text-sm leading-relaxed group-hover:text-[#aaa] transition-colors duration-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section className="mb-24">
            <h2 className="text-3xl font-bold mb-8">Timeline</h2>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[var(--dim)]"></div>
              
              <div className="space-y-12">
                {[
                  {
                    date: 'Q4 2025',
                    title: 'Current Phase',
                    desc: 'Foundation complete. Core platform launched with pay-per-use model, wallet integration, and initial AI models.',
                    status: 'in-progress',
                    items: [
                      { title: 'Core platform launch', status: 'completed' },
                      { title: 'Wallet integration', status: 'completed' },
                      { title: 'Initial AI models', status: 'completed' },
                      { title: 'Payment system', status: 'completed' },
                      { title: 'Prompt optimizer', status: 'in-progress' },
                    ]
                  },
                  {
                    date: 'Q1 2026',
                    title: 'Model Expansion',
                    desc: 'Add 5+ new AI models including video generation. Performance optimization.',
                    status: 'planned',
                    items: [
                      { title: 'Add more premium models', status: 'planned' },
                      { title: 'Add different settings', status: 'planned' },
                      { title: 'Performance improvements', status: 'planned' },
                    ]
                  },
                  {
                    date: 'Q2 2026',
                    title: 'API & Developer Tools',
                    desc: 'Public API launch. Developer documentation and SDKs. Custom style presets and advanced features.',
                    status: 'planned',
                    items: [
                      { title: 'Public API launch', status: 'planned' },
                      { title: 'Developer documentation', status: 'planned' },
                      { title: 'SDKs for major languages', status: 'planned' },
                      { title: 'Custom style presets', status: 'planned' },
                      { title: 'Webhook support', status: 'planned' },
                    ]
                  },
                  {
                    date: 'Q3 2026',
                    title: 'Enterprise Features',
                    desc: 'Team workspaces, advanced editing tools, collaboration features, and analytics dashboard.',
                    status: 'planned',
                    items: [
                      { title: 'Team workspaces', status: 'planned' },
                      { title: 'Advanced editing tools', status: 'planned' },
                      { title: 'Collaboration features', status: 'planned' },
                      { title: 'Analytics dashboard', status: 'planned' },
                      { title: 'Role-based access control', status: 'planned' },
                    ]
                  },
                ].map((milestone, i) => {
                  const [isExpanded, setIsExpanded] = useState(i === 0);
                  return (
                    <div key={i} className="relative flex items-start gap-6">
                      {/* Timeline dot */}
                      <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        milestone.status === 'completed' 
                          ? 'bg-[var(--accent)] border-[var(--accent)]' 
                          : milestone.status === 'in-progress'
                          ? 'bg-[var(--accent)]/20 border-[var(--accent)] animate-pulse'
                          : 'bg-[#111] border-[var(--dim)]'
                      }`}>
                        {milestone.status === 'completed' && (
                          <svg className="w-6 h-6 text-[var(--bg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {milestone.status === 'in-progress' && (
                          <div className="w-3 h-3 rounded-full bg-[var(--accent)]"></div>
                        )}
                        {milestone.status === 'planned' && (
                          <div className="w-3 h-3 rounded-full bg-[var(--dim)]"></div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="group flex-1 pb-12">
                        <div className="bg-[#111] border border-[var(--dim)] rounded-2xl hover:border-[var(--accent)] transition-all duration-500 overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/5 group-hover:to-transparent transition-all duration-500"></div>
                          <div className="relative z-10">
                            <div 
                              className="flex items-center justify-between cursor-pointer p-6 pb-0"
                              onClick={() => setIsExpanded(!isExpanded)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="text-xs px-3 py-1 bg-[var(--dim)] text-[var(--muted)] rounded-full font-semibold">{milestone.date}</span>
                                  {milestone.status === 'completed' && (
                                    <span className="text-xs px-3 py-1 bg-[var(--accent)]/20 text-[var(--accent)] rounded-full font-semibold">Completed</span>
                                  )}
                                  {milestone.status === 'in-progress' && (
                                    <span className="text-xs px-3 py-1 bg-[var(--accent)]/20 text-[var(--accent)] rounded-full font-semibold animate-pulse">In Progress</span>
                                  )}
                                  {milestone.status === 'planned' && (
                                    <span className="text-xs px-3 py-1 bg-[var(--muted)]/20 text-[var(--muted)] rounded-full font-semibold">Planned</span>
                                  )}
                                </div>
                                <h3 className="text-xl font-bold mb-3 group-hover:text-[var(--accent)] transition-colors duration-500">{milestone.title}</h3>
                                <p className="text-[var(--muted)] text-sm leading-relaxed group-hover:text-[#aaa] transition-colors duration-500">{milestone.desc}</p>
                              </div>
                              <ChevronDown 
                                className={`w-5 h-5 text-[var(--muted)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </div>
                            
                            {/* Expandable items */}
                            {milestone.items && milestone.items.length > 0 && (
                              <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="px-6 pb-6 pt-4 space-y-3">
                                  {milestone.items.map((item, j) => (
                                    <div key={j} className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                                      item.status === 'in-progress'
                                        ? 'bg-[var(--accent)]/5 border-[var(--accent)]/30 hover:border-[var(--accent)]/50'
                                        : 'bg-[#0a0a0a] border-[var(--dim)] hover:border-[var(--accent)]/50'
                                    }`}>
                                      <span className={`text-sm ${
                                        item.status === 'in-progress' 
                                          ? 'text-[var(--accent)]' 
                                          : 'text-[var(--muted)]'
                                      }`}>{item.title}</span>
                                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                        item.status === 'completed' 
                                          ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                                          : item.status === 'in-progress'
                                          ? 'bg-[var(--accent)]/30 text-[var(--accent)]'
                                          : 'bg-[var(--muted)]/20 text-[var(--muted)]'
                                      }`}>
                                        {item.status === 'completed' ? 'Completed' : item.status === 'in-progress' ? 'In Progress' : 'Planned'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Development Phases */}
          <section className="mb-24">
            <h2 className="text-3xl font-bold mb-8">Development Phases</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  quarter: 'Q4 2025',
                  focus: 'Foundation',
                  features: ['Core platform', 'Wallet integration', 'Initial models', 'Payment system'],
                  status: 'Completed'
                },
                {
                  quarter: 'Q1 2026',
                  focus: 'Expansion',
                  features: ['New AI models', 'Video generation', 'Performance optimization'],
                  status: 'Planned'
                },
                {
                  quarter: 'Q2 2026',
                  focus: 'Developer Tools',
                  features: ['Public API', 'SDKs', 'Documentation', 'Style presets'],
                  status: 'Planned'
                },
                {
                  quarter: 'Q3 2026',
                  focus: 'Enterprise',
                  features: ['Team workspaces', 'Advanced editing', 'Collaboration', 'Analytics'],
                  status: 'Planned'
                },
              ].map((phase, i) => (
                <div key={i} className="group relative p-8 bg-[#111] border border-[var(--dim)] transition-all duration-500 hover:border-[var(--accent)] hover:shadow-xl hover:shadow-[var(--accent)]/20 hover:-translate-y-2 rounded-2xl cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/5 group-hover:to-transparent transition-all duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold group-hover:text-[var(--accent)] transition-colors duration-500">{phase.quarter}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        phase.status === 'Completed' 
                          ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                          : phase.status === 'In Progress'
                          ? 'bg-[var(--accent)]/20 text-[var(--accent)] animate-pulse'
                          : 'bg-[var(--muted)]/20 text-[var(--muted)]'
                      }`}>{phase.status}</span>
                    </div>
                    <p className="text-lg font-semibold text-[var(--muted)] mb-4 group-hover:text-[#aaa] transition-colors duration-500">{phase.focus}</p>
                    <ul className="space-y-2">
                      {phase.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-[var(--muted)] group-hover:text-[#aaa] transition-colors duration-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-60"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
        <footer className="py-10 md:py-16 px-4 md:px-12 lg:px-24 relative z-10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
            <div className="flex items-center gap-4 md:gap-8">
              <span className="text-lg md:text-xl font-bold">GENR8</span>
              <span className="text-xs md:text-sm text-[var(--muted)]">© 2025</span>
            </div>
            <div className="flex gap-6 md:gap-8">
              <a href="https://x.com/GENR8APP" target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--fg)] transition-colors text-sm md:text-base">
                Twitter
              </a>
            </div>
        </div>
      </footer>
      </div>
    </div>
  );
}

