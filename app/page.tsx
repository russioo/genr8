'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Lenis from 'lenis';

// Scroll reveal hook
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// Scroll reveal wrapper component
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

// FAQ Item component with accordion
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={`group bg-[#111] border rounded-xl overflow-hidden transition-all duration-300 ${
      isOpen ? 'border-[var(--accent)] shadow-lg shadow-[var(--accent)]/10' : 'border-[var(--dim)] hover:border-[var(--accent)]'
    }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 md:p-6 text-left transition-all duration-300 ${
          isOpen ? 'bg-[#1a1a1a]' : 'hover:bg-[#1a1a1a]'
        }`}
      >
        <span className={`text-base md:text-lg font-semibold pr-4 transition-colors duration-300 ${
          isOpen ? 'text-[var(--accent)]' : 'group-hover:text-[var(--accent)]'
        }`}>
          {question}
        </span>
        <span className={`text-[var(--accent)] text-2xl font-light transition-transform duration-300 flex-shrink-0 ${
          isOpen ? 'rotate-45' : ''
        }`}>
          +
        </span>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 md:px-6 pb-5 md:pb-6 pt-2 border-t border-[var(--dim)]">
          <p className="text-[var(--muted)] leading-relaxed text-sm md:text-base pt-3">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

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
        <span key={i} className="inline-block transition-all duration-300 hover:text-[var(--accent)] hover:-translate-y-1">{char === ' ' ? '\u00A0' : char}</span>
      ))}
    </span>
  );
}

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    // Initialize smooth scroll
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

  const models = [
    { name: 'GPT-Image', type: 'Image', price: '0.04' },
    { name: 'Ideogram V3', type: 'Image', price: '0.07' },
    { name: 'Qwen', type: 'Image', price: '0.03' },
    { name: 'Sora 2', type: 'Video', price: '0.21' },
    { name: 'Veo 3.1', type: 'Video', price: '0.36' },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen overflow-hidden">
        {/* Hero */}
        <section className="pt-28 pb-8 px-4 md:px-8">
          <div className="max-w-[1800px] mx-auto">
            {/* Hero container with background */}
            <div 
              className="group relative rounded-xl overflow-hidden border border-[var(--dim)] transition-all duration-700 ease-out hover:border-[var(--dim)]/80"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* Background image */}
              <img 
                src="/herobackgroundsection.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.02] blur-[2px]"
              />
              
              {/* Content */}
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 p-5 md:p-12 lg:p-16 min-h-[auto] lg:min-h-[500px]">
                {/* Left - Text content */}
                <div className={`flex flex-col justify-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 md:mb-6">
                    <span className="text-[var(--accent)] inline-flex overflow-hidden">
                      <span className="inline-block">&gt;&nbsp;</span>
                      {'The AI Generation'.split('').map((char, i) => (
                        <span 
                          key={i} 
                          className="inline-block animate-slide-up-letter hover:text-white hover:-translate-y-1 hover:scale-110 transition-all duration-200 cursor-default"
                          style={{ animationDelay: `${i * 0.03}s` }}
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                      ))}
                    </span>
                    <br />
                    <span className="text-[var(--fg)] inline-flex overflow-hidden">
                      {'for Creators.'.split('').map((char, i) => (
                        <span 
                          key={i} 
                          className="inline-block animate-slide-up-letter hover:text-[var(--accent)] hover:-translate-y-1 hover:scale-110 transition-all duration-200 cursor-default"
                          style={{ animationDelay: `${0.5 + i * 0.03}s` }}
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                      ))}
                    </span>
                  </h1>
                  
                  <p className="text-sm md:text-base text-[var(--muted)] leading-relaxed max-w-md mb-6 md:mb-8">
                    Access the best AI models without subscriptions. Pay only for what you create with $GENR8 tokens on Solana.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/dashboard"
                      className="group/btn relative inline-flex items-center justify-center gap-2 px-5 md:px-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-xl overflow-hidden text-sm md:text-base"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Start Generating
                        <span>→</span>
                      </span>
                      <span className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                    </Link>
                    <Link
                      href="/docs"
                      className="group/btn relative inline-flex items-center justify-center px-5 md:px-6 py-3 bg-[var(--bg)] text-[var(--fg)] font-medium rounded-xl border border-[var(--dim)] overflow-hidden text-sm md:text-base"
                    >
                      <span className="relative z-10 transition-colors duration-300 group-hover/btn:text-[var(--bg)]">Read docs</span>
                      <span className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                    </Link>
                  </div>
                </div>

                {/* Right - Video */}
                <div className={`flex items-center justify-center transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <div className="relative w-full max-w-lg rounded-xl overflow-hidden border border-[var(--dim)]">
                    <video 
                      id="hero-video"
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={(e) => {
                        const video = e.currentTarget;
                        if (video.paused) {
                          video.play();
                          setIsPaused(false);
                        } else {
                          video.pause();
                          setIsPaused(true);
                        }
                      }}
                    >
                      <source src="/hero-video.mp4" type="video/mp4" />
                    </video>
                    {isPaused && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-[var(--bg)]/80 backdrop-blur-sm flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        const video = document.getElementById('hero-video') as HTMLVideoElement;
                        if (video) {
                          video.muted = !video.muted;
                          setIsMuted(video.muted);
                        }
                      }}
                      className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[var(--bg)]/80 backdrop-blur-sm border border-[var(--dim)] flex items-center justify-center text-[var(--fg)] hover:bg-[var(--bg)] transition-all"
                    >
                      {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <line x1="23" y1="9" x2="17" y2="15"></line>
                          <line x1="17" y1="9" x2="23" y2="15"></line>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-10 md:py-16 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto">
            <ScrollReveal>
              <div className="mb-8 md:mb-12">
                <span className="text-xs text-[var(--accent)] tracking-widest uppercase">Process</span>
                <h2 className="text-3xl md:text-5xl font-bold mt-2">How it works</h2>
                <p className="text-[var(--muted)] mt-2 md:mt-3 text-sm md:text-base">Get started in three simple steps</p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {[
                { num: '1', title: 'Connect', desc: 'Link your Solana wallet. Phantom, Solflare, or any compatible wallet works.', pos: 'left' },
                { num: '2', title: 'Generate', desc: 'Choose a model, enter your prompt. Pay per generation with $GENR8 or USDC.', pos: 'center' },
                { num: '3', title: 'Download', desc: 'Get your content instantly. No watermarks, full ownership, no strings.', pos: 'right' },
              ].map((step, i) => (
                <div 
                  key={i} 
                  className="group relative rounded-xl overflow-hidden border border-[var(--dim)] hover:border-[var(--muted)] transition-all duration-500"
                >
                  {/* Background image - same image, different positions */}
                  <div 
                    className="absolute inset-0 transition-all duration-700 group-hover:scale-105 blur-[2px]"
                    style={{
                      backgroundImage: 'url(/ea60f6895611494c03045877c3b5683c_1765024581.png)',
                      backgroundSize: '300% 100%',
                      backgroundPosition: step.pos,
                    }}
                  />
                  {/* Dark overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/50 to-[var(--bg)]/20" />
                  
                  {/* Content */}
                  <div className="relative z-10 p-6 md:p-8 min-h-[240px] md:min-h-[340px] flex flex-col">
                    <span className="text-5xl md:text-6xl font-bold text-[var(--accent)] mb-auto">
                      {step.num}
                    </span>
                    <div>
                      <h3 className="text-xl md:text-2xl font-semibold mb-2 md:mb-3">{step.title}</h3>
                      <p className="text-white/60 leading-relaxed text-sm">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Features */}
        <section className="py-10 md:py-16 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto">
            <ScrollReveal>
              <div className="mb-8 md:mb-12">
                <span className="text-xs text-[var(--accent)] tracking-widest uppercase">Features</span>
                <h2 className="text-3xl md:text-5xl font-bold mt-2">Why GENR8</h2>
                <p className="text-[var(--muted)] mt-2 md:mt-3 text-sm md:text-base">Built for creators who value simplicity</p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {[
                { title: 'No Subscriptions', desc: 'Pay only for what you generate. No monthly fees, no unused credits.', pos: 'right' },
                { title: 'Instant Delivery', desc: 'Your content is generated and delivered within seconds.', pos: 'center' },
                { title: 'Full Ownership', desc: 'Everything you generate belongs to you. Commercial use included.', pos: 'left' },
              ].map((feature, i) => (
                <div 
                  key={i} 
                  className="group relative rounded-xl overflow-hidden border border-[var(--dim)] hover:border-[var(--muted)] transition-all duration-500"
                >
                  {/* Flip wrapper */}
                  <div className="absolute inset-0" style={{ transform: 'scaleX(-1)' }}>
                    {/* Background image - same image, different positions */}
                    <div 
                      className="absolute inset-0 transition-all duration-700 group-hover:scale-105 blur-[2px]"
                      style={{
                        backgroundImage: 'url(/1765030347698-wrnpvaau0ej.png)',
                        backgroundSize: '300% 100%',
                        backgroundPosition: feature.pos,
                      }}
                    />
                  </div>
                  {/* Dark overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/50 to-[var(--bg)]/20" />
                  
                  {/* Content */}
                  <div className="relative z-10 p-6 md:p-8 min-h-[200px] md:min-h-[340px] flex flex-col justify-end">
                    <div>
                      <h3 className="text-xl md:text-2xl font-semibold mb-2 md:mb-3">{feature.title}</h3>
                      <p className="text-white/60 leading-relaxed text-sm">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-10 md:py-20 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto">
            <ScrollReveal>
              <div className="mb-8 md:mb-12">
                <span className="text-xs text-[var(--accent)] tracking-widest uppercase">FAQ</span>
                <h2 className="text-3xl md:text-5xl font-bold mt-2">Frequently Asked Questions</h2>
                <p className="text-[var(--muted)] mt-2 md:mt-3 text-sm md:text-base">Everything you need to know about GENR8</p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {[
                {
                  question: 'Do I pay a subscription fee?',
                  answer: 'No, there are no subscription fees. You only pay for what you generate. Each generation is charged individually based on the model you choose. No monthly fees, no unused credits.'
                },
                {
                  question: 'How do I pay for generations?',
                  answer: 'Pay per generation using $GENR8 tokens or USDC on Solana. Simply connect your wallet and the payment is processed automatically when you generate content.'
                },
                {
                  question: 'Which wallets can I use?',
                  answer: 'Any Solana-compatible wallet works, including Phantom, Solflare, Backpack, and more. Just connect your wallet to get started - no account creation needed.'
                },
                {
                  question: 'What AI models are available?',
                  answer: 'We offer GPT-4o Image, Ideogram V3, and Qwen for images, plus Sora 2 and Veo 3.1 for videos. All models are accessible through one simple interface.'
                },
                {
                  question: 'Do I own the generated content?',
                  answer: 'Yes, you have full commercial rights to everything you generate. No watermarks, no restrictions. Use it for your business, products, marketing, or any purpose.'
                },
                {
                  question: 'How fast are generations?',
                  answer: 'Image generations typically complete in 2-10 seconds. Video generation takes longer depending on the model, usually 30-120 seconds. You\'ll see real-time progress updates.'
                }
              ].map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-10 md:py-20 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto">
            <ScrollReveal>
              <div className="group relative rounded-xl overflow-hidden border border-[var(--dim)] hover:border-[var(--muted)] transition-all duration-500 min-h-[300px] md:min-h-[400px] flex items-center">
                {/* Background image */}
                <div 
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-105 blur-[2px]"
                  style={{
                    backgroundImage: 'url(/1765030583940-2jekhrzwcle.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/90 md:via-[var(--bg)]/80 to-[var(--bg)]/50 md:to-transparent" />
                
                {/* Content */}
                <div className="relative z-10 p-6 md:p-12 lg:p-16 max-w-2xl">
                  <span className="text-xs text-[var(--accent)] tracking-widest uppercase mb-3 md:mb-4 block">Start Now</span>
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
                    <span className="text-[var(--fg)] inline-flex flex-wrap">
                      {'Ready to'.split('').map((char, i) => (
                        <span 
                          key={i} 
                          className="inline-block hover:text-[var(--accent)] hover:-translate-y-1 hover:scale-110 transition-all duration-200 cursor-default"
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                      ))}
                    </span>
                    <br />
                    <span className="text-[var(--accent)] inline-flex">
                      {'Generate?'.split('').map((char, i) => (
                        <span 
                          key={i} 
                          className="inline-block hover:text-white hover:-translate-y-1 hover:scale-110 transition-all duration-200 cursor-default"
                        >
                          {char}
                        </span>
                      ))}
                    </span>
                  </h2>
                  <p className="text-[var(--muted)] text-sm md:text-lg mb-6 md:mb-10 max-w-md">
                    No subscriptions. No commitments. Connect your wallet and start creating.
                  </p>
                  <Link
                    href="/dashboard"
                    className="group/btn inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded-xl overflow-hidden relative text-sm md:text-base"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Launch App
                      <span className="transition-transform group-hover/btn:translate-x-1">→</span>
                    </span>
                    <span className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Bottom section wrapper */}
        <div className="relative">
          {/* Footer */}
          <footer className="py-10 md:py-16 px-4 md:px-12 lg:px-24 relative z-10">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
              <div className="flex items-center gap-4 md:gap-8">
                <span className="text-lg md:text-xl font-bold">GENR8</span>
                <span className="text-xs md:text-sm text-[var(--muted)]">© 2026</span>
              </div>
              <div className="flex gap-6 md:gap-8">
                <a href="https://x.com/paypergenr8" target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--fg)] transition-colors text-sm md:text-base">
                  Twitter
                </a>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
