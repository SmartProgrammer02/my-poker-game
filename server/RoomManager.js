const Table = require('./poker/Table');

class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> Table
    this.socketToRoom = new Map(); // socketId -> roomId
  }

  generateRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom(name, hostUser) {
    const roomId = this.generateRoomId();
    const table = new Table(roomId, name || `Table ${roomId}`, hostUser.id, hostUser.name);
    this.rooms.set(roomId, table);
    return roomId;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId?.toUpperCase());
  }

  joinRoom(socket, roomId, user) {
    const code = roomId?.toUpperCase();
    let table = this.rooms.get(code);

    if (!table) {
      // Auto-create if it doesn't exist so friends can join directly via shared link
      table = new Table(code, `Private Table ${code}`, user.id, user.name);
      this.rooms.set(code, table);
    }

    this.socketToRoom.set(socket.id, code);
    socket.join(code);

    // Add as spectator initially
    table.addSpectator(socket.id, user);
    table.addLog(`${user.name} entered the room.`);

    this.broadcastTableState(code);
    return table;
  }

  leaveRoom(socket) {
    const roomId = this.socketToRoom.get(socket.id);
    if (!roomId) return;

    const table = this.rooms.get(roomId);
    if (table) {
      table.standPlayer(socket.id);
      table.removeSpectator(socket.id);
      this.broadcastTableState(roomId);

      // Clean up empty rooms if nobody is inside after 30 mins
      if (table.seats.every(s => s === null) && table.spectators.size === 0) {
        setTimeout(() => {
          const checkTable = this.rooms.get(roomId);
          if (checkTable && checkTable.seats.every(s => s === null) && checkTable.spectators.size === 0) {
            checkTable.clearTurnTimer();
            this.rooms.delete(roomId);
          }
        }, 1000 * 60 * 30);
      }
    }

    this.socketToRoom.delete(socket.id);
    socket.leave(roomId);
  }

  broadcastTableState(roomId) {
    const table = this.rooms.get(roomId);
    if (!table) return;

    // Send customized state to each socket connected to this room
    const roomSockets = this.io.sockets.adapter.rooms.get(roomId);
    if (roomSockets) {
      for (const socketId of roomSockets) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          const clientState = table.getClientState(socketId);
          socket.emit('table_update', clientState);
        }
      }
    }
  }

  // Periodic heartbeat sync to ensure timer ticks are visible to all clients
  startHeartbeat() {
    setInterval(() => {
      for (const [roomId, table] of this.rooms.entries()) {
        if (table.phase !== 'WAITING' && table.phase !== 'SHOWDOWN') {
          this.broadcastTableState(roomId);
        }
      }
    }, 1000);
  }
}

module.exports = RoomManager;
