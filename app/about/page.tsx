'use client';

import Link from 'next/link';
import Header from '@/components/Header';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <Header />

      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          {/* Hero */}
          <div className="mb-24">
            <span className="text-[#666] text-sm tracking-wider uppercase block mb-4">About</span>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-8">
              Kill subscriptions<span className="text-[#c8ff00]">.</span>
            </h1>
            <p className="text-[#666] text-xl leading-relaxed max-w-2xl">
              GENR8 is a professional AI generation platform built on Solana. 
              No subscriptions, no accounts, no KYC. Just connect your wallet and create.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-1 mb-24">
            {[
              { title: 'Pay Per Use', desc: 'Only pay for what you generate. No monthly fees, no wasted credits.' },
              { title: 'Top Models', desc: 'Access Sora 2, Veo 3.1, GPT-Image, Ideogram, and Qwen in one place.' },
              { title: 'On-Chain', desc: 'All payments verified on Solana. Transparent and trustless.' },
              { title: 'Auto Refunds', desc: 'Generation failed? Automatic refund to your wallet. No tickets.' },
            ].map((item) => (
              <div key={item.title} className="bg-[#141414] p-8">
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-[#666] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Process */}
          <div className="mb-24">
            <span className="text-[#666] text-sm tracking-wider uppercase block mb-4">Process</span>
            <h2 className="text-3xl font-bold mb-12">How it works</h2>
            
            <div className="space-y-8">
              {[
                { num: '01', title: 'Connect Wallet', desc: 'Use Phantom, Solflare, or any Solana wallet' },
                { num: '02', title: 'Select Model', desc: 'Choose from 5 professional AI models' },
                { num: '03', title: 'Write Prompt', desc: 'Describe what you want to create' },
                { num: '04', title: 'Pay & Generate', desc: 'One-time payment, instant generation' },
              ].map((step) => (
                <div key={step.num} className="flex gap-8 items-start py-6 border-b border-[#1a1a1a]">
                  <span className="text-[#333] text-sm">{step.num}</span>
                  <div>
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-[#666]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-16 border-t border-[#1a1a1a]">
            <h2 className="text-3xl font-bold mb-6">Ready to start?</h2>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-4 bg-[#c8ff00] text-black font-semibold text-sm tracking-wide hover:bg-[#b8eb00] transition-colors"
            >
              OPEN DASHBOARD
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-12 border-t border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between gap-6 text-sm text-[#666]">
          <span>© 2025 GENR8</span>
          <div className="flex gap-6">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
