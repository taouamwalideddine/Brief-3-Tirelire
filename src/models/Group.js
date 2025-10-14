const mongoose = require('mongoose');

const TurnSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hasReceived: { type: Boolean, default: false },
  receivedAt: { type: Date },
  round: { type: Number, required: true }
});

const ContributionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  round: { type: Number, required: true },
  contributed: { type: Boolean, default: false },
  contributedAt: { type: Date },
  period: { type: String },
  markedDone: { type: Boolean, default: false }
});

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  turns: [TurnSchema],
  contributions: [ContributionSchema],
  currentRound: { type: Number, default: 1 },
  currentTurnIndex: { type: Number, default: 0 },
  contributionAmount: { type: Number, required: true, default: 100 },
  isActive: { type: Boolean, default: true },
  completedRounds: [{ type: Number }]
}, { timestamps: true });

// Method to get current turn user
GroupSchema.methods.getCurrentTurnUser = function() {
  if (this.turns.length === 0) return null;
  return this.turns[this.currentTurnIndex];
};

// Method to advance to next turn
GroupSchema.methods.advanceTurn = function() {
  this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turns.length;
  if (this.currentTurnIndex === 0) {
    this.currentRound += 1;
  }
  return this.save();
};

// Method to mark turn as received
GroupSchema.methods.markTurnReceived = function(userId) {
  const turn = this.turns.find(t => t.user.toString() === userId.toString() && t.round === this.currentRound);
  if (turn) {
    turn.hasReceived = true;
    turn.receivedAt = new Date();
    return this.save();
  }
  throw new Error('Turn not found');
};

// Method to check if all contributions are collected for current round
GroupSchema.methods.areAllContributionsCollected = function() {
  const currentRoundContributions = this.contributions.filter(c => c.round === this.currentRound);
  return currentRoundContributions.length === this.members.length && 
         currentRoundContributions.every(c => c.contributed);
};

// Method to complete current round
GroupSchema.methods.completeRound = function() {
  this.completedRounds.push(this.currentRound);
  return this.save();
};

module.exports = mongoose.model('Group', GroupSchema);
