const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User  = require('../models/User');
const auth  = require('../middlewares/auth');
const { dir } = require('console');
const { json } = require('stream/consumers');

const router = express.Router();

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir, {recursive: true});
        }
        cb(null, dir);
    },filename: function(req, file, cb){
        cb(null, req.User.userId + path.extname(file.originalname));
    },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedTypes.test(ext)) {
      return cb(new Error('Only images are allowed'));
    }
    cb(null, true);
  },
});

router.post('/submit', auth, upload.single('nationalIDImage'), async(req, res) =>{
    try{
        const{nationalID} = req.body;
        if(!nationalID || !req.file){
            return res.status(400).json({ message: 'National Id and image are required'});
        }
        const user = await User.findById(req.user.userId);
        user.nationalID = nationalID;
        user.nationalIDImagePath = req.file.path;
        user.KycStatus = 'Pending';
        await user.save();

        res.json({message : 'KYC data submitted succesfully, pending verification'});
    }catch(error){
        res.status(500).json({message : 'failed to submit KYC data.'})
    };
});

// admin
router.post('/verify/:userId', auth, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }
  const { status } = req.body;

  if (!['Verified', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.kycStatus = status;
    await user.save();

    res.json({ message: `User KYC status set to ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'KYC verification update failed' });
  }
});

module.exports = router;