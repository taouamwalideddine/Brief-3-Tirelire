const AuditLog = require('../models/AuditLog');

class AuditService {
  // Log an action
  static async logAction(userId, action, details = '', metadata = {}, groupId = null, req = null) {
    try {
      const logEntry = {
        userId,
        action,
        details,
        metadata,
        groupId,
        timestamp: new Date()
      };

      // Add request information if available
      if (req) {
        logEntry.ipAddress = req.ip || req.connection.remoteAddress;
        logEntry.userAgent = req.get('User-Agent');
      }

      const auditLog = new AuditLog(logEntry);
      await auditLog.save();
      return auditLog;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Get audit logs for a specific user
  static async getUserLogs(userId, limit = 50, skip = 0) {
    try {
      return await AuditLog.find({ userId })
        .populate('groupId', 'name')
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);
    } catch (error) {
      throw new Error(`Failed to get user audit logs: ${error.message}`);
    }
  }

  // Get audit logs for a specific group
  static async getGroupLogs(groupId, limit = 50, skip = 0) {
    try {
      return await AuditLog.find({ groupId })
        .populate('userId', 'name email')
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);
    } catch (error) {
      throw new Error(`Failed to get group audit logs: ${error.message}`);
    }
  }

  // Get audit logs by action type
  static async getLogsByAction(action, limit = 50, skip = 0) {
    try {
      return await AuditLog.find({ action })
        .populate('userId', 'name email')
        .populate('groupId', 'name')
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);
    } catch (error) {
      throw new Error(`Failed to get logs by action: ${error.message}`);
    }
  }

  // Get all audit logs (admin only)
  static async getAllLogs(limit = 100, skip = 0) {
    try {
      return await AuditLog.find()
        .populate('userId', 'name email')
        .populate('groupId', 'name')
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);
    } catch (error) {
      throw new Error(`Failed to get all audit logs: ${error.message}`);
    }
  }

  // Get audit logs within a date range
  static async getLogsByDateRange(startDate, endDate, limit = 100) {
    try {
      return await AuditLog.find({
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      })
        .populate('userId', 'name email')
        .populate('groupId', 'name')
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      throw new Error(`Failed to get logs by date range: ${error.message}`);
    }
  }

  // Get audit statistics
  static async getAuditStats() {
    try {
      const totalLogs = await AuditLog.countDocuments();
      const actionCounts = await AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      const recentActivity = await AuditLog.find()
        .populate('userId', 'name email')
        .sort({ timestamp: -1 })
        .limit(10);

      return {
        totalLogs,
        actionCounts,
        recentActivity
      };
    } catch (error) {
      throw new Error(`Failed to get audit statistics: ${error.message}`);
    }
  }
}

module.exports = AuditService;
