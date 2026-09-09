import React from 'react';

/**
 * Custom 5-Color Denomination Chips + Special "ALL IN" Medallion
 * Red: 1
 * White: 10
 * Blue: 25
 * Black: 50
 * Golden: 100
 * Special: ALL IN
 */

export const CHIP_CONFIGS = {
  1: {
    value: 1,
    name: 'Red',
    bg: 'from-red-600 to-red-800',
    border: 'border-red-400',
    edge: 'border-dashed border-red-200',
    text: 'text-white',
    centerBg: 'bg-red-950',
    shadow: 'shadow-[0_4px_8px_rgba(220,38,38,0.5)]'
  },
  10: {
    value: 10,
    name: 'White',
    bg: 'from-slate-100 to-slate-300',
    border: 'border-slate-400',
    edge: 'border-dashed border-slate-700',
    text: 'text-slate-900',
    centerBg: 'bg-slate-200',
    shadow: 'shadow-[0_4px_8px_rgba(241,245,249,0.3)]'
  },
  25: {
    value: 25,
    name: 'Blue',
    bg: 'from-blue-600 to-blue-800',
    border: 'border-blue-400',
    edge: 'border-dashed border-blue-200',
    text: 'text-white',
    centerBg: 'bg-blue-950',
    shadow: 'shadow-[0_4px_8px_rgba(37,99,235,0.5)]'
  },
  50: {
    value: 50,
    name: 'Black',
    bg: 'from-zinc-800 to-zinc-950',
    border: 'border-zinc-500',
    edge: 'border-dashed border-zinc-400',
    text: 'text-zinc-100',
    centerBg: 'bg-black',
    shadow: 'shadow-[0_4px_8px_rgba(0,0,0,0.8)]'
  },
  100: {
    value: 100,
    name: 'Golden',
    bg: 'from-amber-400 via-yellow-300 to-amber-600',
    border: 'border-yellow-200',
    edge: 'border-dashed border-amber-900',
    text: 'text-amber-950',
    centerBg: 'bg-gradient-to-r from-yellow-200 to-amber-400',
    shadow: 'shadow-[0_4px_12px_rgba(245,158,11,0.6)]'
  }
};

export const SingleChip = ({ denomination, size = 'md' }) => {
  const config = CHIP_CONFIGS[denomination] || CHIP_CONFIGS[100];
  
  const sizeClasses = {
    sm: 'w-7 h-7 text-[9px] border-[2px]',
    md: 'w-9 h-9 text-[11px] border-[3px]',
    lg: 'w-12 h-12 text-sm border-[4px]'
  }[size] || 'w-9 h-9 text-[11px] border-[3px]';

  return (
    <div
      className={`relative rounded-full select-none cursor-pointer flex items-center justify-center font-bold font-['Outfit'] transition-transform hover:scale-110 active:scale-95 bg-gradient-to-br ${config.bg} ${config.border} ${config.shadow} ${sizeClasses}`}
      style={{
        boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.4), inset 0 -2px 3px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.5)'
      }}
    >
      {/* Outer edge stripes */}
      <div className={`absolute inset-0 rounded-full ${config.edge} border-2 opacity-50 pointer-events-none`} />

      {/* Inner core badge */}
      <div className={`w-3/4 h-3/4 rounded-full ${config.centerBg} ${config.text} flex items-center justify-center shadow-inner font-extrabold tracking-tight`}>
        {config.value >= 1000 ? `${config.value / 1000}k` : config.value}
      </div>
    </div>
  );
};

// Exclusive Special "ALL IN" Medallion / Coin
export const AllInCoin = ({ size = 'md' }) => {
  const isLarge = size === 'lg';
  return (
    <div
      className={`relative select-none flex items-center justify-center font-black tracking-wider uppercase font-['Cinzel'] animate-allin ${
        isLarge ? 'w-16 h-16 text-xs' : 'w-11 h-11 text-[9px]'
      } rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 border-2 border-yellow-100 shadow-[0_0_20px_rgba(245,158,11,0.9)]`}
      style={{
        clipPath: 'polygon(50% 0%, 85% 15%, 100% 50%, 85% 85%, 50% 100%, 15% 85%, 0% 50%, 15% 15%)'
      }}
      title="ALL IN!"
    >
      <div className="absolute inset-[3px] rounded-full bg-gradient-to-t from-red-950 via-zinc-900 to-amber-950 flex flex-col items-center justify-center text-center text-amber-300 border border-amber-500/40">
        <span className="text-[8px] leading-none text-yellow-400">★</span>
        <span className="font-extrabold text-white tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          ALL IN
        </span>
      </div>
    </div>
  );
};

// Breakdown any integer amount into colored chips
export const getChipBreakdown = (amount) => {
  let remaining = Math.max(0, amount);
  const chips = [];
  const denoms = [100, 50, 25, 10, 1];

  for (const d of denoms) {
    const count = Math.floor(remaining / d);
    if (count > 0) {
      // Show up to 4 stacked representations per denomination
      const visualCount = Math.min(count, 4);
      for (let i = 0; i < visualCount; i++) {
        chips.push(d);
      }
      remaining %= d;
    }
  }
  return chips.slice(0, 10); // cap visual stack to avoid overflow
};

// 3D Visual Stack of Chips for table bets and pot
export const ChipStack = ({ amount, isAllIn = false, showLabel = true, size = 'sm' }) => {
  if (!amount && !isAllIn) return null;

  const chips = getChipBreakdown(amount);

  return (
    <div className="flex flex-col items-center select-none animate-chip-drop">
      <div className="flex items-center space-x-[-12px] py-1">
        {chips.map((denom, i) => (
          <div
            key={i}
            style={{
              transform: `translateY(-${i * 2}px)`,
              zIndex: i + 1
            }}
          >
            <SingleChip denomination={denom} size={size} />
          </div>
        ))}

        {isAllIn && (
          <div className="ml-1 z-30" style={{ transform: 'scale(0.95)' }}>
            <AllInCoin size={size === 'lg' ? 'lg' : 'md'} />
          </div>
        )}
      </div>

      {showLabel && (
        <div className="px-2 py-0.5 mt-0.5 rounded-full bg-black/80 border border-amber-500/30 text-amber-300 text-[11px] font-bold font-['JetBrains_Mono'] tracking-tight shadow-md flex items-center space-x-1">
          <span>{amount.toLocaleString()}</span>
          {isAllIn && <span className="text-red-400 font-extrabold text-[9px] uppercase">ALL IN</span>}
        </div>
      )}
    </div>
  );
};
