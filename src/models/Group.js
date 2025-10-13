const mongoose = require ('mongoose');


const ContributionSchema = new mongoose.Schema({
  user: {    type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  paid: { type: Boolean, default: false },
});

const TurnSchema = new mongoose.Schema({
  user: { type:mongoose.Schema.Types.ObjectId,ref: 'User', required: true },
  hasReceived: {type: Boolean,default: false },
});

const GroupSchema = new mongoose.Schema({
  name:{type:String,required:true},
  members: [{type:mongoose.Schema.Types.ObjectId, ref:'User'}],
  contributionAmount: { type:Number,required:true},
  turns: [TurnSchema],
  contributions: [ContributionSchema],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps:true });

module.exports = mongoose.model('Group', GroupShema);