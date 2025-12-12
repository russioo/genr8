'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-4xl">
      <nav className="flex items-center justify-between px-6 py-3 bg-[#0a0a0a]/90 backdrop-blur-xl border border-[var(--dim)] rounded-full">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <span className="relative text-lg font-bold tracking-tight">
            GENR8
            <span className="absolute -top-0.5 -right-1.5 w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
          </span>
        </Link>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/#models', label: 'Models' },
            { href: '/docs', label: 'Docs' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
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
        <div className="flex items-center">
          <WalletMultiButton />
        </div>
      </nav>
    </header>
  );
}
