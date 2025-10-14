const mongoose = require('mongoose');

const UserShema = new mongoose.Schema({
    name :{type : String, required : true},
    email : { type : String, required : true, unique : true},
    password: {type : String, required : true},
    role : {type : String, default : 'particulier'},
    nationalID: {type : String},
    KycStatus: {type : String, enum: ['Pending','Verified','Rejected'], default: 'Pending'},
    nationalIDImagePath: {type: String},
    reliabilityScore: {type: Number, default: 0}
}
,{timestamps: true});

module.exports = mongoose.model('User', UserShema);