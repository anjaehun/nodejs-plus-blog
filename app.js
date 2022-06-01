const express = require("express");
const mongoose = require("mongoose");
const Joi = require("joi");
const User = require("./models/user");

const Boards = require("./models/board");
const Comment = require("./models/comment");

const jwt = require("jsonwebtoken");
const moment = require("moment");
const authMiddleware = require("./middlewares/auth-middleware")

mongoose.connect("mongodb://localhost/shopping-demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();



//const writeDate = Boards.moment().startOf('day');


const postUsersSchema = Joi.object({
  nickname: Joi.string().required()
  .alphanum()
        .min(3)
        .max(30)
        .required(),
  email: Joi.string().email().required(),
          
  password: Joi.string().required()
            .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
  confirmPassword: Joi.string().required(),
});
// 회원가입 페이지 F
router.post("/users", async (req, res) => {
  try {
    const {
      nickname,
      email,
      password,
      confirmPassword,
    } = await postUsersSchema.validateAsync(req.body);


    if (password !== confirmPassword) {
      res.status(400).send({
        errorMessage: "패스워드가 패스워드 확인란과 동일하지 않습니다.",
      });
      return;
    }

    const existUsers = await User.find({
      $or: [{ email }, { nickname }],
    });
    if (existUsers.length) {
      res.status(400).send({
        errorMessage: "이미 가입된 이메일 또는 닉네임이 있습니다.",
      });
      return;
    }

    const user = new User({ email, nickname, password });
    await user.save();

    res.status(201).send({});
  } catch (err) {
    console.log(err);
    res.status(400).send({
      errorMessage: "요청한 데이터 형식이 올바르지 않습니다.",
    });
  }
});


router.post("/auth", async (req, res) => {
    const { email, password } = req.body;
    
  
    const user = await User.findOne({ email });
    console.log(user);
    // NOTE: 인증 메세지는 자세히 설명하지 않는것을 원칙으로 한다: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#authentication-responses
    if (!user || password !== user.password) {
      res.status(400).send({
        errorMessage: "이메일 또는 패스워드가 틀렸습니다.",
      });
      return;
    }
    // 로그인을 할떄 
    res.send({
      token: jwt.sign({ userId: user.nickname }, "gamzagamzawonggamza"),
    });
});


router.get("/users/me", authMiddleware, async (req, res) => {
  res.send({ user: res.locals.user });
});

// 데이터 넣기 (CRUD 중 C(create))
// 게시판에 글을 개시할 수 있다. 

router.post("/boards", authMiddleware, async (req, res) => {
  const {comment,writeDate,boardsId,title} = req.body; 
  const user = res.locals.user;
  const nickname = user.nickname;
  
  console.log(nickname);
  console.log(nickname,comment,writeDate,boardsId);
  
  const boards = await Boards.find({ boardsId });
   
  
  if(boards.length){
      return res.json({success : false, errorMessage:"이미 있는 데이터 입니다 "}); // 데이터가 있는지 없는지 체크 
  }
  
  const createdBoards = await Boards.create({ nickname,comment,writeDate,boardsId,title})


  res.json({ boards: createdBoards });
});

// 데이터 목록 보기 (CRUD 중 R(read))
// 데이터 전체를 볼 수 있다. 
router.get("/boards",  async (req, res) => {
  const boards = await Boards.find({}, {boardsId:1,nickname:1,comment:1,comment:1,writeDate:1}).sort({writeDate:-1});
  res.json({ boards });
});

// 데이터 목록 중 1개 보기 (CRUD 중 R(read))  
// boardsId 번호를 조회해 같은 게시글을 찾아내는 기능 
router.get("/boards/:boardsId", async (req, res) => {
  const { boardsId } = req.params;
  const boardsfind = await Boards.findOne({ boardsId });
  res.json({ boardsfind });
});

// 업데이트 
//  UPDATE users SET a=1 WHERE b='q' 참고한 sql 구문 
//db.users.updateOne(("zip":"12534"),{"$set":{"pop":17630,"다른 고칠것":17630}})
router.put("/boards/:boardsId/update/",authMiddleware, async (req, res) => {
  const { boardsId } = req.params;
  const { comment,title} = req.body;
  const user = res.locals.user;
  //console.log(password);
                                
  const boardOne = await Boards.find({boardsId:Number(boardsId),nickname:user.nickname})
  console.log(boardOne.length);
  if (boardOne.length > 0) {
    await Boards.updateOne({boardsId:Number(boardsId)}                            // 조건문 수정하고자 하는 번호가 같을 때 
                           ,{"$set":{comment:comment,title:title}});  // 밑에 조건들을 충족 하는 것을 수정함                                    
  }
 
  res.json({success:true});
});
 
// 삭제 
router.delete("/boards/:boardsId/delete/",authMiddleware, async (req, res) => {   
  const { boardsId } = req.params;
  const user = res.locals.user;
 

  const boardOne = await Boards.find({boardsId:Number(boardsId),nickname:user.nickname})
  //console.log(boardOne.length);
  if (boardOne.length > 0) { 
     await Boards.remove({boardsId:Number(boardsId)});
  } 
  res.json({success:true});
});

/////////////////////////////////////////////////
//댓글 작성
/////////////////////////////////////////////////

/**
 * 댓글 보기  * 
 */
 router.get("/boards/:boardsId/comment",  async (req, res) => {
   const {boardsId}=req.params;
  const boards = await Comment.find({boardsId:boardsId}, {nickname:1,comment:1}).sort({writeDate:-1});
  res.json({ boards });
});

/**
 * 댓글 작성 밑 수정 
 */
router.put("/boards/:boardsId/comment", authMiddleware, async (req, res) => {
  const { nickname } = res.locals.user;
  const { boardsId } = req.params;
  const { comment } = req.body;

  const existsComment = await Comment.findOne({
    commentId,
    boardsId,
  }).exec();

  if (existsComment) {
    existsComment.comment = comment;
    await existsComment.save();
  } else {
    const commentary = new Comment({
      nickname,
      boardsId,
      comment,
    });
    await commentary.save();
  }

  res.send({});
});


router.post("/boards", authMiddleware, async (req, res) => {
  const {comment,writeDate,boardsId,title} = req.body; 
  const user = res.locals.user;
  const nickname = user.nickname;
  
  console.log(nickname);
  console.log(nickname,comment,writeDate,boardsId);
  
  const boards = await Boards.find({ boardsId });
   
  
  if(boards.length){
      return res.json({success : false, errorMessage:"이미 있는 데이터 입니다 "}); // 데이터가 있는지 없는지 체크 
  }
  
  const createdBoards = await Boards.create({ nickname,comment,writeDate,boardsId,title})


  res.json({ boards: createdBoards });
});

/**
 * 댓글 등록
 */
 router.post("/boards/:boardsId/comment", authMiddleware, async (req, res) => {
  const {comment,commentId} = req.body; 
  const {boardsId} = req.params;
  const {nickname} = res.locals.user;
    if(!comment){
        return res.status(400).json({success : false , errorMessage:"댓글 입력하셈"});
    }
   console.log("등록전입니다");
     const createComment = await Comment.create({ 
                         nickname:nickname, 
                         comment:comment, 
                         boardsId:boardsId, 
                         commentId:commentId                    
    });
    console.log("등록입니다"+createComment);
  res.json({comment:createComment});
});

/**
 * 댓글 삭제 
 */
router.delete("/boards/:boardsId/delete/:commentId",authMiddleware, async (req, res) => {   
  const { boardsId,commentId } = req.params;
  const user = res.locals.user;
 

  const boardOne = await Comment.find({boardsId:boardsId,nickname:user.nickname,commentId,commentId})
  //console.log(boardOne.length);
  if (boardOne.length > 0) { 
     await Comment.remove({commentId:commentId});
     res.json({success:true});
     return;
    } 
});

// json 쪽으로 넣은 후 
app.use(express.json());
app.use("/api", express.urlencoded({ extended: false }), router);

app.use(express.static("assets"));

app.listen(8080, () => {
  console.log("서버가 요청을 받을 준비가 됐어요");
});

