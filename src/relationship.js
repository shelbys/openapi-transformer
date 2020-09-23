class Relationship {
  constructor(from, to, description, type, fromCard, toCard) {
    this.from = from;
    this.to = to;
    this.description = description;
    this.type = type;
    this.fromCard = fromCard;
    this.toCard = toCard;
  }
}

module.exports = Relationship;
