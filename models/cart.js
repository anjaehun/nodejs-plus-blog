const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  commentId: String,
  goodsId: String,
  comment: String,
  createDt : String,
});
module.exports = mongoose.model("Cart", CartSchema);