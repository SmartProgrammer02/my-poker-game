const SUITS = ['s', 'h', 'd', 'c']; // Spades, Hearts, Diamonds, Clubs
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push(`${rank}${suit}`);
      }
    }
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw() {
    if (this.cards.length === 0) {
      throw new Error('No cards left in deck');
    }
    return this.cards.pop();
  }

  drawCards(count) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      drawn.push(this.draw());
    }
    return drawn;
  }
}

module.exports = Deck;
