'use client';

import { FC, ReactNode, useMemo, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletError } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

// Import default styles
require('@solana/wallet-adapter-react-ui/styles.css');

interface Props {
  children: ReactNode;
}

export const SolanaWalletProvider: FC<Props> = ({ children }) => {
  const endpoint = useMemo(() => 
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
    clusterApiUrl('mainnet-beta'), 
  []);
  
  // Phantom and Solflare auto-register via wallet-standard
  // Only include wallets that don't support wallet-standard
  const wallets = useMemo(() => [
    new CoinbaseWalletAdapter(),
  ], []);

  const onError = useCallback((error: WalletError) => {
    // Silently ignore common connection errors
    if (error.name === 'WalletNotReadyError' || 
        error.name === 'WalletConnectionError' ||
        error.message?.includes('Unexpected error')) {
      return;
    }
    console.error('Wallet error:', error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

