'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import WalletConnectButton from './WalletConnectButton';

const HeaderBar = () => (
  <header className="w-full flex items-center justify-between px-8 py-4 bg-gradient-to-r from-orange-400 to-yellow-300 rounded-b-3xl shadow-lg">
    <div className="flex items-center gap-3">
      {/* BONKSWAP Logo */}
      <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
        <Image 
          src="/bonkswap-logo.png" 
          alt="BONKSWAP Logo" 
          width={64} 
          height={64}
          className="rounded-full object-cover"
          priority
        />
      </div>
      <span className="text-3xl font-extrabold text-white tracking-wide drop-shadow-md">BONKSWAP</span>
    </div>
    <nav className="flex gap-8 text-lg font-semibold text-white">
      {/* Navigation items have been removed as requested */}
    </nav>
    <WalletConnectButton />
  </header>
);

export default HeaderBar; 