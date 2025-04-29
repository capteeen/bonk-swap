'use client';
import React, { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { validateSplToken, TokenMetadata } from '../services/tokenService';

interface CustomTokenInputProps {
  side: 'input' | 'output';
  value: string;
  onChange: (address: string, metadata: TokenMetadata | null) => void;
  onValidationStart?: () => void;
  onValidationComplete?: () => void;
}

const CustomTokenInput: React.FC<CustomTokenInputProps> = ({
  side,
  value,
  onChange,
  onValidationStart,
  onValidationComplete
}) => {
  const { connection } = useConnection();
  const [address, setAddress] = useState(value);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);

  useEffect(() => {
    setAddress(value);
  }, [value]);

  // Debounced validation
  useEffect(() => {
    if (!address || address.length < 32) {
      setTokenMetadata(null);
      setValidationError(null);
      return;
    }

    const validateToken = async () => {
      try {
        setIsValidating(true);
        setValidationError(null);
        if (onValidationStart) onValidationStart();
        
        const metadata = await validateSplToken(connection, address);
        setTokenMetadata(metadata);
        
        if (!metadata.isValid) {
          setValidationError('Invalid token address');
          onChange(address, null);
        } else {
          setValidationError(null);
          onChange(address, metadata);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setValidationError('Invalid token address');
        setTokenMetadata(null);
        onChange(address, null);
      } finally {
        setIsValidating(false);
        if (onValidationComplete) onValidationComplete();
      }
    };

    const debounceTimeout = setTimeout(() => {
      validateToken();
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [address, connection, onChange, onValidationStart, onValidationComplete]);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {side === 'input' ? 'Input Token Address' : 'Output Token Address'}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={`block w-full p-3 sm:text-sm rounded-md focus:outline-none ${
            validationError
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
              : tokenMetadata && tokenMetadata.isValid
              ? 'border-green-300 text-green-900 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          }`}
          placeholder={`Enter ${side === 'input' ? 'input' : 'output'} token address`}
        />
        {isValidating && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
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
          </div>
        )}
      </div>
      
      {validationError && (
        <p className="mt-2 text-sm text-red-600">{validationError}</p>
      )}
      
      {tokenMetadata && tokenMetadata.isValid && (
        <div className="mt-2 flex items-center text-sm text-green-600">
          <span className="font-medium">{tokenMetadata.symbol}</span>
          <span className="ml-1">({tokenMetadata.name})</span>
          <span className="ml-2">Decimals: {tokenMetadata.decimals}</span>
        </div>
      )}
    </div>
  );
};

export default CustomTokenInput; 