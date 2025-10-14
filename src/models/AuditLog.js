const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  action: { 
    type: String, 
    required: true,
    enum: [
      'GROUP_CREATED',
      'GROUP_JOINED',
      'CONTRIBUTION_MARKED',
      'TURN_RECEIVED',
      'TURN_ADVANCED',
      'KYC_SUBMITTED',
      'KYC_VERIFIED',
      'KYC_REJECTED',
      'USER_REGISTERED',
      'USER_LOGIN',
      'ADMIN_ACTION'
    ]
  },
  details: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for efficient querying
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ groupId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
