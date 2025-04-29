'use client';
import React from 'react';
import HeaderBar from '../components/HeaderBar';
import CustomTokenSwap from '../components/CustomTokenSwap';

export default function SwapPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-400 via-yellow-200 to-yellow-100 flex flex-col">
      <HeaderBar />
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CustomTokenSwap />
        </div>
      </main>
    </div>
  );
} 