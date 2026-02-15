'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Lenis from 'lenis';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { getUSDCBalance } from '@/lib/solana-payment';

const REQUIRED_TOKENS = 100000;

// DEV wallet that gets free access
const DEV_WALLET = '8Q2PYkXiqPwCQLs59nbjbDhuXnG6VpmhnXR4U7Yt7bbM';

const STYLES = [
  { id: 'normal', name: 'Normal', desc: 'Enhanced quality' },
  { id: 'realistic', name: 'Realistic', desc: 'Photorealistic' },
  { id: 'ghibli', name: 'Ghibli', desc: 'Studio Ghibli' },
  { id: 'drawn', name: 'Drawn', desc: 'Hand-drawn' },
  { id: 'anime', name: 'Anime', desc: 'Anime style' },
  { id: 'cinematic', name: 'Cinematic', desc: 'Film quality' },
  { id: '3d', name: '3D', desc: '3D rendered' },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, isVisible } = useScrollReveal();
  
  return (
    <div 
      ref={ref}
      className="transition-all duration-1000 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function PromptOptimizerPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contentType, setContentType] = useState<'image' | 'video'>('image');
  const [style, setStyle] = useState('normal');
  
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();

  const isDevWallet = publicKey?.toString() === DEV_WALLET;
  const hasAccess = isDevWallet || (tokenBalance !== null && tokenBalance >= REQUIRED_TOKENS);

  useEffect(() => {
    setIsLoaded(true);
    
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
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    async function checkBalance() {
      if (connected && publicKey) {
        setIsLoadingBalance(true);
        try {
          const balance = await getUSDCBalance(connection, publicKey);
          setTokenBalance(balance);
        } catch (error) {
          console.error('Error checking balance:', error);
          setTokenBalance(0);
        } finally {
          setIsLoadingBalance(false);
        }
      } else {
        setTokenBalance(null);
      }
    }
    checkBalance();
  }, [connected, publicKey, connection]);

  const handleOptimize = async () => {
    if (!prompt.trim() || (!hasAccess && !isDevWallet)) return;
    
    setIsOptimizing(true);
    setOptimizedPrompt('');
    
    try {
      const response = await fetch('/api/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt.trim(), 
          type: contentType,
          style: style,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to optimize prompt');
      
      const data = await response.json();
      setOptimizedPrompt(data.optimizedPrompt);
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      setOptimizedPrompt(`${prompt.trim()}, high quality, detailed`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(optimizedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen overflow-hidden">
        {/* Hero Section */}
        <section className="pt-28 pb-8 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="group relative rounded-xl overflow-hidden border border-[var(--dim)] transition-all duration-700 ease-out hover:border-[var(--dim)]/80">
              <div 
                className="absolute inset-0 transition-transform duration-1000 ease-out group-hover:scale-[1.02] blur-[2px]"
                style={{
                  backgroundImage: 'url(/ea60f6895611494c03045877c3b5683c_1765024581.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/90 to-[var(--bg)]/70" />
              
              <div className={`relative z-10 p-8 md:p-12 lg:p-16 min-h-[400px] flex flex-col justify-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <span className="text-xs text-[var(--accent)] tracking-widest uppercase mb-4">Free for Token Holders</span>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                  <span className="text-[var(--fg)] inline-flex overflow-hidden">
                    {'Prompt'.split('').map((char, i) => (
                      <span 
                        key={i} 
                        className="inline-block animate-slide-up-letter hover:text-[var(--accent)] hover:-translate-y-1 transition-all duration-200 cursor-default"
                        style={{ animationDelay: `${i * 0.03}s` }}
                      >
                        {char}
                      </span>
                    ))}
                  </span>
                  <br />
                  <span className="text-[var(--accent)] inline-flex overflow-hidden">
                    {'Optimizer'.split('').map((char, i) => (
                      <span 
                        key={i} 
                        className="inline-block animate-slide-up-letter hover:text-white hover:-translate-y-1 transition-all duration-200 cursor-default"
                        style={{ animationDelay: `${0.3 + i * 0.03}s` }}
                      >
                        {char}
                      </span>
                    ))}
                  </span>
                </h1>
                <p className="text-base md:text-lg text-[var(--muted)] max-w-lg mb-8">
                  Transform basic prompts into detailed, optimized descriptions. Choose your style and let AI enhance your vision.
                </p>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-[var(--bg)]/50 backdrop-blur-sm border border-[var(--dim)] rounded-lg">
                    <span className="text-[var(--muted)] text-sm">Required: </span>
                    <span className="text-[var(--accent)] font-semibold">{REQUIRED_TOKENS.toLocaleString()} $GENR8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-10 md:py-16 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto">
            {!connected ? (
              <ScrollReveal>
                <div className="group relative rounded-xl overflow-hidden border border-[var(--dim)] hover:border-[var(--muted)] transition-all duration-500">
                  <div className="absolute inset-0" style={{ transform: 'scaleX(-1)' }}>
                    <div 
                      className="absolute inset-0 transition-all duration-700 group-hover:scale-105 blur-[2px]"
                      style={{
                        backgroundImage: 'url(/1765030347698-wrnpvaau0ej.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/80 to-[var(--bg)]/60" />
                  
                  <div className="relative z-10 p-8 md:p-16 text-center min-h-[400px] flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full border border-[var(--dim)] flex items-center justify-center mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)]">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">Connect Your Wallet</h2>
                    <p className="text-[var(--muted)] mb-8 max-w-md">
                      Connect your Solana wallet to access the Prompt Optimizer. Available exclusively for GENR8 token holders.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ) : isLoadingBalance ? (
              <ScrollReveal>
                <div className="rounded-xl border border-[var(--dim)] bg-[#111] p-16 text-center">
                  <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[var(--muted)]">Checking token balance...</p>
                </div>
              </ScrollReveal>
            ) : !hasAccess ? (
              <ScrollReveal>
                <div className="group relative rounded-xl overflow-hidden border border-[var(--dim)] hover:border-[var(--muted)] transition-all duration-500">
                  <div 
                    className="absolute inset-0 transition-all duration-700 group-hover:scale-105 blur-[2px]"
                    style={{
                      backgroundImage: 'url(/1765030583940-2jekhrzwcle.png)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/90 to-[var(--bg)]/70" />
                  
                  <div className="relative z-10 p-8 md:p-16 min-h-[400px] flex flex-col justify-center">
                    <div className="max-w-xl">
                      <span className="text-xs text-red-400 tracking-widest uppercase mb-4 block">Insufficient Balance</span>
                      <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        You need more<br />
                        <span className="text-[var(--accent)]">$GENR8 tokens</span>
                      </h2>
                      <p className="text-[var(--muted)] mb-8">
                        Hold at least {REQUIRED_TOKENS.toLocaleString()} $GENR8 tokens to unlock the free Prompt Optimizer.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-6 mb-8">
                        <div className="bg-[var(--bg)]/50 backdrop-blur-sm border border-[var(--dim)] rounded-xl p-4">
                          <p className="text-[var(--muted)] text-xs uppercase tracking-wider mb-1">Your Balance</p>
                          <p className="text-2xl font-bold text-red-400">{tokenBalance?.toLocaleString()} <span className="text-base font-normal text-[var(--muted)]">$GENR8</span></p>
                        </div>
                        <div className="bg-[var(--bg)]/50 backdrop-blur-sm border border-[var(--dim)] rounded-xl p-4">
                          <p className="text-[var(--muted)] text-xs uppercase tracking-wider mb-1">Required</p>
                          <p className="text-2xl font-bold text-[var(--accent)]">{REQUIRED_TOKENS.toLocaleString()} <span className="text-base font-normal text-[var(--muted)]">$GENR8</span></p>
                        </div>
                      </div>

                      <div className="mb-8">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-[var(--muted)]">Progress</span>
                          <span className="text-[var(--muted)]">{Math.min(100, ((tokenBalance || 0) / REQUIRED_TOKENS) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-[var(--dim)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 to-[var(--accent)] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, ((tokenBalance || 0) / REQUIRED_TOKENS) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <a 
                        href="https://jup.ag/swap/SOL-FJvjng3A2BSYuHmQd1jQyDfz8Rvi7n9gcFYWHAFWpump"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/btn inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded-xl overflow-hidden relative"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Buy $GENR8 on Jupiter
                          <span className="transition-transform group-hover/btn:translate-x-1">→</span>
                        </span>
                        <span className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                      </a>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <ScrollReveal>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs text-[var(--accent)] tracking-widest uppercase">Optimizer</span>
                      <h2 className="text-3xl md:text-4xl font-bold mt-1">Create Better Prompts</h2>
                    </div>
                    <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-[#111] border border-[var(--dim)] rounded-xl">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      {isDevWallet ? (
                        <span className="text-sm text-[var(--accent)] font-medium">Dev Wallet - Free Access</span>
                      ) : (
                        <span className="text-sm text-[var(--muted)]">Balance: <span className="text-[var(--fg)] font-medium">{tokenBalance?.toLocaleString()} $GENR8</span></span>
                      )}
                    </div>
                  </div>
                </ScrollReveal>

                {/* Content Type Toggle */}
                <ScrollReveal delay={50}>
                  <div className="flex gap-2 p-1 bg-[#111] border border-[var(--dim)] rounded-xl w-fit">
                    <button
                      onClick={() => setContentType('image')}
                      className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        contentType === 'image' 
                          ? 'bg-[var(--accent)] text-[var(--bg)]' 
                          : 'text-[var(--muted)] hover:text-[var(--fg)]'
                      }`}
                    >
                      Image
                    </button>
                    <button
                      onClick={() => setContentType('video')}
                      className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        contentType === 'video' 
                          ? 'bg-[var(--accent)] text-[var(--bg)]' 
                          : 'text-[var(--muted)] hover:text-[var(--fg)]'
                      }`}
                    >
                      Video
                    </button>
                  </div>
                </ScrollReveal>

                {/* Style Selector */}
                <ScrollReveal delay={100}>
                  <div>
                    <label className="text-sm text-[var(--muted)] uppercase tracking-wider mb-3 block">Style</label>
                    <div className="flex flex-wrap gap-2">
                      {STYLES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStyle(s.id)}
                          className={`px-4 py-2.5 rounded-lg border transition-all duration-300 ${
                            style === s.id 
                              ? 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]' 
                              : 'bg-[#111] border-[var(--dim)] text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--fg)]'
                          }`}
                        >
                          <span className="font-medium">{s.name}</span>
                          <span className="text-xs ml-2 opacity-60">{s.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>

                {/* Input area */}
                <ScrollReveal delay={150}>
                  <div className="rounded-xl border border-[var(--dim)] bg-[#111] overflow-hidden">
                    <div className="p-6 border-b border-[var(--dim)]">
                      <label className="text-sm text-[var(--muted)] uppercase tracking-wider">Your Prompt</label>
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe what you want to create..."
                      className="w-full h-32 bg-transparent p-6 text-lg resize-none focus:outline-none placeholder:text-[var(--dim)]"
                    />
                    <div className="flex justify-between items-center p-4 border-t border-[var(--dim)] bg-[#0a0a0a]">
                      <span className="text-xs text-[var(--muted)]">{prompt.length} characters</span>
                      <button
                        onClick={handleOptimize}
                        disabled={!prompt.trim() || isOptimizing}
                        className="group/btn inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded-xl overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {isOptimizing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin" />
                              Optimizing...
                            </>
                          ) : (
                            <>
                              Optimize
                              <span className="transition-transform group-hover/btn:translate-x-1">→</span>
                            </>
                          )}
                        </span>
                        <span className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                      </button>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Output area */}
                {optimizedPrompt && (
                  <ScrollReveal delay={200}>
                    <div className="rounded-xl border border-[var(--accent)]/30 bg-[#111] overflow-hidden">
                      <div className="flex justify-between items-center p-6 border-b border-[var(--dim)]">
                        <div>
                          <label className="text-sm text-[var(--accent)] uppercase tracking-wider font-medium block">Optimized Prompt</label>
                          <span className="text-xs text-[var(--muted)]">{STYLES.find(s => s.id === style)?.name} style</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleOptimize}
                            disabled={isOptimizing}
                            className="p-2 text-[var(--muted)] hover:text-[var(--fg)] transition-colors rounded-lg hover:bg-[var(--dim)]"
                            title="Regenerate"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isOptimizing ? 'animate-spin' : ''}>
                              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                              <path d="M3 3v5h5"/>
                              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                              <path d="M16 16h5v5"/>
                            </svg>
                          </button>
                          <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--bg)] border border-[var(--dim)] rounded-lg hover:border-[var(--accent)] transition-colors"
                          >
                            {copied ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Copied
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                </svg>
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <p className="text-lg leading-relaxed">{optimizedPrompt}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                )}
              </div>
            )}
          </div>
        </section>

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
      </main>
    </>
  );
}
