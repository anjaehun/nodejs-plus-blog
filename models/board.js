const mongoose = require("mongoose");
const moment = require("moment");

const BoardsSchema = new mongoose.Schema({
  nickname: String, 
  comment : String, 
  title : String , 
  writeDate: {
      type: Date, 
      default: Date.now,
  },
  boardsId:{ 
    type : String, 
    required : true, 
    unique : true,
 }, 


 
});


module.exports = mongoose.model("Boards", BoardsSchema);