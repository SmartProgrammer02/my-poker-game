import React, { useState } from 'react';
import { Crown, Settings, X, Play, RefreshCw, DollarSign } from 'lucide-react';

export const HostModal = ({
  isOpen,
  onClose,
  tableData,
  onUpdateSettings,
  onStartHand,
  onGrantRebuy
}) => {
  if (!isOpen) return null;

  const {
    startingChips = 1000,
    smallBlind = 10,
    bigBlind = 20,
    turnDuration = 30,
    autoStartNextHand = true,
    seats = [],
    phase
  } = tableData;

  const [customStartingChips, setCustomStartingChips] = useState(startingChips);
  const [customSmallBlind, setCustomSmallBlind] = useState(smallBlind);
  const [customBigBlind, setCustomBigBlind] = useState(bigBlind);
  const [customTurnDuration, setCustomTurnDuration] = useState(turnDuration);
  const [customAutoStart, setCustomAutoStart] = useState(autoStartNextHand);

  const [rebuyPlayerId, setRebuyPlayerId] = useState('');
  const [rebuyAmount, setRebuyAmount] = useState(1000);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateSettings({
      startingChips: Number(customStartingChips),
      smallBlind: Number(customSmallBlind),
      bigBlind: Number(customBigBlind),
      turnDuration: Number(customTurnDuration),
      autoStartNextHand: customAutoStart
    });
    onClose();
  };

  const handleRebuy = (e) => {
    e.preventDefault();
    if (!rebuyPlayerId) return;
    onGrantRebuy(rebuyPlayerId, Number(rebuyAmount));
  };

  const seatedPlayers = seats.filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-zinc-900 to-black border-2 border-amber-500/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)] text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Crown size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Cinzel'] text-amber-300">
                Group Owner Settings
              </h2>
              <p className="text-xs text-zinc-400">
                Configure chip stakes, blinds, and player rebuys
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 mt-4">
          
          {/* Starting Chips (Coin Amount) */}
          <div>
            <label className="block text-xs font-semibold text-amber-200/90 mb-1">
              Starting Coin Amount (Per Player):
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[500, 1000, 2500, 5000].map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setCustomStartingChips(val)}
                  className={`py-1.5 rounded-lg text-xs font-bold font-mono transition border ${
                    customStartingChips === val
                      ? 'bg-amber-500 text-black border-amber-300'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-slate-300 border-zinc-700'
                  }`}
                >
                  🪙 {val}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="100"
              step="50"
              value={customStartingChips}
              onChange={(e) => setCustomStartingChips(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          {/* Blinds */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Small Blind:
              </label>
              <input
                type="number"
                min="1"
                value={customSmallBlind}
                onChange={(e) => {
                  const sb = Number(e.target.value);
                  setCustomSmallBlind(sb);
                  setCustomBigBlind(sb * 2);
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Big Blind:
              </label>
              <input
                type="number"
                min="2"
                value={customBigBlind}
                onChange={(e) => setCustomBigBlind(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Turn Timer Duration */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Turn Action Timer:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 45].map(seconds => (
                <button
                  type="button"
                  key={seconds}
                  onClick={() => setCustomTurnDuration(seconds)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition border ${
                    customTurnDuration === seconds
                      ? 'bg-amber-500 text-black border-amber-300 font-bold'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-slate-300 border-zinc-700'
                  }`}
                >
                  {seconds} Seconds
                </button>
              ))}
            </div>
          </div>

          {/* Auto-start next hand toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Auto-Start Hands
              </span>
              <span className="text-[11px] text-zinc-500 block">
                Deal new hand automatically when showdown finishes
              </span>
            </div>
            <input
              type="checkbox"
              checked={customAutoStart}
              onChange={(e) => setCustomAutoStart(e.target.checked)}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {/* Save Settings Button */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg"
            >
              Apply Settings
            </button>
            
            {phase === 'WAITING' && seatedPlayers.length >= 3 && (
              <button
                type="button"
                onClick={() => {
                  onStartHand();
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition flex items-center space-x-1"
              >
                <Play size={14} />
                <span>Deal Now</span>
              </button>
            )}
          </div>
        </form>

        {/* Grant Rebuy Chips Section */}
        {seatedPlayers.length > 0 && (
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center space-x-1">
              <DollarSign size={14} />
              <span>Grant Rebuy / Add Chips to Player</span>
            </h3>

            <div className="flex items-center space-x-2">
              <select
                value={rebuyPlayerId}
                onChange={(e) => setRebuyPlayerId(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-1.5 text-xs text-white"
              >
                <option value="">Select Seated Player...</option>
                {seatedPlayers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Current: {p.chips} chips)
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="100"
                step="100"
                value={rebuyAmount}
                onChange={(e) => setRebuyAmount(e.target.value)}
                className="w-24 bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-1.5 text-xs text-white font-mono"
                placeholder="Amount"
              />

              <button
                onClick={handleRebuy}
                disabled={!rebuyPlayerId}
                className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase transition"
              >
                Grant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
