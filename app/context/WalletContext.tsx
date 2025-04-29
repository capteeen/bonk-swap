import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

interface WalletContextType {
  wallet: any | null;
  publicKey: string | null;
  balance: number | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  fetchBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const solanaWallet = useSolanaWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const fetchBalance = async () => {
    if (!solanaWallet.publicKey) {
      console.log("WalletContext: fetchBalance - no publicKey available");
      setBalance(null);
      return;
    }
    try {
      console.log("WalletContext: fetchBalance - getting balance for", solanaWallet.publicKey.toString());
      const balance = await connection.getBalance(solanaWallet.publicKey);
      console.log("WalletContext: fetchBalance - balance received", balance / LAMPORTS_PER_SOL);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setBalance(null);
    }
  };

  useEffect(() => {
    if (solanaWallet.publicKey) {
      console.log("WalletContext: publicKey changed - updating", solanaWallet.publicKey.toString());
      setPublicKey(solanaWallet.publicKey.toString());
      fetchBalance();
    } else {
      console.log("WalletContext: publicKey changed - now null");
      setPublicKey(null);
      setBalance(null);
    }
  }, [solanaWallet.publicKey]);

  useEffect(() => {
    console.log("WalletContext: connected status changed", solanaWallet.connected);
  }, [solanaWallet.connected]);

  const connect = async () => {
    try {
      console.log("WalletContext: Connection attempt started");
      console.log("WalletContext: solanaWallet state", {
        connected: solanaWallet?.connected,
        publicKey: solanaWallet?.publicKey?.toString(),
        connecting: solanaWallet?.connecting,
        hasConnect: typeof solanaWallet?.connect === 'function'
      });
      
      setVisible(true);
      console.log("WalletContext: Modal visibility set to true");
      
      if (solanaWallet && typeof solanaWallet.connect === 'function') {
        console.log("WalletContext: Calling solanaWallet.connect()");
        await solanaWallet.connect();
        console.log("WalletContext: solanaWallet.connect() completed");
      } else {
        console.log("WalletContext: solanaWallet.connect is not a function");
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      throw err;
    }
  };

  const disconnect = async () => {
    try {
      await solanaWallet.disconnect();
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
      throw err;
    }
  };

  const value = useMemo(() => ({
    wallet: solanaWallet,
    publicKey,
    balance,
    connect,
    disconnect,
    fetchBalance
  }), [solanaWallet, publicKey, balance]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
} 