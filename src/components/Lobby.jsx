import React, { useState } from 'react';
import { SingleChip, AllInCoin } from './Chip';
import { Play, Users, Shield, Sparkles, ChevronRight, Crown } from 'lucide-react';

const AVATARS = ['👑', '🦁', '🐯', '🐉', '💎', '🎩', '🦊', '⚡', '🦅', '🐺', '♠️', '♦️'];

export const Lobby = ({
  user,
  setUser,
  initialRoomCode,
  onCreateRoom,
  onJoinRoom
}) => {
  const [roomName, setRoomName] = useState('High Stakes Lounge');
  const [joinCode, setJoinCode] = useState(initialRoomCode || '');
  const [mode, setMode] = useState(initialRoomCode ? 'join' : 'create');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!user.name.trim()) return;
    onCreateRoom(roomName);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!user.name.trim() || !joinCode.trim()) return;
    onJoinRoom(joinCode.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorative Casino Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md bg-zinc-950/80 border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        
        {/* Title Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 text-black shadow-lg mb-3 border border-amber-200">
            <span className="text-3xl font-serif">♠️</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black font-['Cinzel'] gold-text tracking-wide uppercase">
            Royal Hold'em
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Free Online Multiplayer Poker with Friends
          </p>
        </div>

        {/* Player Profile Setup */}
        <div className="mb-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
          <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-2">
            Your Player Profile
          </label>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-amber-400 flex items-center justify-center text-2xl shadow-inner">
              {user.avatar}
            </div>
            <input
              type="text"
              placeholder="Enter your nickname..."
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="flex-1 bg-black/60 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-semibold"
              maxLength={15}
            />
          </div>

          {/* Avatar Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {AVATARS.map((av) => (
              <button
                type="button"
                key={av}
                onClick={() => setUser({ ...user, avatar: av })}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition ${
                  user.avatar === av
                    ? 'bg-amber-500 scale-110 shadow-md ring-2 ring-amber-300'
                    : 'bg-zinc-800 hover:bg-zinc-700 opacity-70 hover:opacity-100'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800 mb-5">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              mode === 'create'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Create Table
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              mode === 'join'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Join Table
          </button>
        </div>

        {/* Form Body */}
        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Table Name:
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Saturday Night Poker"
                className="w-full bg-black/60 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                maxLength={30}
              />
            </div>

            <button
              type="submit"
              disabled={!user.name.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider transition shadow-[0_4px_20px_rgba(245,158,11,0.4)] flex items-center justify-center space-x-2"
            >
              <Play size={16} fill="black" />
              <span>Create Poker Table</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Room Code:
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. 7XK9A2"
                className="w-full bg-black/60 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono tracking-widest uppercase text-center font-bold"
                maxLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={!user.name.trim() || !joinCode.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-2"
            >
              <Users size={16} />
              <span>Enter Game Room</span>
            </button>
          </form>
        )}

        {/* Feature Highlights & Chip Preview */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80">
          <div className="text-[11px] font-semibold text-zinc-400 text-center mb-2">
            5 Chip Colors + Special ALL-IN Medallion:
          </div>
          <div className="flex items-center justify-center space-x-2">
            <SingleChip denomination={1} size="sm" />
            <SingleChip denomination={10} size="sm" />
            <SingleChip denomination={25} size="sm" />
            <SingleChip denomination={50} size="sm" />
            <SingleChip denomination={100} size="sm" />
            <AllInCoin size="sm" />
          </div>
          <div className="text-[10px] text-zinc-500 text-center mt-3">
            Min 3 & Max 8 Players • Circular Luxury Felt • Real-time Multiplayer
          </div>
        </div>
      </div>
    </div>
  );
};
