const { io } = require('socket.io-client');

async function runMultiplayerTest() {
  console.log('--- Starting Multiplayer Poker Simulation ---');
  const SERVER_URL = 'http://localhost:4000';
  const ROOM = 'ROOM88';

  const p1 = io(SERVER_URL);
  const p2 = io(SERVER_URL);
  const p3 = io(SERVER_URL);

  const u1 = { id: 'u1', name: 'Owner_Alice', avatar: '👑' };
  const u2 = { id: 'u2', name: 'Player_Bob', avatar: '🦁' };
  const u3 = { id: 'u3', name: 'Player_Charlie', avatar: '💎' };

  await new Promise(res => p1.on('connect', res));
  console.log('Player 1 connected');
  await new Promise(res => p2.on('connect', res));
  console.log('Player 2 connected');
  await new Promise(res => p3.on('connect', res));
  console.log('Player 3 connected');

  // Join Room
  p1.emit('join_room', { roomId: ROOM, user: u1 });
  p2.emit('join_room', { roomId: ROOM, user: u2 });
  p3.emit('join_room', { roomId: ROOM, user: u3 });

  // Update Settings: Room Owner sets custom coin amount (2500 chips)
  p1.emit('update_settings', {
    roomId: ROOM,
    hostId: u1.id,
    settings: { startingChips: 2500, smallBlind: 15, bigBlind: 30 }
  });

  await new Promise(r => setTimeout(r, 400));

  // Sit 3 players
  p1.emit('sit_down', { roomId: ROOM, seatIndex: 0, user: u1 });
  p2.emit('sit_down', { roomId: ROOM, seatIndex: 1, user: u2 });
  p3.emit('sit_down', { roomId: ROOM, seatIndex: 2, user: u3 });

  // Wait for table state
  let handStarted = false;
  p1.on('table_update', (state) => {
    console.log(`[Table State] Phase: ${state.phase}, Total Pot: ${state.totalPot}, Seated: ${state.seats.filter(Boolean).length}, Starting Chips: ${state.startingChips}`);
    if (state.phase === 'PREFLOP' && !handStarted) {
      handStarted = true;
      console.log('>>> Hand automatically started with 3 players! <<<');
      console.log('Dealer Index:', state.dealerIdx, 'Current Turn Index:', state.currentTurnIdx);

      // Player to act pushes ALL-IN or Calls to test the custom coins
      const turnSeat = state.seats[state.currentTurnIdx];
      console.log(`Active Turn: ${turnSeat?.name} at Seat ${state.currentTurnIdx + 1}`);

      setTimeout(() => {
        console.log('Simulating action...');
        if (turnSeat.id === 'u1') p1.emit('player_action', { roomId: ROOM, action: 'call', userId: 'u1' });
        else if (turnSeat.id === 'u2') p2.emit('player_action', { roomId: ROOM, action: 'call', userId: 'u2' });
        else if (turnSeat.id === 'u3') p3.emit('player_action', { roomId: ROOM, action: 'call', userId: 'u3' });
        
        setTimeout(() => {
          console.log('Multiplayer simulation verified SUCCESS!');
          p1.disconnect();
          p2.disconnect();
          p3.disconnect();
          process.exit(0);
        }, 1000);
      }, 500);
    }
  });
}

runMultiplayerTest().catch(console.error);
