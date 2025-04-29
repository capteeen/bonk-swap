import React from 'react';
import { useWallet } from '../context/WalletContext';

interface SwapActionsProps {
  onSwap: () => Promise<void>;
  isLoading: boolean;
  isConfirming: boolean;
  error: string | null;
}

const SwapActions: React.FC<SwapActionsProps> = ({
  onSwap,
  isLoading,
  isConfirming,
  error
}) => {
  const { wallet } = useWallet();

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4">
      {error && (
        <div className="w-full p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      <button
        onClick={onSwap}
        disabled={isLoading || isConfirming || !wallet?.connected}
        className={`w-full py-3 px-6 rounded-lg text-white font-medium transition-colors
          ${!wallet?.connected ? 'bg-gray-400 cursor-not-allowed' : 
            isLoading || isConfirming ? 'bg-gray-400 cursor-not-allowed' : 
            'bg-orange-500 hover:bg-orange-600'}`}
      >
        {!wallet?.connected ? 'Connect Wallet to Swap' :
         isLoading ? 'Loading...' :
         isConfirming ? 'Confirming...' :
         'Swap'}
      </button>
      {!wallet?.connected && (
        <div className="text-sm text-gray-600 mt-1 text-center">
          Connect your wallet using the button in the header to swap tokens
        </div>
      )}
    </div>
  );
};

export default SwapActions; 