const Table = require('./server/poker/Table');

const table = new Table('ROOM_TEST', 'Test Table', 'u1', 'Alice');
table.sitPlayer(0, { id: 'u1', name: 'Alice', socketId: 's1' });
table.sitPlayer(1, { id: 'u2', name: 'Bob', socketId: 's2' });
table.sitPlayer(2, { id: 'u3', name: 'Charlie', socketId: 's3' });

console.log('--- Starting Hand ---');
table.startHand();

console.log('Phase:', table.phase);
console.log('Dealer:', table.seats[table.dealerIdx].name);
console.log('SB:', table.seats[table.sbIdx].name, 'CurrentBet:', table.seats[table.sbIdx].currentBet);
console.log('BB:', table.seats[table.bbIdx].name, 'CurrentBet:', table.seats[table.bbIdx].currentBet);

// Preflop Turn 1:
let currentTurnPlayer = table.seats[table.currentTurnIdx];
console.log(`\nTurn 1: ${currentTurnPlayer.name} (Seat ${table.currentTurnIdx + 1}) to act.`);
let res = table.playerAction(currentTurnPlayer.id, 'call');
console.log(`Action result for ${currentTurnPlayer.name}:`, res.success);
console.log('Phase after turn 1:', table.phase);

// Preflop Turn 2:
currentTurnPlayer = table.seats[table.currentTurnIdx];
console.log(`\nTurn 2: ${currentTurnPlayer.name} (Seat ${table.currentTurnIdx + 1}) to act.`);
res = table.playerAction(currentTurnPlayer.id, 'call');
console.log(`Action result for ${currentTurnPlayer.name}:`, res.success);
console.log('Phase after turn 2:', table.phase);

if (table.phase !== 'PREFLOP') {
  console.error('FAILED! Phase advanced to', table.phase, 'BEFORE 3rd player acted!');
  process.exit(1);
}

// Preflop Turn 3:
currentTurnPlayer = table.seats[table.currentTurnIdx];
console.log(`\nTurn 3: ${currentTurnPlayer.name} (Seat ${table.currentTurnIdx + 1}) to act.`);
res = table.playerAction(currentTurnPlayer.id, 'check');
console.log(`Action result for ${currentTurnPlayer.name} (Check as BB):`, res.success);

console.log('\nPhase after turn 3:', table.phase);
if (table.phase === 'FLOP') {
  console.log('SUCCESS! Preflop completed only after all 3 players had their turn!');
  console.log('Community cards on FLOP:', table.communityCards);
} else {
  console.error('FAILED! Phase should be FLOP, but got:', table.phase);
  process.exit(1);
}

// Check Flop Turn 1, 2, 3
currentTurnPlayer = table.seats[table.currentTurnIdx];
console.log(`\nFlop Turn 1: ${currentTurnPlayer.name} to act.`);
table.playerAction(currentTurnPlayer.id, 'check');
console.log('Phase after Flop Turn 1 (should stay FLOP):', table.phase);

currentTurnPlayer = table.seats[table.currentTurnIdx];
console.log(`\nFlop Turn 2: ${currentTurnPlayer.name} to act.`);
table.playerAction(currentTurnPlayer.id, 'check');
console.log('Phase after Flop Turn 2 (should stay FLOP):', table.phase);

currentTurnPlayer = table.seats[table.currentTurnIdx];
console.log(`\nFlop Turn 3: ${currentTurnPlayer.name} to act.`);
table.playerAction(currentTurnPlayer.id, 'check');
console.log('Phase after Flop Turn 3 (should advance to TURN):', table.phase);

if (table.phase === 'TURN') {
  console.log('\n>>> ALL CHECKS PASSED PERFECTLY! 3RD PLAYER IS NEVER SKIPPED! <<<');
} else {
  console.error('FAILED! Phase should be TURN, but got:', table.phase);
  process.exit(1);
}

table.clearTurnTimer();
process.exit(0);
