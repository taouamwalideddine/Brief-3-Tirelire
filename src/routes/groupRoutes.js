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

module.exports = router;