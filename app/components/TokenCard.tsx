import React from 'react';

interface Token {
  icon: React.ReactNode;
  name: string;
  symbol: string;
  value: string;
  valueReadOnly?: boolean;
  price: string;
  marketCap: string;
  liquidity: string;
  buyVolume24h: string;
  sellVolume24h: string;
  changePercent: string; // e.g. '+3.76%'
  changePositive: boolean;
}

interface TokenCardProps {
  type: 'FROM' | 'TO';
  token: Token;
  onValueChange?: (value: string) => void;
  onSelectToken: () => void;
}

const TokenCard: React.FC<TokenCardProps> = ({
  type,
  token,
  onValueChange,
  onSelectToken
}) => {
  return (
    <div className="w-full max-w-2xl rounded-2xl p-7 shadow-xl bg-gradient-to-br from-[#fcae5a] to-[#fcd670] relative border border-orange-200" style={{minHeight: 370}}>
      {/* Type label */}
      <div className="font-extrabold text-2xl text-white mb-4 tracking-wide uppercase">{type}</div>
      {/* Change badge */}
      <div className="absolute top-7 right-7 flex items-center gap-1">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-base font-semibold bg-green-100 text-green-700">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M4 12l6 6 10-14" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {token.changePercent}
        </span>
      </div>
      {/* Main row */}
      <div className="flex items-center gap-6 mb-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-md border-4 border-[#ffe0a3]" style={{ overflow: 'hidden' }}>
          {token.icon}
        </div>
        {/* Name and symbol */}
        <div className="flex flex-col justify-center min-w-[120px]">
          <button onClick={onSelectToken} className="flex items-center gap-2">
            <span className="text-4xl font-extrabold text-[#232323] leading-none">{token.symbol}</span>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="#232323" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="text-lg text-[#6b7280] font-medium mt-1">{token.name}</span>
        </div>
        {/* Value input */}
        <div className="flex-1 flex justify-end">
          <input
            type="text"
            value={token.value}
            onChange={(e) => onValueChange?.(e.target.value)}
            readOnly={token.valueReadOnly}
            placeholder="0"
            className="text-right text-3xl font-extrabold bg-[#fcae5a]/80 rounded-lg px-6 py-3 outline-none text-white placeholder-white/60 w-48 border-2 border-[#fcd670] focus:ring-2 focus:ring-orange-300 transition"
          />
        </div>
      </div>
      {/* Info boxes */}
      <div className="grid grid-cols-2 gap-5 mt-2">
        <div className="rounded-xl border border-[#fcd670] bg-white/70 p-5 text-left flex flex-col justify-center min-h-[70px]">
          <div className="text-base text-[#6b7280] font-semibold mb-1">Market Cap</div>
          <div className="text-2xl font-extrabold text-[#232323]">{token.marketCap}</div>
        </div>
        <div className="rounded-xl border border-[#fcd670] bg-white/70 p-5 text-left flex flex-col justify-center min-h-[70px]">
          <div className="text-base text-[#6b7280] font-semibold mb-1">Liquidity</div>
          <div className="text-2xl font-extrabold text-[#232323]">{token.liquidity}</div>
        </div>
        <div className="rounded-xl border border-[#fcd670] bg-white/70 p-5 text-left flex flex-col justify-center min-h-[70px]">
          <div className="text-base text-[#6b7280] font-semibold mb-1">24h Buy Volume</div>
          <div className="text-2xl font-extrabold text-[#232323]">{token.buyVolume24h}</div>
        </div>
        <div className="rounded-xl border border-[#fcd670] bg-white/70 p-5 text-left flex flex-col justify-center min-h-[70px]">
          <div className="text-base text-[#6b7280] font-semibold mb-1">24h Sell Volume</div>
          <div className="text-2xl font-extrabold text-[#232323]">{token.sellVolume24h}</div>
        </div>
      </div>
    </div>
  );
};

export default TokenCard; 