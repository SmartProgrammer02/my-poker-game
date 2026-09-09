import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { AllInCoin, SingleChip } from './Chip';
import { ChevronUp, ChevronDown, Check, X, ShieldAlert } from 'lucide-react';

export const Controls = ({
  tableData,
  currentUserId,
  onAction,
  winningCardSet = new Set()
}) => {
  const {
    seats = [],
    currentTurnIdx,
    currentBet = 0,
    minRaise = 20,
    totalPot = 0,
    phase
  } = tableData;

  const currentSeat = seats.find(s => s && s.id === currentUserId);
  const mySeatIdx = seats.indexOf(currentSeat);
  const isMyTurn = mySeatIdx !== -1 && mySeatIdx === currentTurnIdx && phase !== 'WAITING' && phase !== 'SHOWDOWN';

  const playerChips = currentSeat ? currentSeat.chips : 0;
  const myCurrentBet = currentSeat ? currentSeat.currentBet : 0;
  const callDiff = currentBet - myCurrentBet;
  const canCheck = callDiff <= 0;
  const canCall = callDiff > 0 && playerChips > 0;
  const actualCallAmount = Math.min(playerChips, callDiff);

  // Minimum raise allowed
  const minRaiseTarget = Math.min(playerChips + myCurrentBet, currentBet + minRaise);
  const maxRaiseTarget = playerChips + myCurrentBet;

  const [raiseValue, setRaiseValue] = useState(minRaiseTarget);

  useEffect(() => {
    setRaiseValue(minRaiseTarget);
  }, [minRaiseTarget]);

  if (!currentSeat) {
    return (
      <div className="bg-black/80 border border-zinc-800 rounded-xl py-2 px-4 text-center text-zinc-400 text-xs backdrop-blur-md shadow-lg flex items-center justify-center space-x-2">
        <span>👁️</span>
        <span className="text-zinc-300 font-semibold">You are spectating. Click any empty "SIT" button around the table to join the game!</span>
      </div>
    );
  }

  const holeCards = currentSeat.holeCards || [];
  const hasHoleCards = holeCards.length === 2 && holeCards[0] !== '??';

  return (
    <div className={`relative bg-gradient-to-b from-zinc-900/95 to-black/95 border rounded-2xl p-2.5 backdrop-blur-md shadow-2xl transition-all flex flex-col md:flex-row items-center gap-2.5 ${
      isMyTurn ? 'border-amber-400/90 shadow-[0_0_25px_rgba(245,158,11,0.5)] ring-1 ring-amber-400/60' : 'border-zinc-800 opacity-90'
    }`}>
      
      {/* Player's Large Hero Cards Display */}
      {hasHoleCards && (
        <div className="flex items-center space-x-2 bg-black/60 p-1.5 rounded-xl border border-zinc-800 shrink-0">
          <div className="flex items-center space-x-1.5">
            {holeCards.map((card, idx) => (
              <div key={idx} className={currentSeat.folded ? 'opacity-40 grayscale' : ''}>
                <Card
                  card={card}
                  isWinning={winningCardSet.has(card)}
                  size="md" // 64px x 92px! Highly visible and clear!
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-center px-1 text-left min-w-[75px]">
            <span className="text-[10px] uppercase tracking-wider text-amber-400/80 font-bold font-['Cinzel']">
              Your Cards
            </span>
            <span className="text-xs font-black text-white truncate max-w-[85px]">
              {currentSeat.name}
            </span>
            <span className="text-[11px] font-extrabold text-yellow-400 font-mono">
              🪙 {currentSeat.chips.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Main Controls Area */}
      <div className="flex-1 w-full min-w-0 flex flex-col justify-center gap-1.5">
        
        {/* Status notice if folded or all-in */}
        {currentSeat.folded ? (
          <div className="py-3 px-4 rounded-xl bg-red-950/40 border border-red-900/50 text-red-300 text-xs font-semibold flex items-center justify-center space-x-2">
            <span className="font-bold text-red-400 uppercase">Hand Folded</span>
            <span className="text-zinc-400">• Waiting for next hand...</span>
          </div>
        ) : currentSeat.isAllIn ? (
          <div className="py-2.5 px-4 rounded-xl bg-amber-950/40 border border-amber-600/50 text-amber-300 text-xs font-semibold flex items-center justify-center space-x-2 animate-pulse">
            <AllInCoin size="sm" />
            <span className="font-extrabold uppercase tracking-widest font-['Cinzel']">You are ALL IN!</span>
          </div>
        ) : (
          <>
            {/* Presets & Slider Row */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setRaiseValue(minRaiseTarget)}
                  className="py-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-[11px] font-bold transition border border-zinc-700"
                >
                  Min
                </button>
                <button
                  onClick={() => setRaiseValue(Math.min(maxRaiseTarget, Math.floor(currentBet * 2.5)))}
                  className="py-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-[11px] font-bold transition border border-zinc-700"
                >
                  2.5x
                </button>
                <button
                  onClick={() => setRaiseValue(Math.min(maxRaiseTarget, Math.max(minRaiseTarget, Math.floor(totalPot * 0.5) + currentBet)))}
                  className="py-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-[11px] font-bold transition border border-zinc-700"
                >
                  1/2 Pot
                </button>
                <button
                  onClick={() => setRaiseValue(Math.min(maxRaiseTarget, Math.max(minRaiseTarget, totalPot + currentBet)))}
                  className="py-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-[11px] font-bold transition border border-zinc-700"
                >
                  Pot
                </button>
                <button
                  onClick={() => setRaiseValue(maxRaiseTarget)}
                  className="py-1 px-2 rounded-lg bg-red-900/80 hover:bg-red-800 text-red-200 text-[11px] font-black uppercase transition border border-red-700"
                >
                  Max
                </button>
              </div>

              {/* Slider */}
              {playerChips > callDiff && (
                <div className="flex-1 flex items-center space-x-2 px-1 min-w-[120px]">
                  <input
                    type="range"
                    min={minRaiseTarget}
                    max={maxRaiseTarget}
                    step={minRaise || 10}
                    value={raiseValue}
                    onChange={(e) => setRaiseValue(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="bg-black/90 px-2 py-0.5 rounded border border-amber-500/40 text-amber-300 font-mono font-black text-xs shrink-0">
                    🪙 {raiseValue.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-4 gap-1.5">
              {/* FOLD */}
              <button
                onClick={() => onAction('fold')}
                disabled={!isMyTurn}
                className="py-2 md:py-2.5 rounded-xl bg-gradient-to-b from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 disabled:opacity-40 text-white font-extrabold text-xs tracking-wider uppercase transition shadow-md border border-red-500/40 active:scale-95 flex flex-col items-center justify-center font-['Cinzel']"
              >
                FOLD
              </button>

              {/* CHECK / CALL */}
              {canCheck ? (
                <button
                  onClick={() => onAction('check')}
                  disabled={!isMyTurn}
                  className="py-2 md:py-2.5 rounded-xl bg-gradient-to-b from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 disabled:opacity-40 text-white font-extrabold text-xs tracking-wider uppercase transition shadow-md border border-emerald-400/40 active:scale-95 flex flex-col items-center justify-center font-['Cinzel']"
                >
                  CHECK
                </button>
              ) : (
                <button
                  onClick={() => onAction('call')}
                  disabled={!isMyTurn}
                  className="py-2 md:py-2.5 rounded-xl bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:opacity-40 text-white font-extrabold text-xs tracking-wider uppercase transition shadow-md border border-blue-400/40 active:scale-95 flex items-center justify-center space-x-1 font-['Cinzel']"
                >
                  <span>CALL</span>
                  <span className="text-[10px] font-mono opacity-90">({actualCallAmount})</span>
                </button>
              )}

              {/* RAISE */}
              <button
                onClick={() => onAction('raise', raiseValue)}
                disabled={!isMyTurn || playerChips <= callDiff}
                className="py-2 md:py-2.5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 disabled:opacity-40 text-slate-950 font-black text-xs tracking-wider uppercase transition shadow-md border border-amber-300/60 active:scale-95 flex items-center justify-center space-x-1 font-['Cinzel']"
              >
                <span>RAISE</span>
                <span className="text-[10px] font-mono">({raiseValue})</span>
              </button>

              {/* SPECIAL ALL IN */}
              <button
                onClick={() => onAction('allin')}
                disabled={!isMyTurn || playerChips <= 0}
                className="py-2 md:py-2.5 rounded-xl bg-gradient-to-b from-amber-400 via-red-600 to-red-800 hover:from-amber-300 hover:via-red-500 hover:to-red-700 disabled:opacity-40 text-white font-black text-xs tracking-wider uppercase transition shadow-md border border-yellow-200 active:scale-95 flex items-center justify-center space-x-1 font-['Cinzel']"
              >
                <span>ALL IN</span>
                <span className="text-[10px] font-mono font-bold">({playerChips})</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
