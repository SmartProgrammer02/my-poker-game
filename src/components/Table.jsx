import React from 'react';
import { Seat } from './Seat';
import { Card } from './Card';
import { ChipStack, AllInCoin } from './Chip';
import { Trophy, Users, ShieldAlert } from 'lucide-react';

export const Table = ({
  tableData,
  currentUserId,
  onSit,
  winningCardSet = new Set()
}) => {
  const {
    seats = [],
    communityCards = [],
    totalPot = 0,
    currentTurnIdx,
    turnTimeRemaining,
    turnDuration,
    phase,
    winners = [],
    minPlayers = 3
  } = tableData;

  const activeSeatedCount = seats.filter(Boolean).length;
  const isShowdown = phase === 'SHOWDOWN';

  // Has anyone pushed all in?
  const anyAllIn = seats.some(s => s && s.isAllIn);

  return (
    <div className="relative w-full h-full max-h-[calc(100vh-160px)] max-w-4xl aspect-[1.18/1] sm:aspect-[1.38/1] mx-auto flex items-center justify-center p-0.5 sm:p-2">
      
      {/* Outer Circular / Oval Rim (Stitched Dark Wood / Leather Bumper) */}
      <div className="relative w-full h-full rounded-[50%] poker-table-rim flex items-center justify-center p-2.5 sm:p-4 md:p-6 border-[6px] sm:border-[10px] md:border-[12px] border-[#22160d] shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
        
        {/* Inner Brass Ring */}
        <div className="relative w-full h-full rounded-[50%] poker-table-felt border-2 md:border-4 border-amber-600/40 flex items-center justify-center overflow-hidden">
          
          {/* Subtle Felt Texture & Watermark */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
            <div className="w-64 h-64 rounded-full border border-amber-400/30 flex items-center justify-center">
              <span className="text-8xl font-serif text-amber-300 select-none">♠</span>
            </div>
            <span className="text-xs uppercase font-['Cinzel'] tracking-[0.3em] font-extrabold text-amber-200 mt-2">
              ROYAL TEXAS HOLD'EM
            </span>
          </div>

          {/* Center Stage: Pot & Community Cards */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
            
            {/* Total Pot Display with dynamic chip stacks */}
            <div className="flex flex-col items-center bg-black/65 border border-amber-500/40 px-5 py-1.5 rounded-full backdrop-blur-md shadow-2xl">
              <div className="flex items-center space-x-2">
                <span className="text-amber-400 text-xs font-semibold tracking-wider uppercase font-['Cinzel']">
                  TOTAL POT
                </span>
                <span className="text-white font-extrabold text-base md:text-lg font-['JetBrains_Mono']">
                  🪙 {totalPot.toLocaleString()}
                </span>
              </div>

              {/* Pot Chip Stack Graphic */}
              {totalPot > 0 && (
                <div className="mt-1">
                  <ChipStack amount={totalPot} isAllIn={anyAllIn} showLabel={false} size="sm" />
                </div>
              )}
            </div>

            {/* Community Cards (Flop, Turn, River) */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 p-1 sm:p-2 bg-black/30 rounded-xl border border-white/5 backdrop-blur-sm min-h-[70px] sm:min-h-[96px]">
              {communityCards.length === 0 ? (
                <div className="text-[10px] sm:text-xs text-amber-200/50 font-['Cinzel'] font-semibold tracking-widest px-2 sm:px-4 py-1.5 sm:py-2">
                  {phase === 'WAITING'
                    ? activeSeatedCount < minPlayers
                      ? `WAITING FOR ${minPlayers - activeSeatedCount} MORE`
                      : 'READY TO DEAL'
                    : 'AWAITING FLOP'}
                </div>
              ) : (
                communityCards.map((card, idx) => (
                  <div key={idx} className="animate-deal-card" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <Card
                      card={card}
                      isWinning={winningCardSet.has(card)}
                      size="md"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Waiting or Showdown Announcements */}
            {phase === 'WAITING' && activeSeatedCount < minPlayers && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-semibold animate-pulse">
                <Users size={14} />
                <span>Min {minPlayers} & Max 8 players can play. Take a seat!</span>
              </div>
            )}

            {/* Showdown Winners Banner */}
            {isShowdown && winners.length > 0 && (
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600/90 via-yellow-500/90 to-amber-600/90 border border-yellow-200 text-slate-950 font-black shadow-[0_0_30px_rgba(245,158,11,0.9)] animate-badge-pop flex items-center space-x-2 z-30">
                <Trophy size={18} className="text-yellow-950 animate-bounce" />
                <div className="flex flex-col text-center">
                  <span className="text-xs md:text-sm font-extrabold uppercase font-['Cinzel'] tracking-wide">
                    {winners.map(w => w.name).join(' & ')} WINS!
                  </span>
                  <span className="text-[11px] font-sans font-semibold text-zinc-900">
                    {winners[0]?.descr}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 8 Seats Arranged Around the Circular Table */}
        {Array.from({ length: 8 }).map((_, seatIdx) => {
          // Circular positioning: Seat 0 at bottom center (angle = PI/2)
          // Angle rotates clockwise: angle = PI/2 + (seatIdx * 2 * PI / 8)
          const angle = Math.PI / 2 + (seatIdx * 2 * Math.PI) / 8;
          
          // Oval/Circular radii percentages
          const rx = 43; // percent from center X
          const ry = 37; // percent from center Y
          
          const leftPercent = 50 + rx * Math.cos(angle);
          const topPercent = 50 + ry * Math.sin(angle);

          // Vector toward table center for bet chips positioning
          const betAngle = Math.atan2(50 - topPercent, 50 - leftPercent);

          const seatData = seats[seatIdx];
          const isCurrentUser = seatData && seatData.id === currentUserId;
          const isTurn = seatIdx === currentTurnIdx;

          return (
            <div
              key={seatIdx}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`
              }}
            >
              <Seat
                seatIndex={seatIdx}
                seatData={seatData}
                isCurrentUser={isCurrentUser}
                isTurn={isTurn}
                turnTimeRemaining={turnTimeRemaining}
                turnDuration={turnDuration}
                onSit={onSit}
                winningCardSet={winningCardSet}
                betPositionAngle={betAngle}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
