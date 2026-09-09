const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const RoomManager = require('./RoomManager');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager(io);
roomManager.startHeartbeat();

// API endpoint to create a room
app.post('/api/rooms', (req, res) => {
  const { name, user } = req.body;
  if (!user || !user.id) {
    return res.status(400).json({ error: 'User is required' });
  }
  const roomId = roomManager.createRoom(name, user);
  res.json({ roomId });
});

// API endpoint to check room status
app.get('/api/rooms/:roomId', (req, res) => {
  const table = roomManager.getRoom(req.params.roomId);
  if (!table) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    roomId: table.id,
    tableName: table.name,
    minPlayers: table.minPlayers,
    maxPlayers: table.maxPlayers,
    seatedCount: table.seats.filter(Boolean).length
  });
});

// Serve frontend in production if built
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Socket.IO Events
io.on('connection', (socket) => {
  // Join Room
  socket.on('join_room', ({ roomId, user }) => {
    if (!roomId || !user) return;
    roomManager.joinRoom(socket, roomId, user);
  });

  // Sit at a Seat
  socket.on('sit_down', ({ roomId, seatIndex, user }) => {
    const table = roomManager.getRoom(roomId);
    if (!table) return;

    const result = table.sitPlayer(seatIndex, {
      ...user,
      socketId: socket.id
    });

    if (result.success) {
      roomManager.broadcastTableState(table.id);
    } else {
      socket.emit('action_error', { message: result.message });
    }
  });

  // Stand Up
  socket.on('stand_up', ({ roomId }) => {
    const table = roomManager.getRoom(roomId);
    if (!table) return;

    table.standPlayer(socket.id);
    roomManager.broadcastTableState(table.id);
  });

  // Poker Action (Fold, Check, Call, Raise, All-in)
  socket.on('player_action', ({ roomId, action, amount, userId }) => {
    const table = roomManager.getRoom(roomId);
    if (!table) return;

    const result = table.playerAction(userId, action, amount);
    if (result.success) {
      roomManager.broadcastTableState(table.id);
    } else {
      socket.emit('action_error', { message: result.message });
    }
  });

  // Host Settings Update
  socket.on('update_settings', ({ roomId, settings, hostId }) => {
    const table = roomManager.getRoom(roomId);
    if (!table) return;

    const result = table.updateSettings(hostId, settings);
    if (result.success) {
      roomManager.broadcastTableState(table.id);
    } else {
      socket.emit('action_error', { message: result.message });
    }
  });

  // Host Start Game Manual
  socket.on('start_game_manual', ({ roomId, hostId }) => {
    const table = roomManager.getRoom(roomId);
    if (!table || table.hostId !== hostId) return;

    if (table.phase === 'WAITING') {
      table.startHand();
      roomManager.broadcastTableState(table.id);
    }
  });

  // Host Grant Rebuy
  socket.on('grant_rebuy', ({ roomId, targetPlayerId, amount, hostId }) => {
    const table = roomManager.getRoom(roomId);
    if (!table) return;

    const result = table.grantRebuy(hostId, targetPlayerId, amount);
    if (result.success) {
      roomManager.broadcastTableState(table.id);
    } else {
      socket.emit('action_error', { message: result.message });
    }
  });

  // Chat message & reaction emojis
  socket.on('send_chat', ({ roomId, user, message, emoji }) => {
    const table = roomManager.getRoom(roomId);
    if (!table) return;

    if (emoji) {
      io.to(roomId).emit('player_reaction', {
        userId: user.id,
        userName: user.name,
        emoji
      });
      table.addLog(`💬 ${user.name}: ${emoji}`);
    } else if (message) {
      table.addLog(`💬 ${user.name}: ${message}`);
    }
    roomManager.broadcastTableState(table.id);
  });

  // Disconnection
  socket.on('disconnect', () => {
    roomManager.leaveRoom(socket);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`♠️ Poker Server running on http://localhost:${PORT}`);
});
