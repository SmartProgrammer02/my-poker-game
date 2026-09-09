import React, { useState } from 'react';
import { MessageSquare, Share2, Volume2, VolumeX, Copy, Check, Send } from 'lucide-react';
import { sounds } from './SoundManager';

export const ActivityLog = ({
  logs = [],
  roomId,
  onSendMessage,
  onSendEmoji
}) => {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [chatText, setChatText] = useState('');
  const [activeTab, setActiveTab] = useState('log'); // 'log' | 'chat'

  const copyInviteLink = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    onSendMessage(chatText.trim());
    setChatText('');
  };

  const EMOJIS = ['🔥', '💰', '👏', '😱', '🏆', '♠️', '😎', '💀'];

  return (
    <div className="w-full bg-zinc-950/90 border border-zinc-800 rounded-2xl p-2.5 flex flex-col h-full shadow-xl backdrop-blur-md overflow-hidden">
      
      {/* Top Bar: Room Link + Sound */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800 gap-2 shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('log')}
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition ${
              activeTab === 'log' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Game Log
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition ${
              activeTab === 'chat' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Table Chat
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Copy invite button */}
          <button
            onClick={copyInviteLink}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-bold transition border border-zinc-700 shadow-sm"
            title="Copy Invite Link"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
            <span>{copied ? 'Copied!' : `Room ${roomId}`}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition border border-zinc-700"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-1 font-mono text-[11px] pr-1">
        {logs.length === 0 ? (
          <div className="text-zinc-500 italic text-center py-6">
            Waiting for game activity...
          </div>
        ) : (
          logs.map((log) => {
            const isAllIn = log.text.includes('ALL IN');
            const isWin = log.text.includes('🏆');
            const isChat = log.text.startsWith('💬');

            return (
              <div
                key={log.id}
                className={`py-0.5 px-1.5 rounded ${
                  isAllIn
                    ? 'bg-red-950/60 text-red-300 font-bold border-l-2 border-red-500'
                    : isWin
                    ? 'bg-amber-950/60 text-amber-200 font-bold border-l-2 border-amber-400'
                    : isChat
                    ? 'text-cyan-300'
                    : 'text-zinc-300'
                }`}
              >
                <span className="text-zinc-600 text-[10px] mr-1.5">[{log.time}]</span>
                <span>{log.text}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Reaction Emojis */}
      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-1 overflow-x-auto pb-1">
        {EMOJIS.map((em) => (
          <button
            key={em}
            onClick={() => onSendEmoji(em)}
            className="hover:scale-125 transition-transform p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-sm"
          >
            {em}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      {activeTab === 'chat' && (
        <form onSubmit={handleSendChat} className="mt-1 flex items-center space-x-1.5">
          <input
            type="text"
            placeholder="Type message..."
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
            maxLength={120}
          />
          <button
            type="submit"
            className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition"
          >
            <Send size={13} />
          </button>
        </form>
      )}
    </div>
  );
};
