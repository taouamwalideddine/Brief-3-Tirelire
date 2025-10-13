const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User  = require('../models/User');
const auth  = require('../middlewares/auth');
const { dir } = require('console');

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
})

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