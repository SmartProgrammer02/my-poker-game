const Deck = require('./server/poker/Deck');
const Evaluator = require('./server/poker/Evaluator');
const Table = require('./server/poker/Table');

console.log('Testing Deck...');
const deck = new Deck();
console.log('Total cards in deck:', deck.cards.length);
const dealt = deck.drawCards(2);
console.log('Dealt 2 cards:', dealt, 'Remaining:', deck.cards.length);

console.log('\nTesting Evaluator...');
const holeCards = ['As', 'Ks'];
const community = ['Qs', 'Js', 'Ts', '2d', '3c'];
const evalResult = Evaluator.evaluate(holeCards, community);
console.log('Hand Evaluation:', evalResult.descr, 'Name:', evalResult.name);

console.log('\nTesting Winner Determination...');
const contenders = [
  { id: '1', name: 'Alice', seatIndex: 0, holeCards: ['Ah', 'Kh'] },
  { id: '2', name: 'Bob', seatIndex: 1, holeCards: ['Qc', 'Qd'] }
];
const board = ['As', 'Ad', '7h', '2c', '3s'];
const winners = Evaluator.determineWinners(contenders, board);
console.log('Winners:', winners.map(w => `${w.name} with ${w.descr}`));

console.log('\nTesting Table Engine setup...');
const table = new Table('TEST1', 'High Stakes Room', 'user1', 'Alice');
console.log('Table created:', table.name, 'Seats:', table.seats.length);
table.sitPlayer(0, { id: 'user1', name: 'Alice', socketId: 's1' });
table.sitPlayer(1, { id: 'user2', name: 'Bob', socketId: 's2' });
table.sitPlayer(2, { id: 'user3', name: 'Charlie', socketId: 's3' });
console.log('Seated 3 players. Starting hand...');
const started = table.startHand();
console.log('Hand started?', started, 'Phase:', table.phase, 'Total Pot:', table.potManager.totalPot);
console.log('Table verification SUCCESS!');
