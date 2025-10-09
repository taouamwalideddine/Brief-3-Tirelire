const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { model } = require('mongoose');

const router = express.Router();

router.post('/register', async(req,res)=> {
    const{ name, email,password} =req.body;

    try{
        let user = await User.findOne({email});
        if (user) return res.status(400).json({message:'User already exits'});
        
        const hashedPassword = await bcrypt.hash(password, 10);

        user = new User ({name, email, password : hashedPassword});
        await user.save();

        res.status(201).json({message: 'User register successfully.'});
    }
    catch(error){
            res.status(500).json({message: 'SERVER NOT WORKING!!'});
        }
});

module.exports = router;