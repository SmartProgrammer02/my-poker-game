import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { Table } from './components/Table';
import { Controls } from './components/Controls';
import { ActivityLog } from './components/ActivityLog';
import { HostModal } from './components/HostModal';
import { Lobby } from './components/Lobby';
import { sounds } from './components/SoundManager';
import { Crown, LogOut, Settings, Users, AlertCircle, MessageSquare, X } from 'lucide-react';

export function App() {
  // User Profile
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('poker_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name: 'Player ' + Math.floor(Math.random() * 900 + 100),
      avatar: '♠️'
    };
  });

  useEffect(() => {
    localStorage.setItem('poker_user', JSON.stringify(user));
  }, [user]);

  // Read ?room=... from URL
  const queryParams = new URLSearchParams(window.location.search);
  const urlRoomCode = queryParams.get('room');

  const [roomId, setRoomId] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [reactions, setReactions] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const socketRef = useRef(null);
  const prevPhaseRef = useRef(null);
  const prevPotRef = useRef(0);
  const prevTurnRef = useRef(-1);

  // Initialize Socket.IO connection
  useEffect(() => {
    // In dev: proxy handles /socket.io; in prod: connects to host
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to poker server:', socket.id);
    });

    socket.on('table_update', (data) => {
      setTableData(data);

      // Sound triggers based on state changes
      if (prevPhaseRef.current !== data.phase) {
        if (data.phase === 'FLOP' || data.phase === 'TURN' || data.phase === 'RIVER') {
          sounds.playCardSound();
        } else if (data.phase === 'SHOWDOWN' && data.winners.length > 0) {
          sounds.playWinSound();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
        prevPhaseRef.current = data.phase;
      }

      // Chip clink sound if pot increased
      if (data.totalPot > prevPotRef.current && prevPotRef.current > 0) {
        sounds.playChipSound();
      }
      prevPotRef.current = data.totalPot;

      // Check for turn timer tick
      const mySeat = data.seats.find(s => s && s.id === user.id);
      const isMyTurn = mySeat && data.seats.indexOf(mySeat) === data.currentTurnIdx;
      if (isMyTurn && data.turnTimeRemaining <= 5 && data.turnTimeRemaining > 0) {
        sounds.playTickSound();
      }

      // Check for all-in alert
      const hasAllInNow = data.seats.some(s => s && s.isAllIn);
      if (hasAllInNow && !prevPhaseRef.currentAllIn) {
        sounds.playAllInSound();
        prevPhaseRef.currentAllIn = true;
      }
    });

    socket.on('player_reaction', ({ userName, emoji }) => {
      const id = Math.random().toString(36).substr(2, 9);
      setReactions(prev => [...prev, { id, text: `${userName}: ${emoji}` }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 3000);
    });

    socket.on('action_error', ({ message }) => {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(null), 4000);
    });

    return () => {
      socket.disconnect();
    };
  }, [user.id]);

  // Create Room
  const handleCreateRoom = async (name) => {
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, user })
      });
      const data = await res.json();
      if (data.roomId) {
        setRoomId(data.roomId);
        window.history.pushState({}, '', `?room=${data.roomId}`);
        socketRef.current.emit('join_room', { roomId: data.roomId, user });
      }
    } catch (err) {
      console.error('Error creating room:', err);
      // Fallback direct join
      const code = 'SMART' + Math.floor(Math.random() * 90 + 10);
      setRoomId(code);
      window.history.pushState({}, '', `?room=${code}`);
      socketRef.current.emit('join_room', { roomId: code, user });
    }
  };

  // Join Room
  const handleJoinRoom = (code) => {
    const cleanCode = code.toUpperCase();
    setRoomId(cleanCode);
    window.history.pushState({}, '', `?room=${cleanCode}`);
    socketRef.current.emit('join_room', { roomId: cleanCode, user });
  };

  // Sit at Seat
  const handleSit = (seatIndex) => {
    if (!roomId) return;
    socketRef.current.emit('sit_down', {
      roomId,
      seatIndex,
      user
    });
    sounds.playChipSound();
  };

  // Stand Up
  const handleStand = () => {
    if (!roomId) return;
    socketRef.current.emit('stand_up', { roomId });
  };

  // Player Action
  const handleAction = (action, amount = 0) => {
    if (!roomId) return;
    socketRef.current.emit('player_action', {
      roomId,
      action,
      amount,
      userId: user.id
    });

    if (action === 'fold') sounds.playFoldSound();
    else if (action === 'allin') sounds.playAllInSound();
    else sounds.playChipSound();
  };

  // Host Actions
  const handleUpdateSettings = (settings) => {
    if (!roomId || !tableData) return;
    socketRef.current.emit('update_settings', {
      roomId,
      settings,
      hostId: user.id
    });
  };

  const handleStartHand = () => {
    if (!roomId || !tableData) return;
    socketRef.current.emit('start_game_manual', {
      roomId,
      hostId: user.id
    });
  };

  const handleGrantRebuy = (targetPlayerId, amount) => {
    if (!roomId || !tableData) return;
    socketRef.current.emit('grant_rebuy', {
      roomId,
      targetPlayerId,
      amount,
      hostId: user.id
    });
  };

  // Chat & Emoji
  const handleSendMessage = (message) => {
    if (!roomId) return;
    socketRef.current.emit('send_chat', { roomId, user, message });
  };

  const handleSendEmoji = (emoji) => {
    if (!roomId) return;
    socketRef.current.emit('send_chat', { roomId, user, emoji });
  };

  // Calculate winning card set for gold highlight
  const winningCardSet = new Set();
  if (tableData && tableData.winners && tableData.winners.length > 0) {
    tableData.winners.forEach(w => {
      if (w.winningCards) {
        w.winningCards.forEach(c => winningCardSet.add(c));
      }
    });
  }

  // Not in a room -> Render Lobby
  if (!roomId || !tableData) {
    return (
      <Lobby
        user={user}
        setUser={setUser}
        initialRoomCode={urlRoomCode}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
    );
  }

  const isHost = tableData.hostId === user.id;
  const mySeat = tableData.seats.find(s => s && s.id === user.id);

  return (
    <div className="h-screen max-h-screen flex flex-col bg-[#07090c] text-slate-100 overflow-hidden select-none">
      
      {/* Top Navigation Bar */}
      <header className="h-12 shrink-0 bg-zinc-950/90 border-b border-zinc-800/80 px-4 py-1.5 flex items-center justify-between z-40 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-black font-black text-base border border-yellow-200 shadow-md">
            ♠
          </div>
          <div>
            <h1 className="text-xs md:text-sm font-bold font-['Cinzel'] gold-text tracking-wide uppercase leading-tight">
              {tableData.tableName}
            </h1>
            <div className="flex items-center space-x-2 text-[10px] md:text-[11px] text-zinc-400 leading-tight">
              <span className="font-mono text-amber-300 font-semibold">Room: {roomId}</span>
              <span>•</span>
              <span className="text-zinc-300">Blinds: {tableData.smallBlind}/{tableData.bigBlind}</span>
              <span>•</span>
              <span>Stack: {tableData.startingChips}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 md:space-x-2">
          {/* Mobile Chat / Ledger Toggle Button */}
          <button
            onClick={() => setIsChatOpen(prev => !prev)}
            className={`lg:hidden flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition ${
              isChatOpen
                ? 'bg-amber-500 text-black border-amber-300'
                : 'bg-zinc-800 text-amber-300 border-zinc-700'
            }`}
            title="Chat & Ledger"
          >
            <MessageSquare size={13} />
            <span>Chat</span>
          </button>

          {/* Host Settings Button */}
          {isHost && (
            <button
              onClick={() => setIsHostModalOpen(true)}
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-md"
              title="Host Controls"
            >
              <Crown size={13} />
              <span className="hidden sm:inline">Owner Panel</span>
              <span className="sm:hidden">Owner</span>
            </button>
          )}

          {/* Stand Up / Leave Table */}
          {mySeat ? (
            <button
              onClick={handleStand}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition border border-zinc-700 flex items-center space-x-1"
            >
              <LogOut size={13} />
              <span>Stand</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setRoomId(null);
                setTableData(null);
                window.history.pushState({}, '', window.location.pathname);
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition border border-zinc-700"
            >
              Exit
            </button>
          )}
        </div>
      </header>

      {/* Floating Reaction Toasts */}
      <div className="fixed top-14 right-6 z-50 flex flex-col space-y-2 pointer-events-none">
        {reactions.map(r => (
          <div
            key={r.id}
            className="px-4 py-2 rounded-2xl bg-black/85 border border-amber-500/50 text-amber-300 font-bold text-sm shadow-2xl backdrop-blur-md animate-badge-pop"
          >
            {r.text}
          </div>
        ))}
      </div>

      {/* Action Error Alert Toast */}
      {errorMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs font-bold shadow-2xl flex items-center space-x-2 animate-bounce">
          <AlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Game Stage */}
      <main className="flex-1 min-h-0 flex flex-row items-stretch justify-between p-1 sm:p-2 gap-2.5 max-w-[1700px] mx-auto w-full overflow-hidden relative">
        
        {/* Table + Controls (Always visible, full width on mobile, flex-1 on desktop) */}
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-between overflow-hidden h-full">
          <div className="flex-1 min-h-0 w-full flex items-center justify-center relative overflow-hidden">
            <Table
              tableData={tableData}
              currentUserId={user.id}
              onSit={handleSit}
              winningCardSet={winningCardSet}
            />
          </div>

          {/* Player Betting Action Controls */}
          <div className="w-full max-w-4xl shrink-0 mt-0.5 sm:mt-1">
            <Controls
              tableData={tableData}
              currentUserId={user.id}
              onAction={handleAction}
              winningCardSet={winningCardSet}
            />
          </div>
        </div>

        {/* Desktop Sidebar: Ledger / Activity Log (visible only on lg screens >= 1024px) */}
        <div className="hidden lg:flex lg:w-72 xl:w-80 shrink-0 h-full flex-col overflow-hidden">
          <ActivityLog
            logs={tableData.logs || []}
            roomId={roomId}
            onSendMessage={handleSendMessage}
            onSendEmoji={handleSendEmoji}
          />
        </div>

        {/* Mobile Overlay Drawer: Table Chat & Ledger */}
        {isChatOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end p-2 animate-fade-in">
            <div className="w-full max-w-md mx-auto h-[75vh] bg-zinc-950 border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-2.5 border-b border-zinc-800 bg-zinc-900/90">
                <span className="text-xs font-bold text-amber-300 uppercase font-['Cinzel'] flex items-center space-x-1.5">
                  <MessageSquare size={14} />
                  <span>Table Chat & Ledger</span>
                </span>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ActivityLog
                  logs={tableData.logs || []}
                  roomId={roomId}
                  onSendMessage={handleSendMessage}
                  onSendEmoji={handleSendEmoji}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Host Settings Modal */}
      <HostModal
        isOpen={isHostModalOpen}
        onClose={() => setIsHostModalOpen(false)}
        tableData={tableData}
        onUpdateSettings={handleUpdateSettings}
        onStartHand={handleStartHand}
        onGrantRebuy={handleGrantRebuy}
      />
    </div>
  );
}

export default App;
