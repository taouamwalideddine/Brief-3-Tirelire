const mongoose = require('mongoose');

const UserShema = new mongoose.Schema({
    name :{type : String, required : true},
    email : { type : String, required : true, unique : true},
    password: {type : string, required, unique :true},
    role : {type : string, default : 'particulier'},
    nationalID: {type : String},
    KycStatus: {type : string, enum: ['Pending','Verified','Rejected'], default: 'Pending'},
    nationalIDImagePath: {type: String},}
,{timestamps: true});

module.exports = mongoose.model('User', UserShema);