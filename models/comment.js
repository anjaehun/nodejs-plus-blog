const mongoose = require("mongoose");
const moment = require("moment");

const CommentSchema = new mongoose.Schema({ 
  nickname: String,
  boardsId: {
    type : String,
    unique : false,
  },
  comment : String,  
  writeDate: {
    type: Date, 
    default: Date.now,
  },
  commentId:{
    type : String,
  }

});


module.exports = mongoose.model("Comment", CommentSchema);