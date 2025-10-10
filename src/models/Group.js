const mongoose = require ('mongoose');

const GroupShema = new mongoose.Schema({
    name:{type : String, required: true},
    members : [{ type : mongoose.Schema.Types.ObjectId, ref: 'User'}],
    contributionAmount: {type:Number,required: true},
    turns:[{user:{type:Number,required: true}}],
    admin:{type : mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
},{timestamps: true});

module.exports = mongoose.model('Group', GroupShema);