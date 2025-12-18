'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Header() {
  const pathname = usePathname();

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
          {[
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/promptoptimizer', label: 'Prompt Optimizer' },
            { href: '/demo', label: 'Demo' },
            { href: '/docs', label: 'Docs' },
            { href: '/roadmap', label: 'Roadmap' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors flex items-center ${
                pathname === link.href 
                  ? 'text-[var(--fg)]' 
                  : 'text-[var(--muted)] hover:text-[var(--fg)]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Wallet */}
        <div className="flex items-center justify-center">
          <WalletMultiButton />
        </div>
      </nav>
    </header>
  );
}
