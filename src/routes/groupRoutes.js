const express = require('express');
const Group = require('../models/Group');
const auth = require('../middlewares/auth');
const kycCheck = require('../middlewares/kycCheck');
const ReliabilityService = require('../services/reliabilityService');
const router = express.Router();

router.post('/create', auth, kycCheck, async (req, res) => {
  const { name } = req.body;
  try {
    const group = new Group({
      name,
      admin: req.user.userId,
      members: [req.user.userId],
      turns: [{ user: req.user.userId, hasReceived: false }],
      contributions: []
    });
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create group.' });
  }
});

router.post('/join/:groupId', auth, kycCheck, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (group.members.includes(req.user.userId)) {
      return res.status(400).json({ message: 'User already in group.' });
    }

    group.members.push(req.user.userId);
    group.turns.push({ user: req.user.userId, hasReceived: false });
    await group.save();
    res.json({ message: 'Joined group.', group });
  } catch (error) {
    res.status(500).json({ message: 'Could not join group.' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role === 'Admin') {
      const groups = await Group.find().populate('members', 'name email');
      return res.json(groups);
    }
    const groups = await Group.find({ members: req.user.userId });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get groups.' });
  }
});

router.get('/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (
      !group.members.map(id => id.toString()).includes(req.user.userId) &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get group details.' });
  }
});

router.post('/:groupId/mark-paid', auth, kycCheck, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (!group.members.includes(req.user.userId)) 
      return res.status(403).json({ message: 'Not a member.' });

    const now = new Date();
    const period = `${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()}`;

    const alreadyMarked = group.contributions.some(
      c => c.user.toString() === req.user.userId && c.period === period
    );

    if (alreadyMarked)
      return res.status(400).json({ message: 'Contribution already marked for this period.' });

    const contribution = {
      user: req.user.userId,
      period,
      markedDone: true,
      contributed: true,
      contributedAt: new Date(),
      round: group.currentRound
    };

    group.contributions.push(contribution);

    // Award reliability points for timely contribution
    await ReliabilityService.awardTimelyContribution(req.user.userId, 10);

    await group.save();

    res.json({ 
      message: `Marked contribution as done for ${period}.`, 
      contributions: group.contributions,
      reliabilityPointsAwarded: 10
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark contribution.' });
  }
});

router.get('/:groupId/contributions/:period', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'name');
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (!group.members.includes(req.user.userId) && req.user.role !== 'Admin')
      return res.status(403).json({ message: 'Access denied.' });

    const period = req.params.period;
    const contributions = group.contributions.filter(c => c.period === period);

    res.json(contributions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contributions.' });
  }
});

// Get current turn information
router.get('/:groupId/current-turn', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (!group.members.includes(req.user.userId) && req.user.role !== 'Admin')
      return res.status(403).json({ message: 'Access denied.' });

    const currentTurn = group.getCurrentTurnUser();
    const currentTurnUser = currentTurn ? group.members.find(m => m._id.toString() === currentTurn.user.toString()) : null;

    res.json({
      currentRound: group.currentRound,
      currentTurnIndex: group.currentTurnIndex,
      currentTurnUser: currentTurnUser,
      isCurrentUserTurn: currentTurn && currentTurn.user.toString() === req.user.userId,
      allContributionsCollected: group.areAllContributionsCollected()
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get current turn information.' });
  }
});

// Mark turn as received (only by the current turn user)
router.post('/:groupId/receive-turn', auth, kycCheck, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (!group.members.includes(req.user.userId))
      return res.status(403).json({ message: 'Not a member of this group.' });

    const currentTurn = group.getCurrentTurnUser();
    if (!currentTurn || currentTurn.user.toString() !== req.user.userId) {
      return res.status(400).json({ message: 'It is not your turn to receive the pot.' });
    }

    if (!group.areAllContributionsCollected()) {
      return res.status(400).json({ message: 'All contributions must be collected before receiving the pot.' });
    }

    await group.markTurnReceived(req.user.userId);
    await group.advanceTurn();

    res.json({ message: 'Turn marked as received. Next turn advanced.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark turn as received.' });
  }
});

// Advance to next turn (admin only)
router.post('/:groupId/advance-turn', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (req.user.role !== 'Admin' && group.admin.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only admin can advance turns.' });
    }

    await group.advanceTurn();
    const currentTurn = group.getCurrentTurnUser();

    res.json({ 
      message: 'Turn advanced successfully.',
      currentRound: group.currentRound,
      currentTurnIndex: group.currentTurnIndex,
      currentTurnUser: currentTurn ? currentTurn.user : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to advance turn.' });
  }
});

// Get group statistics
router.get('/:groupId/stats', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'name email reliabilityScore');
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (!group.members.includes(req.user.userId) && req.user.role !== 'Admin')
      return res.status(403).json({ message: 'Access denied.' });

    const stats = {
      totalMembers: group.members.length,
      currentRound: group.currentRound,
      completedRounds: group.completedRounds.length,
      totalContributions: group.contributions.length,
      currentRoundContributions: group.contributions.filter(c => c.round === group.currentRound).length,
      membersWithReliabilityScores: group.members.map(member => ({
        name: member.name,
        email: member.email,
        reliabilityScore: member.reliabilityScore
      }))
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get group statistics.' });
  }
});

// Get user reliability score
router.get('/:groupId/reliability/:userId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (!group.members.includes(req.user.userId) && req.user.role !== 'Admin')
      return res.status(403).json({ message: 'Access denied.' });

    const userScore = await ReliabilityService.getUserScore(req.params.userId);
    res.json(userScore);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get reliability score.' });
  }
});

// Get top reliable users in the group
router.get('/:groupId/top-reliable', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'name email reliabilityScore');
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (!group.members.includes(req.user.userId) && req.user.role !== 'Admin')
      return res.status(403).json({ message: 'Access denied.' });

    const topUsers = group.members
      .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
      .slice(0, 5)
      .map(member => ({
        name: member.name,
        email: member.email,
        reliabilityScore: member.reliabilityScore
      }));

    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get top reliable users.' });
  }
});

module.exports = router;
