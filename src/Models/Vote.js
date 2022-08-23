const { model, Schema } = require('mongoose');
module.exports = model(
  'Vote',
  new Schema({
    VoteID: Number, //ADMIN
    FirstList: [String],
    SecondList: [String],
    FirstWinnerList: [Number],
    SecondWinnerList: [Number],
    StartDate: Date,
    EndDate: Date,
  })
);
