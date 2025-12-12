'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

// Animated counter component
function Counter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <span ref={ref} className="counter">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// Split text for hover effect
function SplitText({ children }: { children: string }) {
  return (
    <span className="split-text inline-block">
      {children.split('').map((char, i) => (
        <span key={i} className="inline-block transition-all duration-300">{char === ' ' ? '\u00A0' : char}</span>
      ))}
    </span>
  );
}

// Interactive logo text
function LogoText() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const letters = ['G', 'E', 'N', 'R', '8'];
  
  return (
    <span className="inline-flex">
      {letters.map((letter, i) => (
        <span
          key={i}
          className="inline-block transition-all duration-300 cursor-default"
          style={{
            transform: hoveredIndex !== null 
              ? `translateY(${Math.sin((i - hoveredIndex) * 0.8) * (hoveredIndex === i ? -12 : -6)}px)`
              : 'translateY(0)',
            color: hoveredIndex !== null && Math.abs(i - hoveredIndex) <= 1 
              ? 'var(--accent)' 
              : 'inherit',
          }}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {letter}
        </span>
      ))}
    </span>
  );
}

// Floating model card
function FloatingCard({ name, type, delay, x, y }: { name: string; type: string; delay: number; x: number; y: number }) {
  return (
    <div 
      className="absolute bg-[#141414] border border-[#222] px-4 py-3 opacity-0 animate-float-in"
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
        animationDelay: `${delay}s`,
      }}
    >
      <p className="text-sm font-medium">{name}</p>
      <p className="text-xs text-[var(--muted)]">{type}</p>
    </div>
  );
}

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const models = [
    { name: 'GPT-4o', type: 'Text', price: '0.02' },
    { name: 'DALL·E 3', type: 'Image', price: '0.04' },
    { name: 'Gemini Pro', type: 'Text', price: '0.01' },
    { name: 'Ideogram', type: 'Image', price: '0.03' },
    { name: 'Flux Pro', type: 'Image', price: '0.05' },
    { name: 'Qwen VL', type: 'Video', price: '0.08' },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen overflow-hidden">
        {/* Cursor follower */}
        <div 
          className="cursor-blob"
          style={{ 
            left: mousePos.x - 150, 
            top: mousePos.y - 150,
          }}
        />
      
      {/* Hero */}
      <section className="relative min-h-screen flex items-center px-6 md:px-12 lg:px-24">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(var(--muted) 1px, transparent 1px),
            linear-gradient(90deg, var(--muted) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} />

        <div className="relative z-10 w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className={`${isLoaded ? 'animate-in' : 'opacity-0'}`}>
            {/* Main heading */}
            <h1 className="text-[clamp(4rem,12vw,9rem)] font-extrabold leading-[0.9] tracking-tight mb-6">
              <span className="block"><LogoText /></span>
              <span className="block text-[var(--muted)] text-[0.4em] font-medium mt-4">
                AI Generation. <span className="text-[var(--accent)]">Pay Once.</span>
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-[var(--muted)] mb-10 max-w-xl leading-relaxed animate-in delay-1">
              No subscriptions. No commitments. Generate images and videos with the best AI models. Pay only for what you create with $GEN tokens.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4 animate-in delay-2">
              <Link 
                href="/dashboard" 
                className="group relative px-8 py-4 bg-[var(--accent)] text-[var(--bg)] font-semibold overflow-hidden rounded-full"
              >
                <span className="relative z-10">Start Generating</span>
                <span className="absolute inset-0 bg-white transform translate-y-full transition-transform duration-300 group-hover:translate-y-0" />
              </Link>
              
              <Link 
                href="/docs" 
                className="group relative px-8 py-4 border border-[var(--dim)] text-[var(--fg)] font-semibold overflow-hidden rounded-full"
              >
                <span className="relative z-10 transition-colors duration-300 group-hover:text-[var(--bg)]">Documentation</span>
                <span className="absolute inset-0 bg-[var(--fg)] transform translate-y-full transition-transform duration-300 group-hover:translate-y-0" />
              </Link>
            </div>
          </div>

          {/* Right - Price display */}
          <div className="hidden lg:flex flex-col items-end justify-center animate-in delay-3">
            <div className="group text-right cursor-default">
              <p className="text-xs text-[var(--muted)] mb-4 tracking-widest transition-colors group-hover:text-[var(--accent)] uppercase">Starting from</p>
              <div className="relative">
                <p className="text-[7rem] font-black leading-none text-[var(--fg)] transition-all duration-500 group-hover:text-[var(--accent)]">
                  $0<span className="text-[3.5rem]">.01</span>
                </p>
                <div className="absolute -bottom-2 left-0 w-0 h-1 bg-[var(--accent)] transition-all duration-500 group-hover:w-full" />
              </div>
              <p className="text-sm text-[var(--muted)] mt-6 uppercase tracking-widest">per generation</p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-xs text-[var(--muted)] tracking-widest uppercase">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-[var(--muted)] to-transparent" />
        </div>
      </section>

      {/* Stats section with counters */}
      <section className="relative py-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { value: 12847, label: 'Generations', suffix: '+' },
              { value: 6, label: 'AI Models', suffix: '' },
              { value: 99, label: 'Uptime', suffix: '%' },
              { value: 0.01, label: 'Min Price', suffix: ' USDC' },
            ].map((stat, i) => (
              <div key={i} className="group">
                <div className="text-4xl md:text-5xl font-bold mb-2 transition-colors group-hover:text-[var(--accent)]">
                  {stat.value === 0.01 ? (
                    <span>$0.01</span>
                  ) : (
                    <Counter end={stat.value} suffix={stat.suffix} />
                  )}
                </div>
                <div className="text-sm text-[var(--muted)] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="py-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-xs text-[var(--accent)] tracking-widest uppercase">Models</span>
              <h2 className="text-5xl md:text-6xl font-bold mt-2">
                <SplitText>Choose your model</SplitText>
              </h2>
            </div>
            <Link href="/dashboard" className="text-reveal text-[var(--muted)] hover:text-[var(--fg)]">
              View all →
            </Link>
          </div>

          <div className="space-y-0">
            {models.map((model, i) => (
              <Link 
                key={i}
                href="/dashboard"
                className="group flex items-center justify-between py-5 transition-all hover:px-4 hover:bg-[var(--surface)] rounded-xl"
              >
                <div className="flex items-center gap-8">
                  <span className="text-sm text-[var(--muted)] w-8">0{i + 1}</span>
                  <span className="text-2xl font-semibold transition-colors group-hover:text-[var(--accent)]">{model.name}</span>
                  <span className="px-3 py-1 text-xs border border-[var(--dim)] text-[var(--muted)] rounded-full">{model.type}</span>
                </div>
                <div className="flex items-center gap-8">
                  <span className="text-[var(--muted)]">${model.price}</span>
                  <span className="text-2xl transition-transform group-hover:translate-x-2 group-hover:text-[var(--accent)]">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20">
            <span className="text-xs text-[var(--accent)] tracking-widest uppercase">Process</span>
            <h2 className="text-5xl md:text-6xl font-bold mt-2">How it works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-0">
            {[
              { num: '01', title: 'Connect', desc: 'Link your Solana wallet. Phantom, Solflare, or any compatible wallet works.' },
              { num: '02', title: 'Generate', desc: 'Choose a model, enter your prompt. Pay per generation with $GEN or USDC.' },
              { num: '03', title: 'Download', desc: 'Get your content instantly. No watermarks, full ownership, no strings.' },
            ].map((step, i) => (
              <div key={i} className="group relative p-8 border-l border-[var(--dim)] first:border-l-0 hover:bg-[var(--bg)] transition-colors">
                <span className="text-7xl font-bold text-[var(--dim)] transition-colors group-hover:text-[var(--accent)] block mb-8">
                  {step.num}
                </span>
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-[var(--muted)] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'No Subscriptions', desc: 'Pay only for what you generate. No monthly fees, no unused credits.' },
              { title: 'Instant Delivery', desc: 'Your content is generated and delivered within seconds.' },
              { title: '$GEN Token', desc: 'Hold $GEN for discounts. The more you hold, the less you pay.' },
              { title: 'Full Ownership', desc: 'Everything you generate belongs to you. Commercial use included.' },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group relative p-8 border border-[var(--dim)] bg-[#0d0d0d] cursor-default transition-all duration-500 hover:border-[var(--accent)] hover:bg-[#0f1a0d] rounded-2xl"
              >
                <span className="text-6xl font-bold text-[var(--dim)] absolute top-6 right-6 transition-colors duration-500 group-hover:text-[var(--accent)] opacity-20 group-hover:opacity-40">
                  0{i + 1}
                </span>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-3 transition-colors duration-300 group-hover:text-[var(--accent)]">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--muted)] leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom section wrapper - allows G8 to flow */}
      <div className="relative">
        {/* G8 Background - Large and flowing across sections */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ top: '-5%' }}>
          <span className="text-[38vw] font-black leading-none text-[var(--fg)] opacity-[0.03]">G8</span>
        </div>

        {/* Marquee */}
        <section className="py-12 overflow-hidden relative z-10">
          <div className="marquee">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex shrink-0">
                {['GPT-4o', 'DALL·E 3', 'Gemini', 'Ideogram', 'Flux Pro', 'Qwen', 'Sora 2', 'Veo 3'].map((name, j) => (
                  <span key={j} className="flex items-center mx-10 whitespace-nowrap">
                    <span className="w-2 h-2 bg-[var(--accent)] mr-4" />
                    <span className="text-xl font-medium">{name}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6 md:px-12 lg:px-24 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
              <div className="flex-1">
                <p className="text-xs text-[var(--accent)] mb-6 tracking-widest uppercase">Start Now</p>
                <h2 className="text-5xl md:text-7xl font-black leading-[0.95] mb-6">
                  Ready to<br />
                  <span className="text-[var(--accent)]">generate?</span>
                </h2>
                <p className="text-lg text-[var(--muted)] max-w-md">
                  No credit card. No subscription. Connect wallet and create.
                </p>
              </div>
              
              <div className="flex flex-col items-start lg:items-end gap-6">
                <Link 
                  href="/dashboard" 
                  className="group flex items-center gap-4 px-10 py-5 bg-[var(--accent)] text-[var(--bg)] text-lg font-bold transition-all hover:gap-6 rounded-full"
                >
                  <span>Launch App</span>
                  <span className="text-xl">→</span>
                </Link>
                <div className="flex items-center gap-8 text-sm text-[var(--muted)]">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                    Solana
                  </span>
                  <span>6+ Models</span>
                  <span>$0.01</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-6 md:px-12 lg:px-24 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold">GENR8</span>
            <span className="text-sm text-[var(--muted)]">© 2024</span>
          </div>
          <div className="flex gap-8">
            {['Twitter', 'Discord', 'GitHub'].map((link, i) => (
              <a key={i} href="#" className="text-reveal text-[var(--muted)] hover:text-[var(--fg)]">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
      </div>
    </main>
    </>
  );
}
