'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import WalletConnectButton from './WalletConnectButton';

const HeaderBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // BONK contract address
  const contractAddress = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(contractAddress)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };
  
  return (
    <header className="w-full bg-gradient-to-r from-orange-400 to-yellow-300 rounded-b-3xl shadow-lg">
      {/* Main header content */}
      <div className="w-full flex flex-wrap items-center justify-between px-4 sm:px-6 md:px-8 py-3 md:py-4">
        <div className="flex items-center gap-2 md:gap-3">
          {/* BONKSWAP Logo */}
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
            <Image 
              src="/bonkswap-logo.png" 
              alt="BONKSWAP Logo" 
              width={64} 
              height={64}
              className="rounded-full object-cover"
              priority
            />
          </div>
          <span className="text-xl md:text-3xl font-extrabold text-white tracking-wide drop-shadow-md">BONKSWAP</span>
        </div>
        
        {/* Contract Address - Desktop */}
        <div className="hidden md:flex items-center bg-white/20 rounded-full px-3 py-1.5 hover:bg-white/30 transition-colors cursor-pointer" onClick={copyToClipboard}>
          <div className="flex items-center">
            <span className="text-sm text-white font-medium mr-2">Contract:</span>
            <span className="text-sm text-white">{`${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`}</span>
            <div className="ml-2 text-white">
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                  <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                </svg>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white p-2"
            aria-label="Toggle mobile menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex gap-6 lg:gap-8 text-lg font-semibold text-white">
          {/* Twitter link */}
          <a 
            href="https://x.com/bonk_swap_sol?s=21&t=ARvJV7n4r1UMTlD-08jo_g" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:text-yellow-100"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              className="w-6 h-6 fill-current"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="ml-2">Twitter</span>
          </a>
          
          {/* Telegram link */}
          <a 
            href="https://t.me/BONKSWAPCHAT" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:text-yellow-100"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              className="w-6 h-6 fill-current"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            <span className="ml-2">Telegram</span>
          </a>
        </nav>
        
        {/* Desktop wallet button */}
        <div className="hidden md:block">
          <WalletConnectButton />
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden ${menuOpen ? 'block' : 'hidden'} px-4 pb-4`}>
        <nav className="flex flex-col gap-4 text-lg font-semibold text-white">
          {/* Contract Address - Mobile */}
          <div 
            className="flex items-center bg-white/20 rounded-full px-3 py-2 hover:bg-white/30 transition-colors cursor-pointer mb-2" 
            onClick={copyToClipboard}
          >
            <div className="flex items-center w-full justify-between">
              <span className="text-sm text-white font-medium">Contract:</span>
              <span className="text-sm text-white">{`${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`}</span>
              <div className="ml-2 text-white">
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                    <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                  </svg>
                )}
              </div>
            </div>
          </div>
          
          {/* Twitter link */}
          <a 
            href="https://x.com/bonk_swap_sol?s=21&t=ARvJV7n4r1UMTlD-08jo_g" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:text-yellow-100"
            onClick={() => setMenuOpen(false)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              className="w-6 h-6 fill-current"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="ml-2">Twitter</span>
          </a>
          
          {/* Telegram link */}
          <a 
            href="https://t.me/BONKSWAPCHAT" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:text-yellow-100"
            onClick={() => setMenuOpen(false)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              className="w-6 h-6 fill-current"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            <span className="ml-2">Telegram</span>
          </a>
          
          {/* Mobile wallet button */}
          <div className="pt-2">
            <WalletConnectButton />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default HeaderBar; 