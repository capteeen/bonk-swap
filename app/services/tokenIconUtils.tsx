import React, { useState, useEffect } from 'react';

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

/**
 * Get the local token icon path if available
 */
const getLocalTokenIconPath = (symbol: string): string | null => {
  if (!symbol) return null;
  const normalizedSymbol = symbol.toUpperCase();
  return LOCAL_TOKEN_ICONS[normalizedSymbol] || LOCAL_TOKEN_ICONS['UNKNOWN'];
};

/**
 * Validate if a URL is usable with Next.js Image component
 */
const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    // Check if it's a valid URL
    new URL(url);
    
    // Check if it's HTTPS (Next.js image optimization works better with HTTPS)
    return url.startsWith('https://') || url.startsWith('http://');
  } catch (e) {
    console.error('Invalid image URL:', url, e);
    return false;
  }
};

/**
 * Create a standardized token icon React component using standard img instead of Next.js Image
 * to avoid domain configuration issues with external URLs
 */
export const createTokenIcon = (symbol: string, logoURI?: string) => {
  // Try to use local icon first
  const localIconPath = getLocalTokenIconPath(symbol);
  
  // If we have a local icon, use that instead of remote URL
  const iconUrl = localIconPath || logoURI;
  
  if (iconUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <img 
          src={iconUrl} 
          alt={symbol}
          width={32}
          height={32}
          className="rounded-full w-8 h-8 object-cover"
          onError={(e) => {
            // Fallback to generic icon if image fails to load
            console.log('Token image failed to load, using fallback icon');
            // Replace with fallback icon
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              // Clear any previous content and add fallback
              parent.innerHTML = '<div style="font-size: 24px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">🪙</div>';
            }
          }}
        />
      </div>
    );
  } else {
    return createFallbackIcon();
  }
};

/**
 * Create a fallback icon when no logo is available
 */
export const createFallbackIcon = () => {
  // Try to use the default token icon
  const defaultIconPath = LOCAL_TOKEN_ICONS['UNKNOWN'];
  
  if (defaultIconPath) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <img 
          src={defaultIconPath} 
          alt="Token"
          width={32}
          height={32}
          className="rounded-full w-8 h-8 object-cover"
          onError={(e) => {
            // If even the default icon fails, use emoji
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.innerHTML = '<div style="font-size: 24px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">🪙</div>';
            }
          }}
        />
      </div>
    );
  }
  
  // If all else fails, use the emoji
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span style={{ fontSize: '24px' }}>🪙</span>
    </div>
  );
}; 