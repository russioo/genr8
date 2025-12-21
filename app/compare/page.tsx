'use client';

import { useEffect, useState, useRef } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
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

// Pre-generated comparison data
const comparisons = [
  {
    id: 1,
    prompt: 'A futuristic city at sunset with flying cars and neon lights',
    images: {
      'gpt-4o': '/compare/city-gpt4o.png',
      'ideogram': '/compare/city-ideogram.png',
      'qwen': '/compare/city-qwen.png',
      'nano-banana': '/compare/city-nano.png',
    }
  },
  {
    id: 2,
    prompt: 'A cute cat wearing a tiny hat sitting on a velvet cushion',
    images: {
      'gpt-4o': '/compare/cat-gpt4o.png',
      'ideogram': '/compare/cat-ideogram.png',
      'qwen': '/compare/cat-qwen.png',
      'nano-banana': '/compare/cat-nano.png',
    }
  },
  {
    id: 3,
    prompt: 'Abstract colorful geometric shapes floating in space',
    images: {
      'gpt-4o': '/compare/abstract-gpt4o.png',
      'ideogram': '/compare/abstract-ideogram.png',
      'qwen': '/compare/abstract-qwen.png',
      'nano-banana': '/compare/abstract-nano.png',
    }
  },
  {
    id: 4,
    prompt: 'A photorealistic portrait of a robot with human emotions',
    images: {
      'gpt-4o': '/compare/robot-gpt4o.png',
      'ideogram': '/compare/robot-ideogram.png',
      'qwen': '/compare/robot-qwen.png',
      'nano-banana': '/compare/robot-nano.png',
    }
  },
];

const models = [
  { id: 'gpt-4o', name: 'GPT-4o Image', provider: 'OpenAI', price: '$0.04' },
  { id: 'ideogram', name: 'Ideogram V3', provider: 'Ideogram', price: '$0.07' },
  { id: 'qwen', name: 'Qwen', provider: 'Alibaba', price: '$0.03' },
  { id: 'nano-banana', name: 'Nano Banana Pro', provider: 'Nano', price: '$0.30' },
];

export default function ComparePage() {
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);

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

    return () => {
      lenis.destroy();
    };
  }, []);

  const handleImageError = (modelId: string) => {
    setImageErrors(prev => ({ ...prev, [`${selectedPrompt}-${modelId}`]: true }));
  };

  const currentComparison = comparisons[selectedPrompt];

  return (
    <>
      <Header />
      <main className="min-h-screen overflow-hidden">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="text-xs text-[var(--accent)] tracking-[0.15em] uppercase mb-6 block font-medium">Compare Models</span>
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-8 tracking-tight">
                Same Prompt,<br />
                <span className="text-[var(--accent)]">Different Results.</span>
              </h1>
              <p className="text-lg text-[var(--muted)] max-w-2xl leading-relaxed">
                See how each AI model interprets the same prompt. Find the perfect match for your creative vision.
              </p>
            </div>
          </div>
        </section>

        {/* Prompt Selector - Tabs style */}
        <section className="px-4 md:px-8 mb-12">
          <div className="max-w-[1400px] mx-auto">
            <ScrollReveal>
              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-[var(--dim)] overflow-x-auto">
                {comparisons.map((comparison, index) => (
                  <button
                    key={comparison.id}
                    onClick={() => setSelectedPrompt(index)}
                    className={`relative px-6 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedPrompt === index
                        ? 'text-[var(--fg)]'
                        : 'text-[var(--muted)] hover:text-[var(--fg)]'
                    }`}
                  >
                    <span>Prompt {index + 1}</span>
                    {selectedPrompt === index && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Current prompt display */}
              <div className="mt-8 pb-2">
                <p className="text-lg md:text-xl text-[var(--fg)] leading-relaxed font-light">
                  "{currentComparison.prompt}"
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Comparison Grid */}
        <section className="px-4 md:px-8 mb-20">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {models.map((model) => {
                const imageKey = `${selectedPrompt}-${model.id}`;
                const hasError = imageErrors[imageKey];
                
                return (
                  <div 
                    key={model.id}
                    className="group relative"
                  >
                    {/* Image Card */}
                    <div className="relative aspect-square overflow-hidden rounded-lg border border-[var(--dim)] bg-[#0a0a0a] mb-4 transition-all duration-300 group-hover:border-[var(--accent)]/50">
                      {hasError ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
                          <div className="text-center">
                            <div className="w-10 h-10 mx-auto mb-3 border border-[var(--dim)] rounded-lg flex items-center justify-center opacity-50">
                              <svg className="w-5 h-5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-xs text-[var(--muted)]">Coming soon</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <img
                            src={currentComparison.images[model.id as keyof typeof currentComparison.images]}
                            alt={`${model.name} - ${currentComparison.prompt}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                            onError={() => handleImageError(model.id)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </>
                      )}
                    </div>

                    {/* Model Info */}
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors duration-200 truncate">
                            {model.name}
                          </h3>
                          <p className="text-xs text-[var(--muted)] mt-0.5">{model.provider}</p>
                        </div>
                        <span className="text-base font-semibold text-[var(--accent)] flex-shrink-0">
                          {model.price}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto text-center">
            <ScrollReveal>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
                Ready to <span className="text-[var(--accent)]">generate?</span>
              </h2>
              <p className="text-[var(--muted)] mb-10 max-w-md mx-auto text-base leading-relaxed">
                Try these models yourself. No subscriptions, just pay per generation.
              </p>
              <Link
                href="/dashboard"
                className="group/btn relative inline-flex items-center gap-3 px-8 py-4 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative z-10">Start Generating</span>
                <span className="relative z-10 transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              </Link>
            </ScrollReveal>
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
              <a href="https://x.com/GENR8APP" target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--fg)] transition-colors text-sm md:text-base">
                Twitter
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
