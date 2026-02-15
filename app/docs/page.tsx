'use client';

import { useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Lenis from 'lenis';

export default function DocsPage() {
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
            <p className="text-xs text-[var(--accent)] tracking-widest uppercase mb-4">Documentation</p>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Getting<br />Started
            </h1>
            <p className="text-xl text-[var(--muted)] max-w-lg">
              Everything you need to start generating AI content with GENR8.
            </p>
          </div>

          {/* Why GENR8 - Simplified */}
          <section className="mb-24">
            <h2 className="text-3xl font-bold mb-8">Why GENR8?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="group relative p-6 bg-[#111] border border-[var(--dim)] transition-all duration-500 hover:border-[var(--accent)] hover:shadow-xl hover:shadow-[var(--accent)]/20 hover:-translate-y-2 rounded-2xl cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/5 group-hover:to-transparent transition-all duration-500"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-3 group-hover:text-[var(--accent)] transition-colors duration-500">No Subscriptions</h3>
                  <p className="text-[var(--muted)] text-sm leading-relaxed group-hover:text-[#aaa] transition-colors duration-500">
                    Pay only when you generate. No monthly fees, no commitments.
                  </p>
                </div>
              </div>
              
              <div className="group relative p-6 bg-[#111] border border-[var(--dim)] transition-all duration-500 hover:border-[var(--accent)] hover:shadow-xl hover:shadow-[var(--accent)]/20 hover:-translate-y-2 rounded-2xl cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/5 group-hover:to-transparent transition-all duration-500"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-3 group-hover:text-[var(--accent)] transition-colors duration-500">70-80% Cheaper</h3>
                  <p className="text-[var(--muted)] text-sm leading-relaxed group-hover:text-[#aaa] transition-colors duration-500">
                    For most users, pay-per-use is significantly more affordable than monthly plans.
                  </p>
                </div>
              </div>
              
              <div className="group relative p-6 bg-[#111] border border-[var(--dim)] transition-all duration-500 hover:border-[var(--accent)] hover:shadow-xl hover:shadow-[var(--accent)]/20 hover:-translate-y-2 rounded-2xl cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/5 group-hover:to-transparent transition-all duration-500"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-3 group-hover:text-[var(--accent)] transition-colors duration-500">All Top Models</h3>
                  <p className="text-[var(--muted)] text-sm leading-relaxed group-hover:text-[#aaa] transition-colors duration-500">
                    Access OpenAI, Google, Ideogram, and more—all in one place.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Comparison */}
          <section className="mb-24">
            <h2 className="text-3xl font-bold mb-8">GENR8 vs Traditional Subscriptions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* GENR8 */}
              <div className="group relative p-8 bg-[#111] border-2 border-[var(--accent)] rounded-2xl hover:shadow-2xl hover:shadow-[var(--accent)]/30 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-6 group-hover:text-[var(--accent)] transition-colors duration-500">With GENR8</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center py-3 border-b border-[var(--dim)] group-hover:border-[var(--accent)]/30 transition-colors duration-500">
                      <span className="text-[var(--muted)] group-hover:text-[#aaa] transition-colors duration-500">10 images @ $0.04</span>
                      <span className="font-semibold group-hover:text-[var(--accent)] transition-colors duration-500">$0.40</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[var(--dim)] group-hover:border-[var(--accent)]/30 transition-colors duration-500">
                      <span className="text-[var(--muted)] group-hover:text-[#aaa] transition-colors duration-500">5 videos @ $0.21</span>
                      <span className="font-semibold group-hover:text-[var(--accent)] transition-colors duration-500">$1.05</span>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                      <span className="text-lg font-bold group-hover:text-[var(--accent)] transition-colors duration-500">Total</span>
                      <span className="text-2xl font-bold text-[var(--accent)] group-hover:scale-110 transition-transform duration-500">$1.45</span>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--muted)] group-hover:text-[#aaa] transition-colors duration-500">Pay only for what you use. No monthly fees.</p>
                </div>
              </div>

              {/* Traditional */}
              <div className="group p-8 bg-[#0a0a0a] border border-[var(--dim)] rounded-2xl hover:border-[var(--dim)]/50 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#1a1a1a]/80 z-10 pointer-events-none"></div>
                <div className="relative z-0">
                  <h3 className="text-2xl font-bold mb-6 text-[var(--muted)] transition-colors duration-300">Traditional Subscriptions</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center py-3 border-b border-[var(--dim)]/50">
                      <span className="text-[var(--muted)]/70">Image generation plan</span>
                      <span className="font-semibold text-[var(--muted)]">$19/month</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[var(--dim)]/50">
                      <span className="text-[var(--muted)]/70">Video generation plan</span>
                      <span className="font-semibold text-[var(--muted)]">$29/month</span>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                      <span className="text-lg font-bold text-[var(--muted)]">Total</span>
                      <span className="text-2xl font-bold text-[var(--muted)]">$48/month</span>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--muted)]/70">Even if you only use it once.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Start */}
          <section className="mb-24">
            <h2 className="text-3xl font-bold mb-8">Getting Started</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Connect', desc: 'Link your Phantom or Solflare wallet' },
                { step: '02', title: 'Choose', desc: 'Pick a model and write your prompt' },
                { step: '03', title: 'Generate', desc: 'Pay with $GENR8 and get your content' },
              ].map((item) => (
                <div key={item.step} className="group relative p-8 bg-[#111] border border-[var(--dim)] transition-all duration-500 hover:border-[var(--accent)] hover:shadow-xl hover:shadow-[var(--accent)]/20 hover:-translate-y-2 rounded-2xl cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/5 group-hover:to-transparent transition-all duration-500"></div>
                  <div className="relative z-10">
                    <span className="text-5xl font-bold text-[var(--dim)] group-hover:text-[var(--accent)] transition-all duration-500 block mb-4 group-hover:scale-110">{item.step}</span>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-[var(--accent)] transition-colors duration-500">{item.title}</h3>
                    <p className="text-[var(--muted)] text-sm leading-relaxed group-hover:text-[#aaa] transition-colors duration-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Models */}
          <section className="mb-24">
            <h2 className="text-3xl font-bold mb-8">Available Models</h2>
            <div className="space-y-3">
              {[
                { name: 'GPT-4o Image', price: '$0.04', type: 'Image', desc: 'OpenAI image generation' },
                { name: 'Ideogram V3', price: '$0.07', type: 'Image', desc: 'Text-to-image with styles' },
                { name: 'Qwen', price: '$0.03', type: 'Image', desc: 'Fast image generation' },
                { name: 'Sora 2', price: '$0.21', type: 'Video', desc: 'OpenAI video model' },
                { name: 'Veo 3.1', price: '$0.36', type: 'Video', desc: 'Google video generation' },
              ].map((model) => (
                <div key={model.name} className="group relative flex items-center justify-between p-5 bg-[#111] border border-[var(--dim)] hover:border-[var(--accent)] hover:bg-[#1a1a1a] transition-all duration-500 rounded-xl cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/5 group-hover:to-transparent transition-all duration-500"></div>
                  <div className="relative z-10 flex items-center gap-6 flex-1">
                    <span className={`text-xs px-3 py-1.5 border border-[var(--dim)] text-[var(--muted)] rounded-full transition-all duration-500 group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] group-hover:bg-[var(--accent)]/10 ${model.type === 'Video' ? 'bg-[var(--accent)]/10' : ''}`}>{model.type}</span>
                    <div>
                      <span className="font-semibold group-hover:text-[var(--accent)] transition-colors duration-500">{model.name}</span>
                      <span className="text-[var(--muted)] text-sm ml-3 group-hover:text-[#aaa] transition-colors duration-500">{model.desc}</span>
                    </div>
                  </div>
                  <span className="relative z-10 text-[var(--accent)] font-semibold text-lg group-hover:scale-110 transition-transform duration-500">{model.price}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Payment Info */}
          <section className="mb-24">
            <h2 className="text-3xl font-bold mb-8">Payment & Setup</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="group relative bg-[#111] border border-[var(--dim)] rounded-2xl p-8 hover:border-[var(--accent)] transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/5 group-hover:to-transparent transition-all duration-500"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-6 group-hover:text-[var(--accent)] transition-colors duration-500">Payment</h3>
                  <p className="text-[var(--muted)] mb-8 text-sm group-hover:text-[#aaa] transition-colors duration-500">
                    Pay per generation with $GENR8 tokens on Solana. No subscriptions, no commitments.
                  </p>
                  <div className="space-y-4">
                    <div className="flex justify-between py-4 border-b border-[var(--dim)] group-hover:border-[var(--accent)]/30 transition-colors duration-500">
                      <span className="text-[var(--muted)] group-hover:text-[#aaa] transition-colors duration-500">Network</span>
                      <span className="font-medium group-hover:text-[var(--accent)] transition-colors duration-500">Solana Mainnet</span>
                    </div>
                    <div className="flex justify-between py-4 border-b border-[var(--dim)] group-hover:border-[var(--accent)]/30 transition-colors duration-500">
                      <span className="text-[var(--muted)] group-hover:text-[#aaa] transition-colors duration-500">Tokens</span>
                      <span><span className="text-[var(--accent)] font-semibold">$GENR8</span> or USDC</span>
                    </div>
                    <div className="flex justify-between py-4 border-b border-[var(--dim)] group-hover:border-[var(--accent)]/30 transition-colors duration-500">
                      <span className="text-[var(--muted)] group-hover:text-[#aaa] transition-colors duration-500">Confirmation</span>
                      <span className="font-medium group-hover:text-[var(--accent)] transition-colors duration-500">~2 seconds</span>
                    </div>
                    <div className="flex justify-between py-4">
                      <span className="text-[var(--muted)] group-hover:text-[#aaa] transition-colors duration-500">Minimum</span>
                      <span className="font-medium group-hover:text-[var(--accent)] transition-colors duration-500">No minimum spend</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="group relative bg-[#111] border border-[var(--dim)] rounded-2xl p-8 hover:border-[var(--accent)] transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/5 group-hover:to-transparent transition-all duration-500"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-6 group-hover:text-[var(--accent)] transition-colors duration-500">Wallet Setup</h3>
                  <div className="space-y-3">
                    {[
                      'Download Phantom from phantom.app',
                      'Buy $GENR8 on Jupiter or Raydium',
                      'Add SOL for transaction fees',
                      'Connect wallet and start creating',
                    ].map((step, i) => (
                      <div key={i} className="group/item relative flex items-start gap-4 p-4 bg-[#0a0a0a] border border-[var(--dim)] rounded-lg hover:border-[var(--accent)] hover:bg-[#111] transition-all duration-500 cursor-pointer overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover/item:from-[var(--accent)]/5 group-hover/item:to-transparent transition-all duration-500"></div>
                        <span className="relative z-10 text-[var(--accent)] font-bold text-lg group-hover/item:scale-110 transition-transform duration-500">{i + 1}</span>
                        <span className="relative z-10 text-[var(--muted)] group-hover/item:text-[#aaa] transition-colors duration-500 flex-1 text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Use Cases */}
          <section className="mb-24">
            <h2 className="text-3xl font-bold mb-8">Perfect For</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Content Creators',
                  desc: 'Generate thumbnails and social posts without monthly commitments.'
                },
                {
                  title: 'Developers & Designers',
                  desc: 'Prototype and test visuals on-demand, no subscriptions needed.'
                },
                {
                  title: 'Businesses',
                  desc: 'Scale based on actual needs. Pay only for what you generate.'
                },
              ].map((item) => (
                <div key={item.title} className="group relative p-6 bg-[#111] border border-[var(--dim)] transition-all duration-500 hover:border-[var(--accent)] hover:shadow-xl hover:shadow-[var(--accent)]/20 hover:-translate-y-2 rounded-2xl cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/0 to-[var(--accent)]/0 group-hover:from-[var(--accent)]/5 group-hover:to-transparent transition-all duration-500"></div>
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold mb-3 group-hover:text-[var(--accent)] transition-colors duration-500">{item.title}</h3>
                    <p className="text-[var(--muted)] text-sm leading-relaxed group-hover:text-[#aaa] transition-colors duration-500">{item.desc}</p>
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
              <a href="https://x.com/paypergenr8" target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--fg)] transition-colors text-sm md:text-base">
                Twitter
              </a>
            </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
