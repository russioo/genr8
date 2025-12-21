'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ChevronDown } from 'lucide-react';

const mainLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/stats', label: 'Stats' },
  { href: '/docs', label: 'Docs' },
  { href: '/roadmap', label: 'Roadmap' },
];

const toolsLinks = [
  { href: '/compare', label: 'Compare Models' },
  { href: '/promptoptimizer', label: 'Prompt Optimizer' },
  { href: '/demo', label: 'Demo' },
];

export default function Header() {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if current page is in tools dropdown
  const isToolsActive = toolsLinks.some(link => pathname === link.href);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-6 left-[1.5rem] right-[1.5rem] z-50 max-w-4xl mx-auto" style={{ transform: 'translateZ(0)', willChange: 'transform', backfaceVisibility: 'hidden' }}>
      <nav className="flex items-center justify-between px-4 py-2.5 bg-[#0a0a0a]/80 backdrop-blur-2xl rounded-full shadow-2xl shadow-black/50" style={{ border: '0.5px solid var(--dim)' }}>
        {/* Logo */}
        <Link href="/" className="group flex items-center justify-center gap-2">
          <span className="relative text-lg font-bold tracking-tight">
            GENR8
            <span className="absolute -top-0.5 -right-1.5 w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
          </span>
        </Link>

        {/* Navigation */}
        <div className="hidden md:flex items-center justify-center gap-4 flex-1">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors ${
              pathname === '/dashboard' 
                ? 'text-[var(--fg)]' 
                : 'text-[var(--muted)] hover:text-[var(--fg)]'
            }`}
          >
            Dashboard
          </Link>

          {/* Tools Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                isToolsActive 
                  ? 'text-[var(--fg)]' 
                  : 'text-[var(--muted)] hover:text-[var(--fg)]'
              }`}
            >
              Tools
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 py-2 bg-[#0a0a0a] border border-[var(--dim)] rounded-xl shadow-xl shadow-black/50 transition-all duration-200 ${
              toolsOpen 
                ? 'opacity-100 visible translate-y-0' 
                : 'opacity-0 invisible -translate-y-2'
            }`}>
              {toolsLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setToolsOpen(false)}
                  className={`block px-4 py-2.5 text-sm transition-colors ${
                    pathname === link.href 
                      ? 'text-[var(--accent)] bg-[var(--accent)]/5' 
                      : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Docs */}
          <Link
            href="/docs"
            className={`text-sm font-medium transition-colors ${
              pathname === '/docs' 
                ? 'text-[var(--fg)]' 
                : 'text-[var(--muted)] hover:text-[var(--fg)]'
            }`}
          >
            Docs
          </Link>

          {/* Roadmap */}
          <Link
            href="/roadmap"
            className={`text-sm font-medium transition-colors ${
              pathname === '/roadmap' 
                ? 'text-[var(--fg)]' 
                : 'text-[var(--muted)] hover:text-[var(--fg)]'
            }`}
          >
            Roadmap
          </Link>
        </div>

        {/* Wallet */}
        <div className="flex items-center justify-center">
          <WalletMultiButton />
        </div>
      </nav>
    </header>
  );
}
