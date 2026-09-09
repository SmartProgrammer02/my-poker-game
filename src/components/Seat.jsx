import React from 'react';
import { Card } from './Card';
import { ChipStack, AllInCoin } from './Chip';
import { Crown, Timer, User } from 'lucide-react';

export const Seat = ({
  seatIndex,
  seatData,
  isCurrentUser,
  isTurn,
  turnTimeRemaining,
  turnDuration,
  onSit,
  winningCardSet = new Set(),
  betPositionAngle = 0
}) => {
  if (!seatData) {
    // Empty Seat with "SIT" button
    return (
      <div className="flex flex-col items-center justify-center group">
        <button
          onClick={() => onSit(seatIndex)}
          className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 border-dashed border-amber-400/40 bg-black/50 hover:bg-amber-500/20 hover:border-amber-300 transition-all duration-300 flex flex-col items-center justify-center text-amber-200/70 hover:text-amber-200 hover:scale-105 shadow-md backdrop-blur-sm"
        >
          <span className="text-xs sm:text-base md:text-lg font-black leading-none">+</span>
          <span className="text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-wider font-['Cinzel']">
            SIT {seatIndex + 1}
          </span>
        </button>
      </div>
    );
  }

  const {
    name,
    avatar,
    chips,
    currentBet,
    folded,
    isAllIn,
    isDealer,
    isSmallBlind,
    isBigBlind,
    isHost,
    holeCards = [],
    hasCards
  } = seatData;

  return (
    <div className={`relative flex flex-col items-center select-none ${folded ? 'opacity-40 grayscale-[40%]' : ''}`}>
      {/* Turn Countdown Ring / Glow */}
      <div
        className={`relative w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full p-0.5 transition-all duration-300 ${
          isTurn
            ? 'ring-2 sm:ring-3 md:ring-4 ring-amber-400 ring-offset-1 sm:ring-offset-2 ring-offset-black/80 shadow-[0_0_20px_rgba(245,158,11,0.8)] scale-105'
            : 'ring-1 ring-zinc-700/80'
        }`}
      >
        {/* Circular Podium Container */}
        <div className="w-full h-full rounded-full bg-gradient-to-b from-zinc-800 to-zinc-950 border border-zinc-700/60 flex flex-col items-center justify-center overflow-hidden shadow-inner relative">
          
          {/* Avatar / Icon */}
          <div className="text-base sm:text-xl md:text-2xl filter drop-shadow">
            {avatar || '♠️'}
          </div>

          {/* Host Crown Icon */}
          {isHost && (
            <div className="absolute top-0.5 text-amber-400 filter drop-shadow">
              <Crown size={10} fill="#dfb15b" />
            </div>
          )}

          {/* Turn Timer overlay text if active */}
          {isTurn && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center">
              <span className="text-amber-300 font-extrabold text-[10px] sm:text-xs md:text-sm font-['JetBrains_Mono'] animate-pulse">
                {turnTimeRemaining}s
              </span>
            </div>
          )}
        </div>

        {/* Dealer Button Badge */}
        {isDealer && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 border border-amber-100 text-slate-900 text-[9px] font-black flex items-center justify-center shadow-lg transform -rotate-12"
            title="Dealer Button"
          >
            D
          </div>
        )}

        {/* Small Blind Badge */}
        {isSmallBlind && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 border border-blue-200 text-white text-[8px] font-black flex items-center justify-center shadow-lg">
            SB
          </div>
        )}

        {/* Big Blind Badge */}
        {isBigBlind && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-600 border border-purple-200 text-white text-[8px] font-black flex items-center justify-center shadow-lg">
            BB
          </div>
        )}

        {/* All-In Badge on Podium */}
        {isAllIn && (
          <div className="absolute -bottom-2 inset-x-0 flex justify-center z-20">
            <div className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white text-[8px] font-black tracking-widest uppercase shadow-md border border-amber-300 animate-pulse">
              ALL IN
            </div>
          </div>
        )}
      </div>

      {/* Player Info Plaque */}
      <div className="mt-0.5 px-1 sm:px-2 py-0.5 rounded bg-black/90 border border-zinc-700/80 shadow-md flex flex-col items-center min-w-[55px] sm:min-w-[75px] max-w-[80px] sm:max-w-[100px] text-center backdrop-blur-sm z-10">
        <span className="text-[8px] sm:text-[10px] md:text-[11px] font-bold text-slate-100 truncate max-w-[50px] sm:max-w-[90px]">
          {name}
        </span>
        <div className="flex items-center space-x-0.5 sm:space-x-1 text-amber-400 font-['JetBrains_Mono'] font-extrabold text-[8px] sm:text-[9px] md:text-[10px]">
          <span className="text-yellow-400 text-[8px] sm:text-[9px]">🪙</span>
          <span>{chips.toLocaleString()}</span>
        </div>
      </div>

      {/* Hole Cards */}
      {hasCards && (
        <div className="absolute -top-6 sm:-top-7 md:-top-8 flex items-center justify-center space-x-[-8px] sm:space-x-[-10px] z-20 transition-transform">
          {holeCards.map((card, idx) => (
            <div
              key={idx}
              className={`transform transition-all ${
                idx === 0 ? '-rotate-6 hover:-rotate-12' : 'rotate-6 hover:rotate-12'
              } ${isTurn ? 'scale-105' : ''}`}
            >
              <Card
                card={card}
                isWinning={winningCardSet.has(card)}
                size="sm"
              />
            </div>
          ))}
        </div>
      )}

      {/* Current Bet Chips toward center */}
      {currentBet > 0 && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            transform: `translate(${Math.cos(betPositionAngle) * 55}px, ${Math.sin(betPositionAngle) * 55}px)`
          }}
        >
          <ChipStack amount={currentBet} isAllIn={isAllIn} size="sm" />
        </div>
      )}
    </div>
  );
};
