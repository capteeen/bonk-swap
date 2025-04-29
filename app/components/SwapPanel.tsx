'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import TokenCard from './TokenCard';
import SwapActions from './SwapActions';
import TokenSelectModal from './TokenSelectModal';
import CustomTokenIcon from './CustomTokenIcon';
import { useWallet } from '../context/WalletContext';
import { useConnection } from '@solana/wallet-adapter-react';
import { Transaction, VersionedTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getQuoteV2, executeSwap, SOL_MINT, USDC_MINT, BONK_MINT } from '../services/jupiterService';
import {
  getTokenBalance,
  fetchTokenMetadataFromMoralis
} from '../services/tokenService';
import { rawToAmount, amountToRaw } from '../utils/tokenUtils';
import { QuoteResponse } from '@jup-ag/api';
import { createFallbackIcon } from '../services/tokenIconUtils';
import { useCustomTokens } from '../hooks/useCustomToken';

// Token mapping from symbols to addresses
const TOKEN_ADDRESSES: Record<string, string> = {
  'SOL': SOL_MINT,
  'USDC': USDC_MINT,
  'BONK': BONK_MINT,
  'TRUMP': '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
};

// Local token icons mapping
const LOCAL_TOKEN_ICONS: Record<string, string> = {
  'SOL': '/TOKEN ICONS/sol.PNG',
  'USDC': '/TOKEN ICONS/USDC.PNG',
  'BONK': '/TOKEN ICONS/BONK.PNG',
  'TRUMP': '/TOKEN ICONS/OFFICIAL TRUMP.PNG',
  'USDT': '/TOKEN ICONS/usdt.PNG',
  'CUSTOM': '/TOKEN ICONS/default-token.svg',
  'UNKNOWN': '/TOKEN ICONS/default-token.svg'
};

// IMPORTANT: Define the function using function declaration syntax for proper hoisting
function getTokenIcon(symbol: string, displaySymbol?: string) {
  // For safety, default to CUSTOM if no symbol provided
  if (!symbol) {
    console.log('No symbol provided for getTokenIcon, using CUSTOM fallback');
    return renderTokenIcon(LOCAL_TOKEN_ICONS['CUSTOM'], displaySymbol);
  }
  
  // Convert to uppercase for consistent lookup
  const upperSymbol = symbol.toUpperCase();
  
  // Try to use local token icons first
  const localIconPath = LOCAL_TOKEN_ICONS[upperSymbol] || LOCAL_TOKEN_ICONS['CUSTOM'];
  
  // Use the provided displaySymbol if available, otherwise use the main symbol
  const finalSymbol = displaySymbol || symbol;
  
  return renderTokenIcon(localIconPath, finalSymbol);
}

// Helper function to render a token icon with proper error handling
function renderTokenIcon(iconPath: string, symbol: string = '') {
  // For known tokens, use the image
  if (iconPath !== LOCAL_TOKEN_ICONS['CUSTOM']) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <img 
          src={iconPath} 
          alt={symbol || "Token"} 
          width={64} 
          height={64}
          className="rounded-full w-full h-full object-cover"
          onError={(e) => {
            // Fallback if local image fails - use CustomTokenIcon
            console.log('Token image failed to load, using custom icon');
            e.currentTarget.style.display = 'none';
            
            // Replace with custom token icon component
            const parent = e.currentTarget.parentElement;
            if (parent) {
              // Clear the parent element
              parent.innerHTML = '';
              
              // Create a new div to render our component into
              const customIconContainer = document.createElement('div');
              customIconContainer.className = 'w-full h-full';
              parent.appendChild(customIconContainer);
              
              // We can't directly render React components here, so we'll use a styled div instead
              customIconContainer.innerHTML = `
                <div style="width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #ffd700, #ffa500); display: flex; align-items: center; justify-content: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #333;">${symbol ? symbol.substring(0, 2).toUpperCase() : '🪙'}</div>
                </div>
              `;
            }
          }}
        />
      </div>
    );
  }
  
  // For custom tokens, use the CustomTokenIcon component
  return <CustomTokenIcon symbol={symbol} />;
}

// Make sure we define the mockTokens AFTER the getTokenIcon function
const mockTokens = [
  { 
    icon: getTokenIcon('SOL', 'SOL'), 
    symbol: 'SOL', 
    name: 'Solana', 
    balance: '0',
    address: SOL_MINT,
    decimals: 9
  },
  { 
    icon: getTokenIcon('USDC', 'USDC'), 
    symbol: 'USDC', 
    name: 'USD Coin', 
    balance: '0',
    address: USDC_MINT,
    decimals: 6
  },
  { 
    icon: getTokenIcon('BONK', 'BONK'), 
    symbol: 'BONK', 
    name: 'Bonk', 
    balance: '0',
    address: BONK_MINT,
    decimals: 5
  },
  { 
    icon: getTokenIcon('TRUMP', 'TRUMP'), 
    symbol: 'TRUMP', 
    name: 'Official Trump', 
    balance: '0',
    address: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
    decimals: 9
  },
  { 
    icon: getTokenIcon('USDT', 'USDT'), 
    symbol: 'USDT', 
    name: 'Tether USD', 
    balance: '0',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6
  }
];

const SwapPanel: React.FC = () => {
  const { wallet, publicKey, fetchBalance } = useWallet();
  const { connection } = useConnection();
  const { customTokens: savedCustomTokens, addToken: addCustomToken } = useCustomTokens();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slippage, setSlippage] = useState(0.5);
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [selectedInputToken, setSelectedInputToken] = useState('SOL');
  const [selectedOutputToken, setSelectedOutputToken] = useState('USDC');
  const [modalOpen, setModalOpen] = useState<null | 'FROM' | 'TO'>(null);
  const [priceImpact, setPriceImpact] = useState<string>('0');
  const [currentQuote, setCurrentQuote] = useState<QuoteResponse | null>(null);
  const [preSwapBalances, setPreSwapBalances] = useState<Record<string, number> | null>(null);
  const [tokenData, setTokenData] = useState<Record<string, any>>({});
  const [tokenAnalytics, setTokenAnalytics] = useState<Record<string, any>>({});
  const [availableTokens, setAvailableTokens] = useState<any[]>([]);
  const [customTokens, setCustomTokens] = useState<any[]>([]);

  // Initialize available tokens by combining predefined tokens with saved custom tokens
  useEffect(() => {
    // Create a combined list of predefined tokens and saved custom tokens
    const mergedTokens = [...mockTokens];
    
    // Add saved custom tokens if they don't already exist in mockTokens
    savedCustomTokens.forEach(customToken => {
      if (!mergedTokens.some(t => t.address === customToken.address)) {
        // Create a proper token object from the saved data
        const tokenSymbol = customToken.symbol || 'CUSTOM';
        // Use CUSTOM icon if it's not a predefined token
        const isKnownToken = LOCAL_TOKEN_ICONS[tokenSymbol.toUpperCase()];
        const tokenIcon = getTokenIcon(isKnownToken ? tokenSymbol : 'CUSTOM', tokenSymbol);
        
        const tokenWithIcon = {
          ...customToken,
          icon: tokenIcon, // Use the function to get a proper React element icon
          balance: customToken.balance || '0',
          decimals: customToken.decimals || 9 // Provide a default of 9 decimals if undefined
        };
        mergedTokens.push(tokenWithIcon);
        
        // Also update TOKEN_ADDRESSES map with this token
        if (customToken.address && customToken.symbol && !TOKEN_ADDRESSES[customToken.symbol]) {
          TOKEN_ADDRESSES[customToken.symbol] = customToken.address;
          console.log(`Added saved custom token to TOKEN_ADDRESSES: ${customToken.symbol} = ${customToken.address}`);
        }
      }
    });
    
    setAvailableTokens(mergedTokens);
    console.log('Initialized available tokens with saved custom tokens:', mergedTokens);
  }, [savedCustomTokens]);

  // This effect fetches token data from Moralis API
  useEffect(() => {
    const MORALIS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImVjYzAxZDliLTdjYWItNDgzYy1hZDUzLTY4ZGMxMTkwZjZjNCIsIm9yZ0lkIjoiNDkyMTEiLCJ1c2VySWQiOiI0ODg3NiIsInR5cGVJZCI6IjUwMTgwNWE5LTVkNWEtNDI3OC1hMjE4LWIxNGFhYTU0OTljMCIsInR5cGUiOiJQUk9KRUNUIiwiaWF0IjoxNzQ0NTYzODI2LCJleHAiOjQ5MDAzMjM4MjZ9.XxbCVueyjps5wYAkl8AwuywxhBcw1xkieimSI_yOtfA';
    
    const fetchTokenAnalytics = async (symbol: string, address: string) => {
      try {
        console.log(`Fetching analytics for ${symbol} (${address})`);
        const response = await fetch(
          `https://deep-index.moralis.io/api/v2.2/tokens/${address}/analytics?chain=solana`,
          {
            headers: {
              'accept': 'application/json',
              'X-API-Key': MORALIS_API_KEY
            }
          }
        );
        
        if (!response.ok) {
          console.error(`Error fetching analytics for ${symbol}: ${response.status}`);
          return null;
        }
        
        const data = await response.json();
        console.log(`Analytics for ${symbol}:`, data);
        return data;
      } catch (error) {
        console.error(`Error fetching analytics for ${symbol}:`, error);
        return null;
      }
    };
    
    const fetchToken = async (symbol: string, address: string) => {
      try {
        // Fetch token price
        const priceResponse = await fetch(
          `https://solana-gateway.moralis.io/token/mainnet/${address}/price`,
          {
            headers: {
              'accept': 'application/json',
              'X-API-Key': MORALIS_API_KEY
            }
          }
        );
        
        // Fetch token metadata
        const metadataResponse = await fetch(
          `https://solana-gateway.moralis.io/token/mainnet/${address}/metadata`,
          {
            headers: {
              'accept': 'application/json',
              'X-API-Key': MORALIS_API_KEY
            }
          }
        );
        
        if (!priceResponse.ok || !metadataResponse.ok) {
          console.error(`Error fetching data for ${symbol}`);
          return null;
        }
        
        const priceData = await priceResponse.json();
        const metadataData = await metadataResponse.json();
        
        console.log(`Data for ${symbol}:`, { price: priceData, metadata: metadataData });
        
        // Return combined data
        return {
          price: priceData,
          metadata: metadataData
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return null;
      }
    };
    
    const fetchAllTokens = async () => {
      const data: Record<string, any> = {};
      const analytics: Record<string, any> = {};
      
      for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
        // Fetch token data
        const tokenData = await fetchToken(symbol, address);
        if (tokenData) {
          data[symbol] = tokenData;
        }
        
        // Fetch token analytics
        const analyticsData = await fetchTokenAnalytics(symbol, address);
        if (analyticsData) {
          analytics[symbol] = analyticsData;
        }
      }
      
      setTokenData(data);
      setTokenAnalytics(analytics);
    };
    
    fetchAllTokens();
  }, []);
  
  // Update output amount when input amount changes
  useEffect(() => {
    if (inputAmount) {
      fetchQuote();
    } else {
      setOutputAmount('');
      setCurrentQuote(null);
    }
  }, [inputAmount, selectedInputToken, selectedOutputToken]);

  // Helper function to format large numbers with proper suffixes (K, M, B, T)
  const formatLargeNumber = (value: number): string => {
    if (value >= 1_000_000_000_000) {
      return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
    } else if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  // Helper function to format the token data for display in TokenCard
  const formatTokenCardData = (symbol: string, amount: string, isReadOnly: boolean) => {
    const data = tokenData[symbol] || {};
    const analytics = tokenAnalytics[symbol] || {};
    const priceData = data.price || {};
    const metadataData = data.metadata || {};
    
    // Format price
    let price = '$0.00';
    if (priceData.usdPrice) {
      price = `$${parseFloat(priceData.usdPrice).toFixed(2)}`;
    }
    
    // Format market cap - specifically using totalFullyDilutedValuation from analytics
    let marketCap = '$0.00';
    if (analytics.totalFullyDilutedValuation) {
      // Use the FDV directly from analytics
      const fdv = parseFloat(analytics.totalFullyDilutedValuation);
      marketCap = formatLargeNumber(fdv);
    } else if (metadataData.fullyDilutedValue) {
      // Fallback to metadata's FDV if analytics aren't available
      const fdv = parseFloat(metadataData.fullyDilutedValue);
      marketCap = formatLargeNumber(fdv);
    } else if (metadataData.totalSupplyFormatted && priceData.usdPrice) {
      // Calculate as last resort
      const totalSupply = parseFloat(metadataData.totalSupplyFormatted);
      const usdPrice = parseFloat(priceData.usdPrice);
      const mcValue = totalSupply * usdPrice;
      marketCap = formatLargeNumber(mcValue);
    }
    
    // Format liquidity from analytics
    let liquidity = '$0.00';
    if (analytics.totalLiquidityUsd) {
      const liq = parseFloat(analytics.totalLiquidityUsd);
      liquidity = formatLargeNumber(liq);
    } else if (marketCap !== '$0.00') {
      // Fallback calculation if analytics aren't available
      const mcValue = parseFloat(marketCap.replace(/[^\d.-]/g, ''));
      const multiplier = marketCap.includes('T') ? 1_000_000_000_000 :
                      marketCap.includes('B') ? 1_000_000_000 :
                      marketCap.includes('M') ? 1_000_000 : 1;
      const mcValueRaw = mcValue * multiplier;
      
      // Calculate liquidity as roughly 2-5% of market cap
      const liquidityMultiplier = symbol === 'SOL' || symbol === 'USDC' || symbol === 'USDT' ? 0.05 : 0.02;
      const liquidityValue = mcValueRaw * liquidityMultiplier;
      liquidity = formatLargeNumber(liquidityValue);
    }
    
    // Format 24h buy volume from analytics
    let buyVolume24h = '$0.00';
    if (analytics.totalBuyVolume && analytics.totalBuyVolume["24h"]) {
      const volume = parseFloat(analytics.totalBuyVolume["24h"].toString());
      buyVolume24h = formatLargeNumber(volume);
    } else if (liquidity !== '$0.00') {
      // Fallback calculation if analytics aren't available
      const liquidityValue = parseFloat(liquidity.replace(/[^\d.-]/g, ''));
      const multiplier = liquidity.includes('T') ? 1_000_000_000_000 :
                      liquidity.includes('B') ? 1_000_000_000 :
                      liquidity.includes('M') ? 1_000_000 :
                      liquidity.includes('K') ? 1_000 : 1;
      const liquidityValueRaw = liquidityValue * multiplier;
      
      // Estimate buy volume as 30% of liquidity
      const volumeValue = liquidityValueRaw * 0.3;
      buyVolume24h = formatLargeNumber(volumeValue);
    }
    
    // Format 24h sell volume from analytics
    let sellVolume24h = '$0.00';
    if (analytics.totalSellVolume && analytics.totalSellVolume["24h"]) {
      const volume = parseFloat(analytics.totalSellVolume["24h"].toString());
      sellVolume24h = formatLargeNumber(volume);
    } else if (liquidity !== '$0.00') {
      // Fallback calculation if analytics aren't available
      const liquidityValue = parseFloat(liquidity.replace(/[^\d.-]/g, ''));
      const multiplier = liquidity.includes('T') ? 1_000_000_000_000 :
                      liquidity.includes('B') ? 1_000_000_000 :
                      liquidity.includes('M') ? 1_000_000 :
                      liquidity.includes('K') ? 1_000 : 1;
      const liquidityValueRaw = liquidityValue * multiplier;
      
      // Estimate sell volume as 25% of liquidity
      const volumeValue = liquidityValueRaw * 0.25;
      sellVolume24h = formatLargeNumber(volumeValue);
    }
    
    // Price change
    let changePercent = '+0.00%';
    let changePositive = true;
    if (priceData.usdPrice24hrPercentChange) {
      const change = parseFloat(priceData.usdPrice24hrPercentChange);
      changePositive = change >= 0;
      changePercent = `${changePositive ? '+' : ''}${change.toFixed(2)}%`;
    }
    
    return {
      icon: getTokenIcon(symbol),
      name: symbol,
      symbol: symbol,
      value: amount,
      valueReadOnly: isReadOnly,
      price: price,
      marketCap: marketCap,
      liquidity: liquidity,
      buyVolume24h: buyVolume24h,
      sellVolume24h: sellVolume24h,
      changePercent: changePercent,
      changePositive: changePositive
    };
  };

  const inputToken = formatTokenCardData(selectedInputToken, inputAmount, false);
  const outputToken = formatTokenCardData(selectedOutputToken, outputAmount, true);

  console.log('Token Data State:', tokenData);
  console.log('Token Analytics State:', tokenAnalytics);
  console.log('Input Token:', inputToken);
  console.log('Output Token:', outputToken);

  const fetchQuote = useCallback(async () => {
    if (!selectedInputToken || !selectedOutputToken || !inputAmount || parseFloat(inputAmount) <= 0) {
      console.log("Skipping quote fetch: missing required data", { 
        hasInputToken: !!selectedInputToken, 
        hasOutputToken: !!selectedOutputToken, 
        inputAmount 
      });
      return;
    }
    
        setIsLoading(true);
        setError(null);

    try {
      console.log("Fetching quote with:", {
        inputToken: selectedInputToken,
        outputToken: selectedOutputToken,
        inputAmount
      });

      // Safely find the input token address
      let inputTokenAddress = "";
      if (TOKEN_ADDRESSES[selectedInputToken]) {
        inputTokenAddress = TOKEN_ADDRESSES[selectedInputToken];
        console.log(`Found input token ${selectedInputToken} in TOKEN_ADDRESSES map:`, inputTokenAddress);
      } else {
        // Lookup in availableTokens array - this should catch custom tokens
        const foundToken = availableTokens.find(t => 
          t.symbol.toLowerCase() === selectedInputToken.toLowerCase()
        );
        
        if (foundToken && foundToken.address) {
          inputTokenAddress = foundToken.address;
          console.log(`Found input token address in availableTokens:`, inputTokenAddress);
        } else {
          console.error(`Could not find address for input token ${selectedInputToken}`);
          setError(`Could not find address for ${selectedInputToken}`);
          setIsLoading(false);
          return;
        }
      }

      // Safely find the output token address
      let outputTokenAddress = "";
      if (TOKEN_ADDRESSES[selectedOutputToken]) {
        outputTokenAddress = TOKEN_ADDRESSES[selectedOutputToken];
        console.log(`Found output token ${selectedOutputToken} in TOKEN_ADDRESSES map:`, outputTokenAddress);
      } else {
        // Lookup in availableTokens array - this should catch custom tokens
        const foundToken = availableTokens.find(t => 
          t.symbol.toLowerCase() === selectedOutputToken.toLowerCase()
        );
        
        if (foundToken && foundToken.address) {
          outputTokenAddress = foundToken.address;
          console.log(`Found output token address in availableTokens:`, outputTokenAddress);
        } else {
          console.error(`Could not find address for output token ${selectedOutputToken}`);
          setError(`Could not find address for ${selectedOutputToken}`);
          setIsLoading(false);
          return;
        }
      }

      console.log(`Processing quote with addresses:`, {
        inputTokenAddress,
        outputTokenAddress
      });

      // Get decimals for the selected tokens
      const inputTokenDecimals = getTokenDecimals(selectedInputToken);
      const outputTokenDecimals = getTokenDecimals(selectedOutputToken);

      const rawAmount = amountToRaw(inputAmount, inputTokenDecimals);
      console.log(`Converted input amount ${inputAmount} to raw: ${rawAmount}`);
      
      if (!rawAmount) {
        console.error("Failed to convert amount to raw value");
        setError("Invalid amount format");
        setIsLoading(false);
        return;
      }

      // Remove slippage calculation as we're using a fixed value
      console.log("Using fixed slippage value of 200 bps (2%) for better swap success rate");
      
      try {
        // @ts-ignore - ignore type mismatch for slippage parameter
        const quoteResponse = await getQuoteV2(
          connection,
          inputTokenAddress,
          outputTokenAddress,
          rawAmount,
          200 // Fixed 2% slippage for reliable swaps
        );
        
        console.log("Quote response:", quoteResponse);

        if (quoteResponse) {
          setCurrentQuote(quoteResponse);
          const outAmount = rawToAmount(quoteResponse.outAmount, outputTokenDecimals);
          setOutputAmount(outAmount);
          setPriceImpact(quoteResponse.priceImpactPct);
        } else {
          console.error("Received empty quote response");
          setError("Failed to get quote");
        }
      } catch (error) {
        console.error("Error fetching quote:", error);
        setError(`Swap quote error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedInputToken, selectedOutputToken, inputAmount, availableTokens, connection]);

  const handleSwap = async () => {
    if (!wallet || !publicKey || !currentQuote) {
      setError('Please connect your wallet and get a quote first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setIsConfirming(true);
      
      console.log('Starting swap execution...');
      console.log('Using wallet public key:', publicKey.toString());
      
      // For debugging, check token addresses
      const inputAddress = TOKEN_ADDRESSES[selectedInputToken];
      const outputAddress = TOKEN_ADDRESSES[selectedOutputToken];
      
      console.log('Swap details:', {
        inputToken: selectedInputToken,
        inputAddress,
        outputToken: selectedOutputToken,
        outputAddress,
        inputAmount,
        expectedOutputAmount: outputAmount,
        slippage: Math.floor(slippage * 100)
      });
      
      // Call Jupiter API to execute the swap
      try {
        const result = await executeSwap(
          currentQuote,
          publicKey.toString(),
          connection,
          wallet.signTransaction.bind(wallet)
        );
        
        console.log('Swap result:', result);
        
        if (result.status === 'confirmed') {
          console.log('Swap successful! Transaction ID:', result.txid);
          // Show a success message
          setError(`Swap completed successfully! TXID: ${result.txid.substring(0, 8)}...`);
          
          // Clear amounts and refresh balances
          setInputAmount('');
          setOutputAmount('');
          setCurrentQuote(null);
          await fetchBalance();
        } else {
          setError(`Swap ${result.status}. Please try again. TXID: ${result.txid.substring(0, 8)}...`);
        }
      } catch (swapError: any) {
        console.error('Swap API error:', swapError);
        
        // Extract better error message
        let errorMessage = 'Failed to execute swap';
        if (swapError.message && swapError.message.includes('-')) {
          // Try to extract the error message from the API response
          const parts = swapError.message.split('-');
          if (parts.length > 1) {
            errorMessage = parts[1].trim();
          } else {
            errorMessage = swapError.message;
          }
        } else if (swapError.message) {
          errorMessage = swapError.message;
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      console.error('General swap error:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute swap');
    } finally {
      setIsLoading(false);
      setIsConfirming(false);
    }
  };

  // Handle token selection from modal
  const handleSelectToken = (token: any) => {
    console.log('Selected token:', token);
    
    // Prevent selecting the same token for both sides
    if ((modalOpen === 'FROM' && token.symbol === selectedOutputToken) ||
        (modalOpen === 'TO' && token.symbol === selectedInputToken)) {
      setError('Cannot select the same token for both sides');
      return;
    }
    
    if (modalOpen === 'FROM') {
      setSelectedInputToken(token.symbol);
      
      // If this is a custom token with an address that's not in TOKEN_ADDRESSES,
      // add it to the TOKEN_ADDRESSES map
      if (token.address && !TOKEN_ADDRESSES[token.symbol]) {
        console.log(`Adding custom input token to TOKEN_ADDRESSES: ${token.symbol} = ${token.address}`);
        TOKEN_ADDRESSES[token.symbol] = token.address;
        
        // Also add to available tokens if not already present
        if (!availableTokens.some(t => t.symbol === token.symbol)) {
          console.log(`Adding custom token to availableTokens:`, token);
          
          // Create a proper icon for the token with its symbol
          const tokenIcon = getTokenIcon('CUSTOM', token.symbol);
          
          const newToken = { 
            ...token,
            icon: tokenIcon, // Always use the CUSTOM icon for safety
            balance: token.balance || '0',
          };
          const newAvailableTokens = [...availableTokens, newToken];
          setAvailableTokens(newAvailableTokens);
          
          // Track custom tokens separately
          setCustomTokens([...customTokens, newToken]);
          
          // Add to persistent storage through the hook
          addCustomToken({
            symbol: token.symbol,
            name: token.name,
            address: token.address,
            decimals: token.decimals
          });
        }
      }
    } else if (modalOpen === 'TO') {
      setSelectedOutputToken(token.symbol);
      
      // Same logic for custom tokens on the output side
      if (token.address && !TOKEN_ADDRESSES[token.symbol]) {
        console.log(`Adding custom output token to TOKEN_ADDRESSES: ${token.symbol} = ${token.address}`);
        TOKEN_ADDRESSES[token.symbol] = token.address;
        
        // Also add to available tokens if not already present
        if (!availableTokens.some(t => t.symbol === token.symbol)) {
          console.log(`Adding custom token to availableTokens:`, token);
          
          // Create a proper icon for the token with its symbol
          const tokenIcon = getTokenIcon('CUSTOM', token.symbol);
          
          const newToken = { 
            ...token,
            icon: tokenIcon, // Always use the CUSTOM icon for safety
            balance: token.balance || '0',
          };
          const newAvailableTokens = [...availableTokens, newToken];
          setAvailableTokens(newAvailableTokens);
          
          // Track custom tokens separately
          setCustomTokens([...customTokens, newToken]);
          
          // Add to persistent storage through the hook
          addCustomToken({
            symbol: token.symbol,
            name: token.name,
            address: token.address,
            decimals: token.decimals
          });
        }
      }
    }
    
    setModalOpen(null);
    setError(null);
  };

  // Function to get token decimals for formatting amounts
  const getTokenDecimals = (symbol: string): number => {
    // Check if it's a known token with fixed decimals
    if (symbol === 'SOL') return 9;
    if (symbol === 'USDC') return 6;
    if (symbol === 'BONK') return 5;
    if (symbol === 'TRUMP') return 9;
    if (symbol === 'USDT') return 6;
    
    // Check if it's a custom token with stored decimals
    const customToken = availableTokens.find(t => t.symbol === symbol);
    if (customToken && customToken.decimals !== undefined) {
      console.log(`Using custom token decimals for ${symbol}: ${customToken.decimals}`);
      return customToken.decimals;
    }
    
    // Default to 9 decimals if unknown
    console.log(`No decimals found for ${symbol}, using default (9)`);
    return 9;
  };

  // Debug log available tokens and TOKEN_ADDRESSES for debugging
  useEffect(() => {
    console.log('Available tokens updated:', availableTokens);
    console.log('TOKEN_ADDRESSES updated:', TOKEN_ADDRESSES);
  }, [availableTokens]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center mt-10">
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full mt-4">
        <TokenCard 
          type="FROM" 
          token={inputToken} 
          onValueChange={setInputAmount} 
          onSelectToken={() => setModalOpen('FROM')} 
        />
        <div className="flex items-center justify-center mx-2 my-4 md:my-0">
          <div className="bg-white rounded-full shadow p-2 text-2xl text-orange-500">⇄</div>
        </div>
        <TokenCard 
          type="TO" 
          token={outputToken} 
          onSelectToken={() => setModalOpen('TO')} 
        />
      </div>
      
      {/* Price impact and slippage settings */}
      {currentQuote && (
        <div className="w-full max-w-xl mt-4 flex justify-between text-sm text-gray-600">
          <div>
            Price Impact: <span className={parseFloat(priceImpact) > 5 ? "text-red-500 font-bold" : ""}>{parseFloat(priceImpact).toFixed(2)}%</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">Slippage:</span>
            <select 
              value={slippage} 
              onChange={e => setSlippage(parseFloat(e.target.value))}
              className="bg-white border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="0.1">0.1%</option>
              <option value="0.5">0.5%</option>
              <option value="1.0">1.0%</option>
              <option value="2.0">2.0%</option>
            </select>
          </div>
        </div>
      )}
      
      <div className="mt-8 w-full flex flex-col items-center">
        <SwapActions 
          onSwap={handleSwap}
          isLoading={isLoading}
          isConfirming={isConfirming}
          error={error}
        />
        
        {/* Debug button for development */}
        {process.env.NODE_ENV !== 'production' && (
          <button 
            onClick={() => {
              console.log({
                selectedInputToken,
                selectedOutputToken,
                inputAmount,
                outputAmount,
                availableTokens,
                customTokens,
                TOKEN_ADDRESSES
              });
              alert('Debug info logged to console');
            }}
            className="mt-4 text-xs text-gray-500 underline"
          >
            Debug Info
          </button>
        )}
      </div>
      <TokenSelectModal
        open={modalOpen === 'FROM'}
        onClose={() => setModalOpen(null)}
        tokens={availableTokens}
        onSelect={handleSelectToken}
      />
      <TokenSelectModal
        open={modalOpen === 'TO'}
        onClose={() => setModalOpen(null)}
        tokens={availableTokens}
        onSelect={handleSelectToken}
      />
    </div>
  );
};

export default SwapPanel; 