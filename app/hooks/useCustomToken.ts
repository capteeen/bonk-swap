import { useState, useEffect } from 'react';

// Defining our token interface - note that we don't store the icon element
// since it can't be serialized to localStorage
interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals?: number;
  balance?: string;
  // We don't include the React node icon here, as it can't be serialized
}

// This hook manages custom tokens and ensures they persist between sessions
export function useCustomTokens() {
  // Initialize tokens from localStorage if available
  const [customTokens, setCustomTokens] = useState<Token[]>(() => {
    try {
      const storedTokens = localStorage.getItem('customTokens');
      return storedTokens ? JSON.parse(storedTokens) : [];
    } catch (e) {
      console.error('Failed to load custom tokens from localStorage', e);
      return [];
    }
  });
  
  // Add a token to the list
  const addToken = (token: Token) => {
    // Don't add duplicates
    if (customTokens.some(t => t.address === token.address)) {
      console.log('Token already exists', token);
      return;
    }
    
    // Make sure we're not trying to store React nodes
    const storableToken = {
      symbol: token.symbol,
      name: token.name,
      address: token.address,
      decimals: token.decimals,
      balance: token.balance
    };
    
    console.log('Adding custom token', storableToken);
    const updatedTokens = [...customTokens, storableToken];
    setCustomTokens(updatedTokens);
  };
  
  // Remove a token from the list
  const removeToken = (address: string) => {
    const updatedTokens = customTokens.filter(t => t.address !== address);
    setCustomTokens(updatedTokens);
  };
  
  // Update a token's properties
  const updateToken = (address: string, updates: Partial<Token>) => {
    const updatedTokens = customTokens.map(token => 
      token.address === address ? { ...token, ...updates } : token
    );
    setCustomTokens(updatedTokens);
  };
  
  // Find a token by address
  const findToken = (address: string) => {
    return customTokens.find(t => t.address === address);
  };
  
  // Find a token by symbol
  const findTokenBySymbol = (symbol: string) => {
    return customTokens.find(t => t.symbol === symbol);
  };
  
  // Save tokens to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('customTokens', JSON.stringify(customTokens));
      console.log('Saved custom tokens to localStorage', customTokens);
    } catch (e) {
      console.error('Failed to save custom tokens to localStorage', e);
    }
  }, [customTokens]);
  
  return {
    customTokens,
    addToken,
    removeToken,
    updateToken,
    findToken,
    findTokenBySymbol
  };
} 