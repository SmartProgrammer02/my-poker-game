const { Hand } = require('pokersolver');

class Evaluator {
  /**
   * Evaluates 7 cards (2 hole + up to 5 community)
   * @param {string[]} holeCards - e.g. ['Ah', 'Kd']
   * @param {string[]} communityCards - e.g. ['2c', '7s', 'Jd', 'Ac', 'Ks']
   */
  static evaluate(holeCards, communityCards) {
    const allCards = [...holeCards, ...communityCards];
    if (allCards.length < 5) {
      return null;
    }
    const solved = Hand.solve(allCards);
    return {
      rank: solved.rank,
      name: solved.name,
      descr: solved.descr,
      winningCards: solved.cards.map(c => `${c.value}${c.suit}`),
      solvedHand: solved
    };
  }

  /**
   * Determine winners among multiple players
   * @param {Array<{id: string, name: string, holeCards: string[]}>} contenders
   * @param {string[]} communityCards
   * @returns {Array<{id: string, name: string, rank: number, name: string, descr: string, winningCards: string[]}>}
   */
  static determineWinners(contenders, communityCards) {
    if (!contenders || contenders.length === 0) return [];
    if (contenders.length === 1) {
      return [{
        id: contenders[0].id,
        name: contenders[0].name,
        descr: 'Won uncontested',
        winningCards: []
      }];
    }

    const evaluated = contenders.map(p => {
      const evalResult = this.evaluate(p.holeCards, communityCards);
      return {
        player: p,
        evalResult: evalResult
      };
    }).filter(item => item.evalResult !== null);

    if (evaluated.length === 0) return [];

    const solvedHands = evaluated.map(e => e.evalResult.solvedHand);
    const winningHands = Hand.winners(solvedHands);

    // Filter matching contenders
    const winners = evaluated
      .filter(item => winningHands.includes(item.evalResult.solvedHand))
      .map(item => ({
        id: item.player.id,
        seatIndex: item.player.seatIndex,
        name: item.player.name,
        descr: item.evalResult.descr,
        nameType: item.evalResult.name,
        winningCards: item.evalResult.winningCards
      }));

    return winners;
  }
}

module.exports = Evaluator;
