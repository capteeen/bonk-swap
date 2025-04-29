'use client';
import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const WalletConnectButton: React.FC = () => {
  return (
    <div className="wallet-adapter-wrapper">
      <WalletMultiButton className="wallet-adapter-button custom-wallet-button" />
      <style jsx global>{`
        .wallet-adapter-button.custom-wallet-button {
          background-color: black;
          color: white;
          border-radius: 9999px;
          padding: 0.5rem 1.5rem;
          font-weight: 700;
          font-size: 1.125rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          transition: background-color 0.3s;
          height: auto;
        }
        .wallet-adapter-button.custom-wallet-button:hover {
          background-color: #333;
        }
        .wallet-adapter-button.custom-wallet-button:not([disabled]):hover {
          background-color: #333;
        }
      `}</style>
    </div>
  );
};

export default WalletConnectButton; 