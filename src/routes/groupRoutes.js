const express = require('express');
const Group = require('../models/Group');
const auth = require('../middlewares/auth');
const router = express.Router();

router.post('/create', auth, async (req, res) => {
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

router.post('/join/:groupId', auth, async (req, res) => {
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

router.post('/:groupId/mark-paid', auth, async (req, res) => {
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

module.exports = router;
