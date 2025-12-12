'use client';

import Link from 'next/link';
import Header from '@/components/Header';

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24">
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
                { step: '03', title: 'Generate', desc: 'Pay with $GEN and get your content' },
              ].map((item) => (
                <div key={item.step} className="group p-6 border border-[var(--dim)] transition-colors hover:border-[var(--accent)] rounded-2xl">
                  <span className="text-5xl font-bold text-[var(--dim)] group-hover:text-[var(--accent)] transition-colors">{item.step}</span>
                  <h3 className="text-xl font-bold mt-4 mb-2">{item.title}</h3>
                  <p className="text-[var(--muted)] text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Models */}
          <section className="mb-24">
            <h2 className="text-3xl font-bold mb-8">Available Models</h2>
            <div className="space-y-2">
              {[
                { name: 'GPT-4o Image', price: '$0.04', type: 'Image', desc: 'OpenAI image generation' },
                { name: 'Ideogram V3', price: '$0.07', type: 'Image', desc: 'Text-to-image with styles' },
                { name: 'Qwen', price: '$0.03', type: 'Image', desc: 'Fast image generation' },
                { name: 'Sora 2', price: '$0.21', type: 'Video', desc: 'OpenAI video model' },
                { name: 'Veo 3.1', price: '$0.36', type: 'Video', desc: 'Google video generation' },
              ].map((model) => (
                <div key={model.name} className="flex items-center justify-between p-4 border border-[var(--dim)] hover:border-[var(--accent)] transition-colors group rounded-xl">
                  <div className="flex items-center gap-6">
                    <span className="text-xs px-2 py-1 border border-[var(--dim)] text-[var(--muted)] rounded-full">{model.type}</span>
                    <div>
                      <span className="font-semibold">{model.name}</span>
                      <span className="text-[var(--muted)] text-sm ml-3">{model.desc}</span>
                    </div>
                  </div>
                  <span className="text-[var(--accent)] font-semibold">{model.price}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Payment Info */}
          <section className="mb-24">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-3xl font-bold mb-6">Payment</h2>
                <p className="text-[var(--muted)] mb-6">
                  Pay per generation with $GEN tokens on Solana. No subscriptions, no commitments.
                </p>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-[var(--dim)]">
                    <span className="text-[var(--muted)]">Network</span>
                    <span>Solana Mainnet</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[var(--dim)]">
                    <span className="text-[var(--muted)]">Tokens</span>
                    <span><span className="text-[var(--accent)]">$GEN</span> or USDC</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[var(--dim)]">
                    <span className="text-[var(--muted)]">Confirmation</span>
                    <span>~2 seconds</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-3xl font-bold mb-6">Wallet Setup</h2>
                <div className="space-y-3">
                  {[
                    'Download Phantom from phantom.app',
                    'Buy $GEN on Jupiter or Raydium',
                    'Add SOL for transaction fees',
                    'Connect wallet and start creating',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 border border-[var(--dim)] rounded-lg">
                      <span className="text-[var(--accent)] font-bold">{i + 1}</span>
                      <span className="text-[var(--muted)]">{step}</span>
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
              className="px-8 py-4 bg-[var(--accent)] text-[var(--bg)] font-semibold text-center hover:opacity-90 transition-opacity rounded-full"
            >
              Open Dashboard
            </Link>
            <a
              href="https://x.com/genr8ai"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-[var(--dim)] font-semibold text-center hover:border-[var(--accent)] transition-colors rounded-full"
            >
              Follow on X
            </a>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 lg:px-24">
        <div className="max-w-5xl mx-auto flex justify-between text-sm text-[var(--muted)]">
          <span>© 2024 GENR8</span>
          <Link href="/" className="hover:text-[var(--fg)] transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  );
}
