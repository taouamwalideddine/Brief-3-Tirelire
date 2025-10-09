const mongoose = require('mongoose');

const UserShema = new mongoose.Schema({
    name :{type : String, required : true},
    email : { type : String, required : true, unique : true},
    password: {type : string, required, unique :true},
    role : {type : string, default : 'particulier'},
    nationalID: {type : String},
    KycStatus: {type : string, default: 'Pending'},}
,{timestamps: true});

module.exports = mongoose.model('User', UserShema);