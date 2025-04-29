import React from 'react';
import MiniChart from './MiniChart';

const SwapDetails: React.FC = () => (
  <div className="w-full flex flex-col md:flex-row gap-4 mt-6 items-stretch justify-between">
    <div className="flex-1 bg-gradient-to-br from-orange-200 to-yellow-100 rounded-3xl shadow-lg p-6 flex flex-col gap-4 min-w-[320px]">
      <div className="text-sm text-gray-600 font-semibold">Swapping Through</div>
      <div className="font-bold text-lg text-gray-800">BONK - USDC</div>
      <div className="text-sm text-gray-600 font-semibold mt-2">Rate</div>
      <div className="font-bold text-lg text-gray-800">0.00001911 USDC per BONK</div>
    </div>
    <div className="flex-1 bg-gradient-to-br from-orange-200 to-yellow-100 rounded-3xl shadow-lg p-6 flex flex-col gap-4 min-w-[320px]">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center text-xl">🐶</div>
          <div className="text-xs text-gray-500 mt-1">BONK</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">💲</div>
          <div className="text-xs text-gray-500 mt-1">USDC</div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Price</span>
            <span>24H%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-800">$0.00</span>
            <span className="text-green-600 font-bold text-sm">+3.32%</span>
          </div>
          <MiniChart />
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Price</span>
            <span>24H%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-800">$1.00</span>
            <span className="text-gray-800 font-bold text-sm">+0.00%</span>
          </div>
          <MiniChart />
        </div>
      </div>
    </div>
    <div className="flex-1 bg-gradient-to-br from-orange-200 to-yellow-100 rounded-3xl shadow-lg p-6 flex flex-col gap-4 min-w-[320px]">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-gray-600 text-sm font-semibold">
          <span>Price Impact</span>
          <span className="text-gray-800 font-bold">0%</span>
        </div>
        <div className="flex justify-between text-gray-600 text-sm font-semibold">
          <span>Swap Fees</span>
          <span className="text-gray-800 font-bold">0 USDC</span>
        </div>
      </div>
      <button className="mt-4 bg-black text-white rounded-full px-6 py-3 font-bold text-lg shadow hover:bg-gray-800 transition">Select Wallet</button>
    </div>
  </div>
);

export default SwapDetails; 