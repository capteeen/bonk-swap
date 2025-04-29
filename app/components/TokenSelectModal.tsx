'use client';
import React, { useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { validateSplToken } from '../services/tokenService';
import Image from 'next/image';
import { createTokenIcon, createFallbackIcon } from '../services/tokenIconUtils';

// Map of known tokens with local image paths
const LOCAL_TOKEN_ICONS: Record<string, string> = {
  'SOL': '/TOKEN ICONS/sol.PNG',
  'USDC': '/TOKEN ICONS/USDC.PNG',
  'BONK': '/TOKEN ICONS/BONK.PNG',
  'TRUMP': '/TOKEN ICONS/OFFICIAL TRUMP.PNG',
  'USDT': '/TOKEN ICONS/usdt.PNG',
  'CUSTOM': '/TOKEN ICONS/default-token.svg',
  'UNKNOWN': '/TOKEN ICONS/default-token.svg'
};

interface Token {
  icon: React.ReactNode;
  name: string;
  symbol: string;
  balance: string;
  address?: string;
  decimals?: number;
}

interface TokenSelectModalProps {
  open: boolean;
  onClose: () => void;
  tokens: Token[];
  onSelect: (token: Token) => void;
}

const TokenSelectModal: React.FC<TokenSelectModalProps> = ({
  open,
  onClose,
  tokens,
  onSelect
}) => {
  const { connection } = useConnection();
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | React.ReactNode>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!open) return null;

  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomTokenValidation = async () => {
    if (!customTokenAddress || customTokenAddress.length < 30) {
      setValidationError('Please enter a valid token address (at least 30 characters)');
      return;
    }

    try {
      setIsValidating(true);
      setValidationError(null);
      
      console.log('Validating token address:', customTokenAddress);
      
      // Validate the token with our service
      const metadata = await validateSplToken(connection, customTokenAddress);
      
      console.log('Token validation result:', metadata);
      
      // Try to fetch additional metadata from Moralis API
      const MORALIS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImVjYzAxZDliLTdjYWItNDgzYy1hZDUzLTY4ZGMxMTkwZjZjNCIsIm9yZ0lkIjoiNDkyMTEiLCJ1c2VySWQiOiI0ODg3NiIsInR5cGVJZCI6IjUwMTgwNWE5LTVkNWEtNDI3OC1hMjE4LWIxNGFhYTU0OTljMCIsInR5cGUiOiJQUk9KRUNUIiwiaWF0IjoxNzQ0NTYzODI2LCJleHAiOjQ5MDAzMjM4MjZ9.XxbCVueyjps5wYAkl8AwuywxhBcw1xkieimSI_yOtfA';
      
      let tokenName = metadata.name || 'Unknown Token';
      let tokenSymbol = metadata.symbol || 'UNKNOWN';
      let tokenLogo: string | null = null;
      let tokenDecimals = metadata.decimals;
      
      try {
        console.log('Fetching additional metadata from Moralis API for:', customTokenAddress);
        
        const response = await fetch(
          `https://solana-gateway.moralis.io/token/mainnet/${customTokenAddress}/metadata`,
          {
            headers: {
              'accept': 'application/json',
              'X-API-Key': MORALIS_API_KEY
            }
          }
        );
        
        if (response.ok) {
          const moralisData = await response.json();
          console.log('Moralis API response:', moralisData);
          
          // Update token details if Moralis data is available
          if (moralisData) {
            tokenName = moralisData.name || tokenName;
            tokenSymbol = moralisData.symbol || tokenSymbol;
            
            // Get the best available logo URL
            if (moralisData.logo) {
              tokenLogo = moralisData.logo;
              console.log('Using logo from Moralis:', tokenLogo);
            } else if (moralisData.logoURI) {
              tokenLogo = moralisData.logoURI;
              console.log('Using logoURI from Moralis:', tokenLogo);
            } else if (moralisData.metaplex?.metadataUri) {
              // Try to get image from metaplex metadata if it's not a direct image
              const metaplexUri = moralisData.metaplex.metadataUri;
              console.log('Metaplex metadata URI:', metaplexUri);
              
              if (typeof metaplexUri === 'string') {
                if (metaplexUri.endsWith('.png') || 
                   metaplexUri.endsWith('.jpg') || 
                   metaplexUri.endsWith('.jpeg') || 
                   metaplexUri.endsWith('.svg') || 
                   metaplexUri.endsWith('.gif')) {
                  // It's a direct image URL
                  tokenLogo = metaplexUri;
                  console.log('Using direct image URL from metaplex:', tokenLogo);
                } else if (metaplexUri.startsWith('http')) {
                  // It might be a metadata JSON that contains an image URL
                  try {
                    console.log('Attempting to fetch metadata from:', metaplexUri);
                    const metadataResponse = await fetch(metaplexUri);
                    if (metadataResponse.ok) {
                      const metadata = await metadataResponse.json();
                      if (metadata.image) {
                        tokenLogo = metadata.image;
                        console.log('Found image in metadata JSON:', tokenLogo);
                      }
                    }
                  } catch (error) {
                    console.error('Error fetching metadata from metaplex URI:', error);
                  }
                }
              }
            }
            
            if (moralisData.decimals !== undefined) {
              tokenDecimals = moralisData.decimals;
            }
            
            console.log('Final token data from Moralis:', {
              name: tokenName,
              symbol: tokenSymbol,
              logo: tokenLogo,
              decimals: tokenDecimals
            });
          }
        } else {
          console.log('Moralis API returned non-OK response:', response.status);
        }
      } catch (error) {
        console.error('Error fetching Moralis metadata:', error);
        // Continue with the basic metadata we already have
      }
      
      // Create token icon based on available data
      let tokenIcon;
      if (tokenLogo) {
        console.log('Creating token icon with logo URL:', tokenLogo);

        // Check if we can use a local token icon instead of remote URL
        const localIconPath = getLocalTokenIconPath(tokenSymbol);
        if (localIconPath) {
          console.log('Using local token icon:', localIconPath);
          tokenIcon = createTokenIcon(tokenSymbol, localIconPath);
        } else {
          tokenIcon = createTokenIcon(tokenSymbol, tokenLogo);
        }
      } else {
        console.log('No logo URL available, using fallback icon');
        tokenIcon = createFallbackIcon();
      }
      
      // Create a new token object with the enhanced metadata
      const customToken: Token = {
        icon: tokenIcon,
        name: tokenName,
        symbol: tokenSymbol,
        balance: '0',
        address: customTokenAddress,
        decimals: tokenDecimals
      };
      
      console.log('Custom token created successfully:', customToken);
      
      onSelect(customToken);
      onClose();
      
    } catch (error) {
      console.error('Token validation error details:', error);
      
      // Provide an option to force-add the token
      setValidationError(
        <div>
          <p className="mb-2">Unable to validate token. This may not be a standard SPL token or it might not exist.</p>
          <button
            onClick={() => forceAddToken()}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded-lg mt-1"
          >
            Force Add Token
          </button>
        </div>
      );
    } finally {
      setIsValidating(false);
    }
  };

  // Function to force-add a token even if validation fails
  const forceAddToken = () => {
    // Check if we can use a local token icon
    const localIconPath = getLocalTokenIconPath('CUSTOM');
    
    const customToken: Token = {
      icon: localIconPath ? createTokenIcon('CUSTOM', localIconPath) : createFallbackIcon(),
      name: `Custom Token ${customTokenAddress.substring(0, 8)}...`,
      symbol: 'CUSTOM',
      balance: '0',
      address: customTokenAddress,
      decimals: 9
    };
    
    console.log('Force-adding custom token:', customToken);
    onSelect(customToken);
    onClose();
  };

  // Function to get local token icon path if available
  const getLocalTokenIconPath = (symbol: string): string | null => {
    const normalizedSymbol = symbol.toUpperCase();
    return LOCAL_TOKEN_ICONS[normalizedSymbol] || null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Select Token</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Search input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search name or symbol"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
            />
          </div>

          {/* Custom token input */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Add Custom Token</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter token address"
                value={customTokenAddress}
                onChange={(e) => setCustomTokenAddress(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
              />
              <button
                onClick={handleCustomTokenValidation}
                disabled={isValidating}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {isValidating ? 'Loading...' : 'Add'}
              </button>
            </div>
            {validationError && (
              <p className="mt-2 text-sm text-red-600">{validationError}</p>
            )}
          </div>
          
          <div className="space-y-2">
            {filteredTokens.map((token) => (
              <button
                key={token.symbol + (token.address || '')}
                onClick={() => onSelect(token)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center text-xl">
                    {token.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{token.symbol}</div>
                    <div className="text-sm text-gray-500">{token.name}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {token.balance}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenSelectModal; 