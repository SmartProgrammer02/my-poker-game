class PotManager {
  constructor() {
    this.totalPot = 0;
    this.roundBets = new Map(); // playerId -> amount committed in current round
    this.totalInvested = new Map(); // playerId -> total committed this hand
  }

  reset() {
    this.totalPot = 0;
    this.roundBets.clear();
    this.totalInvested.clear();
  }

  addBet(playerId, amount) {
    const currentRound = this.roundBets.get(playerId) || 0;
    this.roundBets.set(playerId, currentRound + amount);

    const currentTotal = this.totalInvested.get(playerId) || 0;
    this.totalInvested.set(playerId, currentTotal + amount);

    this.totalPot += amount;
  }

  getRoundBet(playerId) {
    return this.roundBets.get(playerId) || 0;
  }

  getTotalInvested(playerId) {
    return this.totalInvested.get(playerId) || 0;
  }

  endRound() {
    this.roundBets.clear();
  }

  /**
   * Calculates pots and side pots based on total investments of all players
   * @param {Array<{id: string, folded: boolean}>} players
   */
  calculatePots(players) {
    // Collect all players who invested chips
    const investments = [];
    for (const [playerId, amount] of this.totalInvested.entries()) {
      if (amount > 0) {
        const p = players.find(pl => pl && pl.id === playerId);
        investments.push({
          playerId,
          amount,
          folded: p ? p.folded : true
        });
      }
    }

    if (investments.length === 0) {
      return [{ amount: 0, eligiblePlayerIds: [] }];
    }

    // Sort distinct investment tiers (for all-ins)
    const distinctAmounts = [...new Set(investments.map(i => i.amount))].sort((a, b) => a - b);
    
    const pots = [];
    let previousLevel = 0;

    for (const level of distinctAmounts) {
      const potContributionPerPlayer = level - previousLevel;
      if (potContributionPerPlayer <= 0) continue;

      let potAmount = 0;
      const eligible = [];

      for (const inv of investments) {
        if (inv.amount >= level) {
          potAmount += potContributionPerPlayer;
          if (!inv.folded) {
            eligible.push(inv.playerId);
          }
        } else if (inv.amount > previousLevel) {
          potAmount += (inv.amount - previousLevel);
        }
      }

      if (potAmount > 0) {
        pots.push({
          amount: potAmount,
          eligiblePlayerIds: eligible
        });
      }

      previousLevel = level;
    }

    return pots;
  }
}

module.exports = PotManager;
