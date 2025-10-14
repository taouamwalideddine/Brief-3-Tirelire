const express = require('express');
const auth = require('../middlewares/auth');
const AuditService = require('../services/auditService');
const router = express.Router();

// Get user's own audit logs
router.get('/my-logs', auth, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    const logs = await AuditService.getUserLogs(req.user.userId, parseInt(limit), parseInt(skip));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get audit logs.' });
  }
});

// Get group audit logs (for group members and admins)
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    const logs = await AuditService.getGroupLogs(req.params.groupId, parseInt(limit), parseInt(skip));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get group audit logs.' });
  }
});

// Get audit logs by action type (admin only)
router.get('/action/:action', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { limit = 50, skip = 0 } = req.query;
    const logs = await AuditService.getLogsByAction(req.params.action, parseInt(limit), parseInt(skip));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get logs by action.' });
  }
});

// Get all audit logs (admin only)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { limit = 100, skip = 0 } = req.query;
    const logs = await AuditService.getAllLogs(parseInt(limit), parseInt(skip));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get all audit logs.' });
  }
});

// Get audit logs by date range (admin only)
router.get('/date-range', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { startDate, endDate, limit = 100 } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required.' });
    }

    const logs = await AuditService.getLogsByDateRange(
      new Date(startDate),
      new Date(endDate),
      parseInt(limit)
    );
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get logs by date range.' });
  }
});

// Get audit statistics (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const stats = await AuditService.getAuditStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get audit statistics.' });
  }
});

module.exports = router;
