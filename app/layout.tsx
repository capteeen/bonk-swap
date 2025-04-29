'use client';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { WalletProvider } from './context/WalletContext';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { useMemo } from 'react';

const inter = Inter({ subsets: ['latin'] });

const SOLANA_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new CoinbaseWalletAdapter()
  ], []);

  return (
    <html lang="en">
      <head>
        <title>BONKSWAP - Swap Solana Tokens Fast and Easy</title>
        <meta name="description" content="BONKSWAP is a fast, secure, and easy-to-use DEX for swapping Solana tokens with low fees and high liquidity." />
        <link rel="apple-touch-icon" href="/bonkswap-logo.png" />
      </head>
      <body className={inter.className}>
        <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
          <SolanaWalletProvider 
            wallets={wallets} 
            onError={(error) => {
              console.error('Wallet error:', error);
            }}
          >
            <WalletModalProvider>
              <WalletProvider>
                {children}
              </WalletProvider>
            </WalletModalProvider>
          </SolanaWalletProvider>
        </ConnectionProvider>
      </body>
    </html>
  );
}
