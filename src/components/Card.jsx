import React from 'react';

const SUIT_SYMBOLS = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣'
};

const SUIT_COLORS = {
  s: 'text-zinc-900',
  h: 'text-rose-600',
  d: 'text-rose-600',
  c: 'text-emerald-700'
};

export const Card = ({ card, isWinning = false, size = 'md', className = '' }) => {
  // If card is hidden/unrevealed ('??')
  if (!card || card === '??') {
    const backSizes = {
      xs: 'w-9 h-13',
      sm: 'w-12 h-17',
      md: 'w-16 h-23',
      lg: 'w-20 h-28',
      xl: 'w-24 h-34'
    }[size] || 'w-16 h-23';

    return (
      <div
        className={`relative ${backSizes} rounded-lg select-none shadow-xl border-2 border-amber-500/70 overflow-hidden transform transition-all duration-300 ${className}`}
        style={{
          background: 'linear-gradient(135deg, #0d2342 0%, #05101e 100%)'
        }}
      >
        {/* Ornate Gold Geometric Pattern on Card Back */}
        <div className="absolute inset-1 rounded border border-amber-400/50 flex items-center justify-center p-1 bg-[radial-gradient(#dfb15b_1.5px,transparent_1.5px)] [background-size:7px_7px] opacity-85">
          <div className="w-7 h-7 rounded-full border border-amber-400/90 flex items-center justify-center shadow-[0_0_10px_rgba(223,177,91,0.6)] bg-black/40">
            <span className="text-amber-300 text-sm font-serif font-black leading-none">♠</span>
          </div>
        </div>
      </div>
    );
  }

  const rank = card.slice(0, -1).replace('T', '10');
  const suit = card.slice(-1).toLowerCase();
  const symbol = SUIT_SYMBOLS[suit] || '♠';
  const colorClass = SUIT_COLORS[suit] || 'text-zinc-900';

  const sizeClasses = {
    xs: 'w-9 h-13 text-[10px] rounded-md p-1',
    sm: 'w-12 h-17 text-xs rounded-md p-1',
    md: 'w-16 h-23 text-sm rounded-lg p-1.5',
    lg: 'w-20 h-28 text-base rounded-xl p-2',
    xl: 'w-24 h-34 text-lg rounded-2xl p-2.5'
  }[size] || 'w-16 h-23 text-sm rounded-lg p-1.5';

  const isFaceCard = ['J', 'Q', 'K', 'A'].includes(rank);

  return (
    <div
      className={`relative ${sizeClasses} select-none bg-gradient-to-b from-white via-slate-50 to-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.65)] border transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between font-['Cinzel'] ${
        isWinning
          ? 'border-amber-400 ring-4 ring-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.9)] scale-105 z-20'
          : 'border-slate-300 hover:border-amber-400'
      } ${className}`}
    >
      {/* Top Left pip */}
      <div className={`flex flex-col items-center leading-none ${colorClass} font-black`}>
        <span className="text-xs md:text-sm tracking-tighter font-extrabold">{rank}</span>
        <span className="text-[10px] md:text-xs leading-none mt-0.5">{symbol}</span>
      </div>

      {/* Center Art / Big Symbol */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {isFaceCard ? (
          <div className="flex flex-col items-center justify-center">
            <span className={`text-2xl md:text-3xl font-serif font-black ${colorClass} opacity-90 leading-none`}>
              {symbol}
            </span>
            <span className="text-[8px] md:text-[9px] font-sans font-black text-amber-900/90 tracking-widest uppercase mt-0.5">
              {rank === 'A' ? 'ACE' : rank === 'K' ? 'KING' : rank === 'Q' ? 'QUEEN' : 'JACK'}
            </span>
          </div>
        ) : (
          <span className={`text-2xl md:text-3xl font-serif ${colorClass} opacity-90 leading-none`}>
            {symbol}
          </span>
        )}
      </div>

      {/* Bottom Right inverted pip */}
      <div className={`flex flex-col items-center leading-none rotate-180 self-end ${colorClass} font-black`}>
        <span className="text-xs md:text-sm tracking-tighter font-extrabold">{rank}</span>
        <span className="text-[10px] md:text-xs leading-none mt-0.5">{symbol}</span>
      </div>

      {/* Subtle glossy sheen */}
      <div className="absolute inset-0 rounded bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none" />
    </div>
  );
};
