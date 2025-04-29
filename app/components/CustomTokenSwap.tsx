'use client';
import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  Transaction, 
  VersionedTransaction, 
  PublicKey 
} from '@solana/web3.js';
import { 
  getQuote, 
  executeSwap,
  SOL_MINT,
  USDC_MINT
} from '../services/jupiterService';
import { 
  TokenMetadata, 
  amountToRaw, 
  rawToUiAmount 
} from '../services/tokenService';
import CustomTokenInput from './CustomTokenInput';
import TokenBalanceDisplay from './TokenBalanceDisplay';
import { QuoteResponse } from '@jup-ag/api';

const CustomTokenSwap: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  
  // Token address states
  const [inputTokenAddress, setInputTokenAddress] = useState<string>(SOL_MINT);
  const [outputTokenAddress, setOutputTokenAddress] = useState<string>(USDC_MINT);
  const [inputTokenMetadata, setInputTokenMetadata] = useState<TokenMetadata | null>(null);
  const [outputTokenMetadata, setOutputTokenMetadata] = useState<TokenMetadata | null>(null);
  
  // Swap states
  const [inputAmount, setInputAmount] = useState<string>('');
  const [outputAmount, setOutputAmount] = useState<string>('');
  const [slippageBps, setSlippageBps] = useState<number>(50); // 0.5%
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isGettingQuote, setIsGettingQuote] = useState<boolean>(false);
  const [isExecutingSwap, setIsExecutingSwap] = useState<boolean>(false);
  const [swapStatus, setSwapStatus] = useState<string | null>(null);
  const [txid, setTxid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Handle input token change
  const handleInputTokenChange = (address: string, metadata: TokenMetadata | null) => {
    setInputTokenAddress(address);
    setInputTokenMetadata(metadata);
    // Clear quote if input token changes
    setQuote(null);
    setOutputAmount('');
  };
  
  // Handle output token change
  const handleOutputTokenChange = (address: string, metadata: TokenMetadata | null) => {
    setOutputTokenAddress(address);
    setOutputTokenMetadata(metadata);
    // Clear quote if output token changes
    setQuote(null);
    setOutputAmount('');
  };
  
  // Update quote when inputs change
  useEffect(() => {
    const getTokenQuote = async () => {
      if (
        !inputAmount || 
        !inputTokenAddress || 
        !outputTokenAddress || 
        !inputTokenMetadata || 
        !outputTokenMetadata ||
        parseFloat(inputAmount) <= 0
      ) {
        setQuote(null);
        setOutputAmount('');
        return;
      }
      
      try {
        setIsGettingQuote(true);
        setError(null);
        
        // Get quote from Jupiter
        const newQuote = await getQuote(
          connection,
          inputTokenAddress,
          outputTokenAddress,
          inputAmount,
          slippageBps
        );
        
        setQuote(newQuote);
        
        // Convert raw output amount to UI amount
        const formattedOutput = await rawToUiAmount(
          connection,
          outputTokenAddress,
          newQuote.outAmount
        );
        
        setOutputAmount(formattedOutput);
      } catch (error) {
        console.error('Error getting quote:', error);
        setError('Failed to get quote. Please check your inputs and try again.');
        setQuote(null);
        setOutputAmount('');
      } finally {
        setIsGettingQuote(false);
      }
    };
    
    // Use a debounce to avoid too many API calls
    const debounceTimeout = setTimeout(() => {
      getTokenQuote();
    }, 500);
    
    return () => clearTimeout(debounceTimeout);
  }, [
    inputAmount, 
    inputTokenAddress, 
    outputTokenAddress, 
    slippageBps, 
    connection,
    inputTokenMetadata,
    outputTokenMetadata
  ]);
  
  // Function to execute the swap
  const executeTokenSwap = async () => {
    if (
      !connected || 
      !publicKey || 
      !quote || 
      !signTransaction || 
      !inputTokenMetadata || 
      !outputTokenMetadata
    ) {
      setError('Please connect your wallet and get a quote first');
      return;
    }
    
    try {
      setIsExecutingSwap(true);
      setSwapStatus('preparing');
      setError(null);
      setTxid(null);
      
      // Execute the swap
      const result = await executeSwap(
        quote,
        publicKey.toString(),
        connection,
        signTransaction
      );
      
      setTxid(result.txid);
      setSwapStatus(result.status);
      
      if (result.status === 'confirmed') {
        // Clear input after successful swap
        setInputAmount('');
        setOutputAmount('');
        setQuote(null);
      } else if (result.status === 'failed') {
        setError('Swap failed. Please try again.');
      }
    } catch (error) {
      console.error('Swap execution error:', error);
      setError('Failed to execute swap. Please try again.');
      setSwapStatus('failed');
    } finally {
      setIsExecutingSwap(false);
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto bg-white shadow-lg rounded-xl p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Custom Token Swap</h2>
      
      {/* Input token section */}
      <div className="mb-6">
        <CustomTokenInput
          side="input"
          value={inputTokenAddress}
          onChange={handleInputTokenChange}
        />
        
        {inputTokenMetadata && inputTokenMetadata.isValid && publicKey && (
          <div className="mt-2">
            <TokenBalanceDisplay
              walletAddress={publicKey.toString()}
              tokenAddress={inputTokenAddress}
              symbol={inputTokenMetadata.symbol}
            />
          </div>
        )}
        
        {/* Input amount */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Input Amount
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              disabled={!inputTokenMetadata || !inputTokenMetadata.isValid}
              placeholder="0.0"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full p-3 sm:text-sm border-gray-300 rounded-md"
            />
            {inputTokenMetadata && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 sm:text-sm">
                  {inputTokenMetadata.symbol}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Swap direction indicator */}
      <div className="relative h-10 mb-6">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="border-t border-gray-300 w-full"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white px-3 py-1 rounded-full shadow border border-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Output token section */}
      <div className="mb-6">
        <CustomTokenInput
          side="output"
          value={outputTokenAddress}
          onChange={handleOutputTokenChange}
        />
        
        {outputTokenMetadata && outputTokenMetadata.isValid && publicKey && (
          <div className="mt-2">
            <TokenBalanceDisplay
              walletAddress={publicKey.toString()}
              tokenAddress={outputTokenAddress}
              symbol={outputTokenMetadata.symbol}
            />
          </div>
        )}
        
        {/* Output amount */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Output Amount (Estimated)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              value={outputAmount}
              readOnly
              placeholder="0.0"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full p-3 sm:text-sm border-gray-300 rounded-md bg-gray-50"
            />
            {outputTokenMetadata && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 sm:text-sm">
                  {outputTokenMetadata.symbol}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Slippage settings */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Slippage Tolerance
        </label>
        <select
          value={slippageBps}
          onChange={(e) => setSlippageBps(Number(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value={10}>0.1%</option>
          <option value={50}>0.5%</option>
          <option value={100}>1.0%</option>
          <option value={200}>2.0%</option>
          <option value={500}>5.0%</option>
        </select>
      </div>
      
      {/* Price info */}
      {quote && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Rate:</span>
            <span>
              1 {inputTokenMetadata?.symbol} ≈ {(Number(quote.outAmount) / Number(quote.inAmount)).toFixed(6)} {outputTokenMetadata?.symbol}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Price Impact:</span>
            <span className={Number(quote.priceImpactPct) > 5 ? 'text-red-500 font-bold' : ''}>
              {quote.priceImpactPct ? `${Number(quote.priceImpactPct).toFixed(2)}%` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Minimum Received:</span>
            <span>
              {outputAmount && `${(Number(outputAmount) * (1 - slippageBps / 10000)).toFixed(6)} ${outputTokenMetadata?.symbol}`}
            </span>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Transaction status */}
      {txid && (
        <div className={`border px-4 py-3 rounded mb-6 ${
          swapStatus === 'confirmed' ? 'bg-green-50 border-green-200 text-green-700' :
          swapStatus === 'failed' ? 'bg-red-50 border-red-200 text-red-700' :
          'bg-yellow-50 border-yellow-200 text-yellow-700'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {swapStatus === 'confirmed' ? 'Swap Successful' :
               swapStatus === 'failed' ? 'Swap Failed' :
               'Transaction Sent'}
            </span>
            <a 
              href={`https://solscan.io/tx/${txid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              View on Solscan
            </a>
          </div>
        </div>
      )}
      
      {/* Swap button */}
      <button
        onClick={executeTokenSwap}
        disabled={
          !connected ||
          !publicKey ||
          !quote ||
          isExecutingSwap ||
          isGettingQuote
        }
        className={`w-full py-3 px-4 rounded-md ${
          connected && quote && !isExecutingSwap && !isGettingQuote
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        } transition-colors duration-150 ease-in-out text-center font-medium focus:outline-none`}
      >
        {!connected
          ? 'Connect Wallet to Swap'
          : isExecutingSwap
          ? 'Swapping...'
          : isGettingQuote
          ? 'Getting Quote...'
          : !inputAmount
          ? 'Enter an Amount'
          : !quote
          ? 'Invalid Trade'
          : 'Swap'}
      </button>
      
      {/* Connection status */}
      {!connected && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Please connect your wallet to start swapping
        </p>
      )}
    </div>
  );
};

export default CustomTokenSwap; 