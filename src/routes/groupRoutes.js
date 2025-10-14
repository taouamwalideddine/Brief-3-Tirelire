const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middlewares/auth');
const kycCheck = require('../middlewares/kycCheck');
const logging = require('../middlewares/logging');
const router = express.Router();

router.post('/create', auth, kycCheck, logging('CREATE_GROUP', 'Group'), async (req, res) => {
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

router.post('/join/:groupId', auth, kycCheck, logging('JOIN_GROUP', 'Group'), async (req, res) => {
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

router.post('/:groupId/mark-paid', auth, kycCheck, logging('MARK_PAID', 'Group'), async (req, res) => {
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

    group.contributions.push({
      user: req.user.userId,
      period,
      markedDone: true
    });

    const user = await User.findById(req.user.userId);
    user.reliabilityScore += 1;
    await user.save();

    await group.save();

    res.json({ message: `Marked contribution as done for ${period}.`, contributions: group.contributions });
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

router.post('/:groupId/set-contribution-amount', auth, kycCheck, logging('SET_CONTRIBUTION_AMOUNT', 'Group'), async (req, res) => {
  try {
    const { amount } = req.body;
    const group = await Group.findById(req.params.groupId);
    
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.admin.toString() !== req.user.userId) 
      return res.status(403).json({ message: 'Only admin can set contribution amount.' });

    group.contributionAmount = amount;
    group.totalRounds = group.members.length;
    await group.save();

    res.json({ message: 'Contribution amount set successfully.', group });
  } catch (error) {
    res.status(500).json({ message: 'Failed to set contribution amount.' });
  }
});

router.post('/:groupId/advance-turn', auth, kycCheck, logging('ADVANCE_TURN', 'Group'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'name reliabilityScore');
    
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.admin.toString() !== req.user.userId) 
      return res.status(403).json({ message: 'Only admin can advance turns.' });

    if (group.currentTurn >= group.members.length) {
      group.currentRound += 1;
      group.currentTurn = 0;
    }

    group.currentTurn += 1;
    const currentUser = group.members[group.currentTurn - 1];
    
    group.turns.push({
      user: currentUser._id,
      hasReceived: false
    });

    await group.save();

    res.json({ 
      message: 'Turn advanced successfully.', 
      currentRound: group.currentRound,
      currentTurn: group.currentTurn,
      currentUser: currentUser.name,
      group 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to advance turn.' });
  }
});

router.post('/:groupId/mark-received', auth, kycCheck, logging('MARK_RECEIVED', 'Group'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.admin.toString() !== req.user.userId) 
      return res.status(403).json({ message: 'Only admin can mark as received.' });

    const currentTurn = group.turns[group.turns.length - 1];
    if (!currentTurn) return res.status(400).json({ message: 'No active turn.' });

    currentTurn.hasReceived = true;
    await group.save();

    res.json({ message: 'Marked as received successfully.', group });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as received.' });
  }
});

router.get('/:groupId/logs', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (!group.members.includes(req.user.userId) && req.user.role !== 'Admin')
      return res.status(403).json({ message: 'Access denied.' });

    const Log = require('../models/Log');
    const logs = await Log.find({ groupId: req.params.groupId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch logs.' });
  }
});

module.exports = router;
