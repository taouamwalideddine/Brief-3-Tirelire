const mongoose = require('mongoose');

const TurnSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hasReceived: { type: Boolean, default: false },
});

const ContributionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  round: { type: Number, required: true },
  contributed: { type: Boolean, default: false },
});

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  turns: [TurnSchema],
  contributions: [ContributionSchema],
    currentRound: { type: Number, default: 1 },
  currentTurn: { type: Number, default: 0 },
  contributionAmount: { type: Number, default: 0 },
  totalRounds: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Group', GroupSchema);
