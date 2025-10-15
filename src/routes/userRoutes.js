const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middlewares/auth');
const jwt = require('jsonwebtoken');

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
            res.status(500).json({message: error.message});
        }
});

router.post('/login', async(req, res) =>{
    const{email, password} = req.body;

    try{
        const user = await User.findOne({email});
        if (!user) return res.status(400).json({ message: 'invalid credentials'});
        
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({message: 'Invalid credentials'});

        const payload = {userId: user._id, role: user.role};

        const token = jwt.sign(payload,process.env.JWT_SECRET,{expiresIn: '1h'});

        res.json({ token });
    }
    catch(error){
        res.status(500).json({message : 'server error'});
    }
});

router.get('/protected', auth, (req, res) => {res.send(`hi user!! ${req.user.userId}`);});

module.exports = router;