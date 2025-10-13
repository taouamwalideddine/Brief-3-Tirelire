const express = require('express');
const Group = require('../models/Group');
const auth = require('../models/User');
const router=express.Router();

router.post('/create', auth, async(req, res)=>{
    const{name, contributionAmount} = req.body;
    try{
        const group = new Group({
            name,
            contributionAmount,
            admin:req.user.userId,
            members:[req.user.userId],
            turns: [{user: req.user.userId, hasRecieved: false}]
        });await group.save();
        res.status('201').json(group);
    }catch(error){
        res.status('500').json({message:'group creation failed'});
    }
});

// checkpooint, join a group

router.post('/join:group', auth, async(req, res)=>{
    try{
        const group = await Group.findById(req.params.grouId);
        if(!group) return res.status(404).json({message: 'unable to find the group'});
        if(group.members.includes(req.user.userId)){
            return res.status(400).json({message: 'User already in group'});
        }
        
        group.members.push(req.user.userId);
        group.turns.push({user: req.userId, hasRecieved: false});
        await group.save();
        res.json({message:'joined group.', group});
    } catch (error){
        res.status(500).json({message:'Error, couldnt joint the group'});
    }
});

// checkpoint, listing groups(admin)
router.get('/', auth, async (req, res) => {
    try{
        if(req.user.role === 'Admin'){
            const groups = await Group.find().populate('members','name email');
            return res.json(groups)
        }
        const groups = await Group.find({members: req.user.userId});
        res.json(groups);
    }catch(error){
        res.status(500).json({message : 'failked to get groups'});
    }
})

// checkpoint, get group by id

router.get('/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if(
      !group.members.map(id => id.toString()).includes(req.user.userId) &&
      req.user.role !== 'Admin'
    ){
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get group details.' });
  }
});

// submition
router.post('/:groupId/contribute', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (!group.members.includes(req.user.userId)) 
      return res.status(403).json({ message: 'Not a group member.' });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const hasPaid = group.contributions.some(c => 
      c.user.toString() === req.user.userId &&
      c.date.getMonth() === currentMonth && 
      c.date.getFullYear() === currentYear &&
      c.paid
    );

    if (hasPaid) return res.status(400).json({ message: 'Contribution for this month already recorded.' });

    group.contributions.push({
      user: req.user.userId,
      amount: group.contributionAmount,
      paid: true,
      date: new Date()
    });

    await group.save();

    res.json({ message: 'Contribution submitted successfully.', contributions: group.contributions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record contribution.' });
  }
});

router.get('/:groupId/contributions', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (!group.members.includes(req.user.userId) && req.user.role !== 'Admin')
      return res.status(403).json({ message: 'Access denied.' });

    let contributions;
    if (req.user.role === 'Admin') {
      contributions = group.contributions;
    } else {
      contributions = group.contributions.filter(c => c.user.toString() === req.user.userId);
    }

    res.json(contributions);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch contributions.' });
  }
});


module.exports = router;