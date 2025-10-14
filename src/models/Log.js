const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: String },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }
}, { timestamps: true });

module.exports = mongoose.model('Log', LogSchema);
