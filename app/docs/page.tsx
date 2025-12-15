'use client';

import { useEffect } from 'react';
import Link from 'next/link';
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

          {/* Quick Start */}
          <section className="mb-24">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Connect', desc: 'Link your Phantom or Solflare wallet' },
                { step: '02', title: 'Choose', desc: 'Pick a model and write your prompt' },
                { step: '03', title: 'Generate', desc: 'Pay with $GENR8 and get your content' },
              ].map((item) => (
                <div key={item.step} className="group p-8 bg-[#111] border border-[var(--dim)] transition-all duration-300 hover:border-[var(--accent)] hover:shadow-lg hover:shadow-[var(--accent)]/10 hover:-translate-y-1 rounded-2xl cursor-pointer">
                  <span className="text-5xl font-bold text-[var(--dim)] group-hover:text-[var(--accent)] transition-all duration-300 block mb-4">{item.step}</span>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-[var(--accent)] transition-colors duration-300">{item.title}</h3>
                  <p className="text-[var(--muted)] text-sm leading-relaxed group-hover:text-[#aaa] transition-colors duration-300">{item.desc}</p>
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
                <div key={model.name} className="flex items-center justify-between p-5 bg-[#111] border border-[var(--dim)] hover:border-[var(--accent)] hover:bg-[#1a1a1a] transition-all duration-300 group rounded-xl cursor-pointer">
                  <div className="flex items-center gap-6">
                    <span className={`text-xs px-3 py-1.5 border border-[var(--dim)] text-[var(--muted)] rounded-full transition-all duration-300 group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] ${model.type === 'Video' ? 'bg-[var(--accent)]/10' : ''}`}>{model.type}</span>
                    <div>
                      <span className="font-semibold group-hover:text-[var(--accent)] transition-colors duration-300">{model.name}</span>
                      <span className="text-[var(--muted)] text-sm ml-3 group-hover:text-[#aaa] transition-colors duration-300">{model.desc}</span>
                    </div>
                  </div>
                  <span className="text-[var(--accent)] font-semibold text-lg group-hover:scale-110 transition-transform duration-300">{model.price}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Payment Info */}
          <section className="mb-24">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#111] border border-[var(--dim)] rounded-2xl p-8 hover:border-[var(--accent)] transition-all duration-300 group">
                <h2 className="text-3xl font-bold mb-6 group-hover:text-[var(--accent)] transition-colors duration-300">Payment</h2>
                <p className="text-[var(--muted)] mb-8 leading-relaxed group-hover:text-[#aaa] transition-colors duration-300">
                  Pay per generation with $GENR8 tokens on Solana. No subscriptions, no commitments.
                </p>
                <div className="space-y-4">
                  <div className="flex justify-between py-4 border-b border-[var(--dim)] group-hover:border-[var(--dim)]/50 transition-colors duration-300">
                    <span className="text-[var(--muted)]">Network</span>
                    <span className="font-medium">Solana Mainnet</span>
                  </div>
                  <div className="flex justify-between py-4 border-b border-[var(--dim)] group-hover:border-[var(--dim)]/50 transition-colors duration-300">
                    <span className="text-[var(--muted)]">Tokens</span>
                    <span><span className="text-[var(--accent)] font-semibold">$GENR8</span> or USDC</span>
                  </div>
                  <div className="flex justify-between py-4 border-b border-[var(--dim)] group-hover:border-[var(--dim)]/50 transition-colors duration-300">
                    <span className="text-[var(--muted)]">Confirmation</span>
                    <span className="font-medium">~2 seconds</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#111] border border-[var(--dim)] rounded-2xl p-8 hover:border-[var(--accent)] transition-all duration-300 group">
                <h2 className="text-3xl font-bold mb-6 group-hover:text-[var(--accent)] transition-colors duration-300">Wallet Setup</h2>
                <div className="space-y-3">
                  {[
                    'Download Phantom from phantom.app',
                    'Buy $GENR8 on Jupiter or Raydium',
                    'Add SOL for transaction fees',
                    'Connect wallet and start creating',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-[#0a0a0a] border border-[var(--dim)] rounded-lg hover:border-[var(--accent)]/50 hover:bg-[#111] transition-all duration-300 group/item cursor-pointer">
                      <span className="text-[var(--accent)] font-bold text-lg group-hover/item:scale-110 transition-transform duration-300">{i + 1}</span>
                      <span className="text-[var(--muted)] group-hover/item:text-[#aaa] transition-colors duration-300 flex-1">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/dashboard"
              className="group/btn px-8 py-4 bg-[var(--accent)] text-[var(--bg)] font-semibold text-center hover:shadow-lg hover:shadow-[var(--accent)]/30 hover:scale-105 transition-all duration-300 rounded-full relative overflow-hidden"
            >
              <span className="relative z-10">Open Dashboard</span>
              <span className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            </Link>
            <a
              href="https://x.com/GENR8APP"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-[var(--dim)] font-semibold text-center hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 hover:scale-105 transition-all duration-300 rounded-full"
            >
              Follow on X
            </a>
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
              {['Twitter', 'Discord', 'GitHub'].map((link, i) => (
                <a key={i} href="#" className="text-[var(--muted)] hover:text-[var(--fg)] transition-colors text-sm md:text-base">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
