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
