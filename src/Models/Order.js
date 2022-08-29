const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const schema = new mongoose.Schema({
  GuildID: String,
  UserID: String,
  UserName: String,
  Address: String,
  Phone: String,
  Size: String,
  GoodsNumber: Number,
  OrderDate: Date,
});

schema.plugin(AutoIncrement, { inc_field: 'OrderID' });

module.exports = mongoose.model('Order', schema);
