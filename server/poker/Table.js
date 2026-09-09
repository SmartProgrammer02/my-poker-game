const Deck = require('./Deck');
const Evaluator = require('./Evaluator');
const PotManager = require('./PotManager');

class Table {
  constructor(id, name, hostId, hostName) {
    this.id = id;
    this.name = name;
    this.hostId = hostId;
    this.minPlayers = 3;
    this.maxPlayers = 8;

    // Configurable by Host
    this.startingChips = 1000;
    this.smallBlind = 10;
    this.bigBlind = 20;
    this.turnDuration = 30; // seconds
    this.autoStartNextHand = true;

    // Seats: exactly 8 positions for circular layout
    this.seats = Array(8).fill(null);

    // Spectators
    this.spectators = new Map(); // socketId -> { id, name }

    // Game state
    this.deck = new Deck();
    this.potManager = new PotManager();
    this.phase = 'WAITING'; // WAITING, PREFLOP, FLOP, TURN, RIVER, SHOWDOWN
    this.communityCards = [];
    this.dealerIdx = 0;
    this.sbIdx = -1;
    this.bbIdx = -1;
    this.currentTurnIdx = -1;
    this.currentBet = 0;
    this.minRaise = this.bigBlind;
    this.lastRaiseAmount = this.bigBlind;
    this.turnTimeRemaining = 0;
    this.turnTimerInterval = null;
    this.handNumber = 0;
    this.logs = [];
    this.winners = [];
    this.showdownHands = [];
    this.autoNextHandTimeout = null;

    this.addLog(`Room "${this.name}" created by ${hostName || 'Host'}.`);
  }

  addLog(message) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.logs.unshift({ id: Math.random().toString(36).substr(2, 9), time: timestamp, text: message });
    if (this.logs.length > 80) {
      this.logs.pop();
    }
  }

  // --- Seat Management ---

  sitPlayer(seatIndex, player) {
    if (seatIndex < 0 || seatIndex >= this.maxPlayers) {
      return { success: false, message: 'Invalid seat index' };
    }
    if (this.seats[seatIndex] !== null) {
      return { success: false, message: 'Seat already taken' };
    }
    // Check if player is already seated in another seat
    const existingIndex = this.seats.findIndex(s => s && s.id === player.id);
    if (existingIndex !== -1) {
      return { success: false, message: 'Already seated at another position' };
    }

    this.seats[seatIndex] = {
      id: player.id,
      socketId: player.socketId,
      name: player.name,
      avatar: player.avatar || '♠️',
      chips: this.startingChips,
      currentBet: 0,
      totalCommitted: 0,
      holeCards: [],
      folded: false,
      isAllIn: false,
      sittingOut: false,
      isHost: player.id === this.hostId,
      showCards: false,
      hasActedInRound: false
    };

    this.spectators.delete(player.socketId);
    this.addLog(`${player.name} sat at Seat ${seatIndex + 1} with ${this.startingChips} chips.`);

    // If game is in WAITING and we now have >= 3 players, can start
    this.checkAutoStart();

    return { success: true };
  }

  standPlayer(socketId) {
    const seatIndex = this.seats.findIndex(s => s && s.socketId === socketId);
    if (seatIndex === -1) return null;

    const player = this.seats[seatIndex];
    this.addLog(`${player.name} left Seat ${seatIndex + 1}.`);

    // If game is in progress and it was their turn, fold them first
    if (this.phase !== 'WAITING' && !player.folded && !player.isAllIn) {
      this.playerAction(player.id, 'fold');
    }

    this.seats[seatIndex] = null;

    // Check if game should pause
    const activePlayersWithChips = this.getActivePlayersWithChips();
    if (activePlayersWithChips.length < this.minPlayers && this.phase !== 'WAITING') {
      this.addLog('Not enough players to continue. Returning to waiting lobby.');
      this.resetToWaiting();
    }

    return seatIndex;
  }

  addSpectator(socketId, user) {
    this.spectators.set(socketId, {
      id: user.id,
      name: user.name,
      socketId
    });
  }

  removeSpectator(socketId) {
    this.spectators.delete(socketId);
  }

  // --- Host Settings ---

  updateSettings(hostId, settings) {
    if (hostId !== this.hostId) {
      return { success: false, message: 'Only the room owner can update settings' };
    }

    if (settings.startingChips && settings.startingChips > 0) {
      this.startingChips = Number(settings.startingChips);
      if (this.phase === 'WAITING') {
        this.seats.forEach(s => {
          if (s) s.chips = this.startingChips;
        });
      }
    }
    if (settings.smallBlind && settings.smallBlind > 0) {
      this.smallBlind = Number(settings.smallBlind);
      this.bigBlind = this.smallBlind * 2;
      this.minRaise = this.bigBlind;
    }
    if (settings.bigBlind && settings.bigBlind > 0) {
      this.bigBlind = Number(settings.bigBlind);
      this.minRaise = this.bigBlind;
    }
    if (settings.turnDuration && settings.turnDuration >= 10) {
      this.turnDuration = Number(settings.turnDuration);
    }
    if (typeof settings.autoStartNextHand === 'boolean') {
      this.autoStartNextHand = settings.autoStartNextHand;
    }

    this.addLog(`Host updated settings: Starting Stack = ${this.startingChips}, Blinds = ${this.smallBlind}/${this.bigBlind}.`);
    return { success: true };
  }

  grantRebuy(hostId, targetPlayerId, amount) {
    if (hostId !== this.hostId) {
      return { success: false, message: 'Only the room owner can grant rebuys' };
    }
    const player = this.seats.find(s => s && s.id === targetPlayerId);
    if (!player) return { success: false, message: 'Player not found' };

    const rebuyAmount = amount || this.startingChips;
    player.chips += rebuyAmount;
    this.addLog(`Host granted ${rebuyAmount} chips to ${player.name}. New Stack: ${player.chips}.`);
    return { success: true };
  }

  // --- Game Helpers ---

  getActivePlayersWithChips() {
    return this.seats.filter(s => s !== null && s.chips > 0 && !s.sittingOut);
  }

  getPlayersInHand() {
    return this.seats.filter(s => s !== null && !s.folded && s.holeCards.length === 2);
  }

  getNextSeatedIndex(fromIndex, filterFn = () => true) {
    for (let i = 1; i <= this.maxPlayers; i++) {
      const idx = (fromIndex + i) % this.maxPlayers;
      const seat = this.seats[idx];
      if (seat !== null && filterFn(seat)) {
        return idx;
      }
    }
    return -1;
  }

  // --- Game Flow Control ---

  checkAutoStart() {
    const readyPlayers = this.getActivePlayersWithChips();
    if (this.phase === 'WAITING' && readyPlayers.length >= this.minPlayers) {
      // Auto-start after a brief delay so players can see each other sit
      if (this.autoNextHandTimeout) clearTimeout(this.autoNextHandTimeout);
      this.autoNextHandTimeout = setTimeout(() => {
        if (this.phase === 'WAITING' && this.getActivePlayersWithChips().length >= this.minPlayers) {
          this.startHand();
        }
      }, 3000);
    }
  }

  startHand() {
    const activePlayers = this.getActivePlayersWithChips();
    if (activePlayers.length < this.minPlayers) {
      this.addLog(`Cannot start hand: minimum ${this.minPlayers} players with chips required (Current: ${activePlayers.length}).`);
      this.phase = 'WAITING';
      return false;
    }

    if (this.autoNextHandTimeout) clearTimeout(this.autoNextHandTimeout);
    this.clearTurnTimer();

    this.handNumber++;
    this.phase = 'PREFLOP';
    this.communityCards = [];
    this.winners = [];
    this.showdownHands = [];
    this.potManager.reset();

    // Advance dealer button to next active player
    this.dealerIdx = this.getNextSeatedIndex(this.dealerIdx, p => p.chips > 0);
    if (this.dealerIdx === -1) {
      this.dealerIdx = this.seats.findIndex(s => s && s.chips > 0);
    }

    // Determine Small Blind and Big Blind positions
    this.sbIdx = this.getNextSeatedIndex(this.dealerIdx, p => p.chips > 0);
    this.bbIdx = this.getNextSeatedIndex(this.sbIdx, p => p.chips > 0);

    // Reset players for new hand
    this.seats.forEach(p => {
      if (p) {
        p.currentBet = 0;
        p.totalCommitted = 0;
        p.holeCards = [];
        p.folded = (p.chips <= 0 || p.sittingOut);
        p.isAllIn = false;
        p.showCards = false;
        p.hasActedInRound = false;
      }
    });

    // Shuffle & Deal 2 cards to each eligible player
    this.deck.reset();
    activePlayers.forEach(p => {
      p.holeCards = this.deck.drawCards(2);
    });

    this.addLog(`--- Starting Hand #${this.handNumber} ---`);
    this.addLog(`Dealer button is at Seat ${this.dealerIdx + 1} (${this.seats[this.dealerIdx].name}).`);

    // Post Blinds
    this.postBlind(this.sbIdx, this.smallBlind, 'small blind');
    this.postBlind(this.bbIdx, this.bigBlind, 'big blind');

    this.currentBet = this.bigBlind;
    this.minRaise = this.bigBlind;
    this.lastRaiseAmount = this.bigBlind;

    // First to act pre-flop is clockwise from Big Blind (UTG)
    this.currentTurnIdx = this.getNextSeatedIndex(this.bbIdx, p => !p.folded && !p.isAllIn);

    if (this.currentTurnIdx === -1) {
      // Everyone is all in from blinds?
      this.advancePhase();
    } else {
      this.startTurnTimer();
    }

    return true;
  }

  postBlind(seatIdx, amount, typeName) {
    const player = this.seats[seatIdx];
    if (!player) return;

    const actualAmount = Math.min(player.chips, amount);
    player.chips -= actualAmount;
    player.currentBet = actualAmount;
    player.totalCommitted = actualAmount;
    if (player.chips === 0) {
      player.isAllIn = true;
      this.addLog(`${player.name} is ALL IN for ${actualAmount} on the ${typeName}!`);
    } else {
      this.addLog(`${player.name} posts ${typeName} of ${actualAmount}.`);
    }

    this.potManager.addBet(player.id, actualAmount);
  }

  startTurnTimer() {
    this.clearTurnTimer();
    this.turnTimeRemaining = this.turnDuration;

    this.turnTimerInterval = setInterval(() => {
      this.turnTimeRemaining--;
      if (this.turnTimeRemaining <= 0) {
        this.clearTurnTimer();
        this.handleTurnTimeout();
      }
    }, 1000);
  }

  clearTurnTimer() {
    if (this.turnTimerInterval) {
      clearInterval(this.turnTimerInterval);
      this.turnTimerInterval = null;
    }
  }

  handleTurnTimeout() {
    const player = this.seats[this.currentTurnIdx];
    if (!player) return;

    const callAmount = this.currentBet - player.currentBet;
    if (callAmount <= 0) {
      // Free check
      this.playerAction(player.id, 'check');
    } else {
      // Timeout fold
      this.addLog(`${player.name}'s turn timed out and folded.`);
      this.playerAction(player.id, 'fold');
    }
  }

  // --- Player Actions ---

  playerAction(playerId, action, amount = 0) {
    const seatIdx = this.seats.findIndex(s => s && s.id === playerId);
    if (seatIdx === -1 || seatIdx !== this.currentTurnIdx) {
      return { success: false, message: 'Not your turn' };
    }

    const player = this.seats[seatIdx];
    const callDiff = this.currentBet - player.currentBet;

    switch (action) {
      case 'fold': {
        player.folded = true;
        player.hasActedInRound = true;
        this.addLog(`${player.name} folds.`);
        break;
      }

      case 'check': {
        if (callDiff > 0) {
          return { success: false, message: `Cannot check; must call ${callDiff} or fold.` };
        }
        player.hasActedInRound = true;
        this.addLog(`${player.name} checks.`);
        break;
      }

      case 'call': {
        if (callDiff <= 0) {
          // Already matched
          player.hasActedInRound = true;
          this.addLog(`${player.name} checks.`);
          break;
        }

        const toCall = Math.min(player.chips, callDiff);
        player.chips -= toCall;
        player.currentBet += toCall;
        player.totalCommitted += toCall;
        player.hasActedInRound = true;
        this.potManager.addBet(player.id, toCall);

        if (player.chips === 0) {
          player.isAllIn = true;
          this.addLog(`${player.name} calls ${toCall} and is ALL IN!`);
        } else {
          this.addLog(`${player.name} calls ${toCall}.`);
        }
        break;
      }

      case 'raise': {
        const totalBetTarget = Number(amount);
        const addAmount = totalBetTarget - player.currentBet;

        if (addAmount <= 0 || addAmount > player.chips) {
          return { success: false, message: 'Invalid raise chip amount' };
        }

        // Check min raise rule unless player is all-in
        const raiseDifference = totalBetTarget - this.currentBet;
        if (addAmount < player.chips && raiseDifference < this.minRaise) {
          return { success: false, message: `Raise must be at least ${this.minRaise} over current bet (${this.currentBet + this.minRaise} total).` };
        }

        player.chips -= addAmount;
        player.currentBet = totalBetTarget;
        player.totalCommitted += addAmount;
        player.hasActedInRound = true;
        this.potManager.addBet(player.id, addAmount);

        if (raiseDifference > 0) {
          this.minRaise = raiseDifference;
        }
        this.currentBet = totalBetTarget;

        // Reset hasActedInRound for all OTHER active players who can act
        this.seats.forEach(s => {
          if (s && s.id !== player.id && !s.folded && !s.isAllIn) {
            s.hasActedInRound = false;
          }
        });

        if (player.chips === 0) {
          player.isAllIn = true;
          this.addLog(`${player.name} goes ALL IN for ${totalBetTarget}!`);
        } else {
          this.addLog(`${player.name} raises to ${totalBetTarget}.`);
        }
        break;
      }

      case 'allin': {
        const allInAmount = player.chips;
        if (allInAmount <= 0) return { success: false, message: 'No chips to go all in' };

        const totalBetTarget = player.currentBet + allInAmount;
        const raiseDifference = totalBetTarget - this.currentBet;

        player.chips = 0;
        player.currentBet = totalBetTarget;
        player.totalCommitted += allInAmount;
        player.isAllIn = true;
        player.hasActedInRound = true;
        this.potManager.addBet(player.id, allInAmount);

        if (totalBetTarget > this.currentBet) {
          if (raiseDifference > this.minRaise) {
            this.minRaise = raiseDifference;
          }
          this.currentBet = totalBetTarget;

          // If this all-in raised the bet, other players must have an opportunity to call/fold
          this.seats.forEach(s => {
            if (s && s.id !== player.id && !s.folded && !s.isAllIn) {
              s.hasActedInRound = false;
            }
          });
        }

        this.addLog(`${player.name} pushes ALL IN with ${totalBetTarget} chips! 🌟`);
        break;
      }

      default:
        return { success: false, message: 'Unknown action' };
    }

    this.clearTurnTimer();
    this.advanceTurn();
    return { success: true };
  }

  advanceTurn() {
    // Check if only one non-folded player remains
    const remainingContenders = this.seats.filter(s => s !== null && !s.folded);
    if (remainingContenders.length === 1) {
      // Instant win by fold
      this.awardSingleWinner(remainingContenders[0]);
      return;
    }

    const playersCanAct = this.seats.filter(s => s !== null && !s.folded && !s.isAllIn);

    // If no players can act (all remaining are all-in), advance
    if (playersCanAct.length === 0) {
      this.advancePhase();
      return;
    }

    // If exactly 1 player can act and everyone else is all-in
    if (playersCanAct.length === 1) {
      const p = playersCanAct[0];
      if (p.hasActedInRound && p.currentBet === this.currentBet) {
        this.advancePhase();
        return;
      }
    }

    // A betting round is complete IF AND ONLY IF:
    // 1) Every player who can act has acted in this round (hasActedInRound === true)
    // 2) Every player who can act has matched the highest bet (currentBet)
    const isRoundComplete = playersCanAct.every(p => p.hasActedInRound && p.currentBet === this.currentBet);

    if (isRoundComplete) {
      this.advancePhase();
      return;
    }

    // Determine next player to act
    const nextTurn = this.getNextSeatedIndex(this.currentTurnIdx, p => !p.folded && !p.isAllIn);

    if (nextTurn === -1) {
      this.advancePhase();
      return;
    }

    this.currentTurnIdx = nextTurn;
    this.startTurnTimer();
  }

  advancePhase() {
    this.clearTurnTimer();
    this.potManager.endRound();

    // Reset current bets and hasActedInRound for the next round
    this.seats.forEach(p => {
      if (p) {
        p.currentBet = 0;
        p.hasActedInRound = false;
      }
    });
    this.currentBet = 0;
    this.minRaise = this.bigBlind;

    const remainingNonFolded = this.seats.filter(s => s !== null && !s.folded);
    const playersCanAct = this.seats.filter(s => s !== null && !s.folded && !s.isAllIn);

    // If 0 or 1 player can act (e.g. rest are all-in), we run the remaining board out
    const runItOut = playersCanAct.length <= 1;

    switch (this.phase) {
      case 'PREFLOP': {
        this.phase = 'FLOP';
        this.deck.draw(); // Burn card
        this.communityCards.push(...this.deck.drawCards(3));
        this.addLog(`Dealing the Flop: [${this.communityCards.join(', ')}]`);
        break;
      }
      case 'FLOP': {
        this.phase = 'TURN';
        this.deck.draw(); // Burn card
        this.communityCards.push(this.deck.draw());
        this.addLog(`Dealing the Turn: [${this.communityCards.join(', ')}]`);
        break;
      }
      case 'TURN': {
        this.phase = 'RIVER';
        this.deck.draw(); // Burn card
        this.communityCards.push(this.deck.draw());
        this.addLog(`Dealing the River: [${this.communityCards.join(', ')}]`);
        break;
      }
      case 'RIVER': {
        this.phase = 'SHOWDOWN';
        this.resolveShowdown();
        return;
      }
      default:
        break;
    }

    if (runItOut) {
      // Delay slightly and auto advance to next card or showdown
      setTimeout(() => {
        if (this.phase !== 'SHOWDOWN' && this.phase !== 'WAITING') {
          this.advancePhase();
        }
      }, 1500);
      return;
    }

    // Set turn to first active player clockwise from dealer
    this.currentTurnIdx = this.getNextSeatedIndex(this.dealerIdx, p => !p.folded && !p.isAllIn);
    if (this.currentTurnIdx === -1) {
      this.advancePhase();
    } else {
      this.startTurnTimer();
    }
  }

  // --- Showdown & Winners ---

  awardSingleWinner(winner) {
    this.clearTurnTimer();
    this.phase = 'SHOWDOWN';
    const totalPots = this.potManager.totalPot;
    winner.chips += totalPots;

    this.winners = [{
      id: winner.id,
      name: winner.name,
      seatIndex: this.seats.indexOf(winner),
      amount: totalPots,
      descr: 'All other players folded',
      winningCards: []
    }];

    this.addLog(`🏆 ${winner.name} wins the pot of ${totalPots} chips (uncontested)!`);
    this.finishHand();
  }

  resolveShowdown() {
    this.clearTurnTimer();
    const activeContenders = this.seats.filter(s => s !== null && !s.folded);

    // Make hole cards visible at showdown
    this.showdownHands = activeContenders.map(p => ({
      id: p.id,
      name: p.name,
      seatIndex: this.seats.indexOf(p),
      holeCards: p.holeCards,
      eval: Evaluator.evaluate(p.holeCards, this.communityCards)
    }));

    // Calculate side pots
    const pots = this.potManager.calculatePots(this.seats);
    const winSummary = [];

    // Award each pot to eligible winner(s)
    pots.forEach((pot, potIdx) => {
      const eligiblePlayers = activeContenders.filter(p => pot.eligiblePlayerIds.includes(p.id));
      if (eligiblePlayers.length === 0) return;

      const potWinners = Evaluator.determineWinners(eligiblePlayers, this.communityCards);
      const splitAmount = Math.floor(pot.amount / potWinners.length);

      potWinners.forEach(w => {
        const playerObj = this.seats.find(s => s && s.id === w.id);
        if (playerObj) {
          playerObj.chips += splitAmount;
        }

        winSummary.push({
          id: w.id,
          seatIndex: w.seatIndex,
          name: w.name,
          amount: splitAmount,
          descr: w.descr,
          nameType: w.nameType,
          winningCards: w.winningCards,
          potIndex: potIdx
        });

        this.addLog(`🏆 ${w.name} wins ${splitAmount} chips with ${w.descr}!`);
      });
    });

    this.winners = winSummary;
    this.finishHand();
  }

  finishHand() {
    // Schedule next hand if autoStartNextHand is enabled
    if (this.autoNextHandTimeout) clearTimeout(this.autoNextHandTimeout);

    this.autoNextHandTimeout = setTimeout(() => {
      const playersWithChips = this.getActivePlayersWithChips();
      if (playersWithChips.length >= this.minPlayers && this.autoStartNextHand) {
        this.startHand();
      } else {
        this.phase = 'WAITING';
        if (playersWithChips.length < this.minPlayers) {
          this.addLog(`Waiting for players (Need at least ${this.minPlayers} players with chips to start).`);
        }
      }
    }, 8000); // 8 seconds to admire winning hand & collect chips
  }

  resetToWaiting() {
    this.clearTurnTimer();
    if (this.autoNextHandTimeout) clearTimeout(this.autoNextHandTimeout);
    this.phase = 'WAITING';
    this.communityCards = [];
    this.currentBet = 0;
    this.winners = [];
    this.showdownHands = [];
    this.potManager.reset();
  }

  // --- Client State Serialization ---

  getClientState(viewerSocketId = null) {
    // Find viewer's seat
    const viewerSeat = this.seats.find(s => s && s.socketId === viewerSocketId);
    const isViewerHost = viewerSeat ? viewerSeat.isHost : (this.spectators.get(viewerSocketId)?.id === this.hostId);

    return {
      tableId: this.id,
      tableName: this.name,
      hostId: this.hostId,
      isViewerHost,
      minPlayers: this.minPlayers,
      maxPlayers: this.maxPlayers,
      startingChips: this.startingChips,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      turnDuration: this.turnDuration,
      autoStartNextHand: this.autoStartNextHand,
      phase: this.phase,
      communityCards: this.communityCards,
      dealerIdx: this.dealerIdx,
      sbIdx: this.sbIdx,
      bbIdx: this.bbIdx,
      currentTurnIdx: this.currentTurnIdx,
      currentBet: this.currentBet,
      minRaise: this.minRaise,
      totalPot: this.potManager.totalPot,
      turnTimeRemaining: this.turnTimeRemaining,
      handNumber: this.handNumber,
      logs: this.logs.slice(0, 40),
      winners: this.winners,
      showdownHands: this.showdownHands,
      spectatorsCount: this.spectators.size,
      seats: this.seats.map((seat, idx) => {
        if (!seat) return null;

        const isMe = seat.socketId === viewerSocketId;
        const revealHoleCards = isMe || this.phase === 'SHOWDOWN' || seat.showCards;

        return {
          seatIndex: idx,
          id: seat.id,
          name: seat.name,
          avatar: seat.avatar,
          chips: seat.chips,
          currentBet: seat.currentBet,
          folded: seat.folded,
          isAllIn: seat.isAllIn,
          isHost: seat.isHost,
          isTurn: idx === this.currentTurnIdx && this.phase !== 'WAITING' && this.phase !== 'SHOWDOWN',
          isDealer: idx === this.dealerIdx,
          isSmallBlind: idx === this.sbIdx,
          isBigBlind: idx === this.bbIdx,
          // Only show cards if viewer owns the seat, or at showdown
          holeCards: revealHoleCards ? seat.holeCards : seat.holeCards.map(() => '??'),
          hasCards: seat.holeCards.length > 0
        };
      })
    };
  }
}

module.exports = Table;
