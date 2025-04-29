'use client';
import React, { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { getTokenBalance } from '../services/tokenService';
import { SOL_MINT } from '../services/jupiterService';

interface TokenBalanceDisplayProps {
  walletAddress: string | null;
  tokenAddress: string;
  symbol: string;
}

const TokenBalanceDisplay: React.FC<TokenBalanceDisplayProps> = ({
  walletAddress,
  tokenAddress,
  symbol
}) => {
  const { connection } = useConnection();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress || !tokenAddress) {
        setBalance('0');
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const tokenBalance = await getTokenBalance(
          connection,
          walletAddress,
          tokenAddress
        );
        
        setBalance(tokenBalance.uiAmount);
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setError('Failed to fetch balance');
        setBalance('0');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [connection, walletAddress, tokenAddress]);

  if (!walletAddress) {
    return null;
  }

  return (
    <div className="text-sm text-gray-600">
      {isLoading ? (
        <div className="flex items-center">
          <svg className="animate-spin h-3 w-3 mr-1.5 text-gray-500" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading balance...
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div>
          Balance: <span className="font-medium">{balance}</span> {symbol}
        </div>
      )}
    </div>
  );
};

export default TokenBalanceDisplay; 