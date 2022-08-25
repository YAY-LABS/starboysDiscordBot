const { model, Schema } = require('mongoose');
module.exports = model(
  'Profile',
  new Schema({
    GuildID: String,
    UserID: { type: String, unique: true },
    Wallet: Number,
    Bank: Number,
    lastDaily: Date,
    lastWeekly: Date,
    lastMonthly: Date,
    lastReview: Date,
  })
);
