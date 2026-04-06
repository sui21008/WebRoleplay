const express = require('express'); //express:webアプリケーションフレームワーク
const {createServer} = require('node:http'); //const{}:分割代入 httpモジュールからcreateServer関数を取り出している
const path = require('node:path'); //path.join : ディレクトリ名を表すパスと、ディレクトリ名あるいはfile名を結合する
const {Server} = require('socket.io');
const bodyParser = require('body-parser'); //htmlからデータを受け取るやつ
const mariadb = require('mariadb');
const bcrypt = require('bcrypt'); //hash
const session = require('express-session'); 
const passport = require('passport'); //認証
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const reply = require('./utils/reply'); //reply.jsを読み込む
const validateAnswer = require('./utils/validateAnswer'); //validatAnswer.jsを読み込む（正誤判定）
const calcWordComprehension = require('./utils/calcWordComprehension'); //calcComprehension.jsを読み込む（理解度計算）
const calcTotalComprehension = require('./utils/calcTotalComprehension');
const generateMistake = require('./utils/generateMistake');
const getInfo  = require("./utils/getInfo")
const firstMessage = require("./utils/firstMessage");
const createRoom = require("./utils/createRoom");
const finalReply = require("./utils/finalReply");
const pointout = require("./utils/pointout");
const calcAccuracy = require("./utils/calcAccuracy");
const {matching, desideRole} = require("./utils/matching");
const toLearnerInstance = require("./utils/toLearnerInstance");
//const desideRole = require("./utils/desideRole");
const fs = require('fs');
const Learner = require("./classes/Learner");
const Room = require("./classes/Room");
const winston = require('winston');
const logger = require('./logger');
require('winston-daily-rotate-file');


const app = express();
const server = createServer(app);//関数ハンドラとして初期化
const port = process.env.PORT || 3000;
const io = new Server(server,{
    connectionStateRecovery: {}
});

const situation = JSON.parse(fs.readFileSync("public/lesson_data/lesson.json"));
const modelAnswers = JSON.parse(fs.readFileSync("public/lesson_data/model_answers.json"));


//データベース関連
const pool = require('./config/db');


var roomState = {}; //どのルームでどのシチュエーションが選択されているかを保存する配列

const roomsBySituation = {};
situation.forEach(situ => {
    roomsBySituation[situ.scenenum] = [];
})



app.use(express.static(path.join(__dirname, 'public/css')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const sessionMiddleware = (session({
    secret: process.env.SESSION_SECRET || 'secret key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 30 * 60 * 1000
    }
}));

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());  // フラッシュメッセージの使用


//テンプレートエンジンEJSの利用
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

io.engine.use(sessionMiddleware);

//ユーザー名やパスワードを使った認証を行うための戦略
passport.use(new LocalStrategy(async (username, password, done) => {
    let conn;
    try {
        conn = await pool.getConnection();
        

        const rows = await conn.query("SELECT * FROM users WHERE name = ?", [username]);
        if (rows.length === 0) {
            return done(null, false, { message: '登録されていないユーザー名です' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return done(null, false, { message: 'パスワードが違います' });
        }
        conn.release();
        return done(null, user);
    } catch (err) {
        logger.error(`${username}: ${err}`);
        return done(err);
    } finally {
        if (conn){
            conn.release(); // 接続をリリースする
        } 
    }
}));
    
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser(async (user, done) => {
    done(null, user);
});



logger.info("===サーバー起動===")
//GETリクエストの処理

app.post('/test-start', (req, res) => {
    logger.info('===Playwrightテスト開始===');
    res.sendStatus(200);
});

app.post('/test-end', (req, res) => {
    logger.info('===Playwrightテスト終了===');
    res.sendStatus(200);
});
//第一引数に"/"を指定することでWebサイトのトップページを開いたときのリクエスト処理にする
app.get("/",(req,res) => {
    res.render('index',{ message: req.flash('error') });
    
    
});

//新規登録画面
app.get("/register", (req,res) => {
    res.render('register');
})

app.post("/register", async (req,res) => {
    let username = req.body.new_nameform;
    let password = req.body.new_password;
    let conn;
    if(!username || !password){
        return res.redirect('/register');
    }
    try {
        conn = await pool.getConnection();
        //idの設定
        const count = await conn.query("SELECT MAX(id) AS maxId FROM users");
        const nextId = count[0].maxId + 1;

        //パスワードのハッシュ化
        const hash = await bcrypt.hash(password, 10);
        await conn.query("INSERT INTO users (name, password,id) VALUES (?, ?, ?)", [username, hash, nextId]);
        conn.release();
        res.redirect('/');
    } catch (err) {
        console.error(err);
        logger.error(`${username}: ${err}`)
        res.redirect('/register');
    } finally {
        if (conn){
            conn.release(); // 接続をリリースする
        } 
    }

})

app.post('/login', (req, res, next) => {
    // Passport.jsの認証を実行
    req.session.reqComprehension = 100; //希望理解度の初期値
    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) {
            req.flash('error', info.message); // フラッシュメッセージを設定
            return res.redirect('/'); // 認証失敗時のリダイレクト
        }
        req.logIn(user, (err) => {
            if (err) { return next(err); }
            // 認証成功時のリダイレクト
            req.session.name = user.name;
            req.session.userId = user.id;
            logger.info(`${req.session.name}：ログイン`)
            return res.redirect('/mode');
        });
    })(req, res, next);
});

//モード選択画面
app.get('/mode', (req,res) => {
    if(req.isAuthenticated()) {
        res.render('mode');
    }else{
        res.redirect('/');
    }
})

app.post('/mode', async(req,res) => {
    if(!req.body.mode){
        return res.redirect(`/mode`);
    }
    
    req.session.mode = req.body.mode;
    logger.info(`${req.session.name}：${req.session.mode}を選択`)

    //各レッスンで得る情報を初期化
    req.session.wordMistakeCount = []; //間違えた単語とその回数
    req.session.pointoutWord = []; //指摘に成功した単語のリスト
    req.session.pointoutResult = []; //指摘の結果
    req.session.pointoutMistakeList = []; //CLAが学習者に指摘できない単語のリスト
    if(req.session.mode === 'single'){
        req.session.room = await createRoom.createRoom(req.user.id);
        req.session.checkValue = 'createRoom'; //req.session.checkValue: 部屋を作成(createRoom)か参加(joinRoom)か
        res.redirect('/situation');

    }else if(req.session.mode === 'friend'){
        res.redirect('/friend');
    }else if(req.session.mode === 'multi'){
        res.redirect('/situation');
    }
        
})

//フレンドモード画面
app.get('/friend', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('friend', { user: req.user, friendMessage: req.query.friendMessage || '' });
    } else {
        res.redirect('/');
    }
});

app.post("/friend", async(req, res) => {
    req.session.checkValue = req.body.room;
    let friendMessage = '';

    if (!req.session.checkValue) {
        friendMessage = '選択してください';
        return res.redirect(`/friend?friendMessage=${encodeURIComponent(friendMessage)}`);
    }

    //部屋に参加の場合
    if (req.session.checkValue === 'joinRoom') {
        req.session.room = req.body.roomID;
        if (!req.session.room) {
            friendMessage = 'ルームIDを入力してください';
            return res.redirect(`/friend?friendMessage=${encodeURIComponent(friendMessage)}`);
        }
        //入力されたルームIDが存在するか検索
        const roomSituation = Object.values(roomState).find(situation => situation.roomid === req.session.room);
        if(roomSituation){
            try {
                const conn = await pool.getConnection();
                
                // 同じ人が２回目に入ったときはデータベースに保存しない
                const roomMember = await conn.query("SELECT user1_id, user2_id FROM room_logs WHERE room_id = ?", [req.session.room]);
                if (roomMember.length > 0) {  // 結果があるか確認
                    const { user1Id, user2Id } = roomMember[0]; 
                    // user1_idとuser2_idのどちらにも今のユーザーIDが含まれていない場合に保存
                    if (user1Id !== req.user.id && user2Id !== req.user.id) {
                        await conn.query("UPDATE room_logs SET user2_id = ? WHERE room_id = ?", [req.user.id, req.session.room]);
                    }
                }
            
                conn.release();
            } catch (err) {
                console.error('user2を保存できませんでした', err);
            }
            res.redirect(`/chat/${roomSituation.scenenum}`);
        }else{
            friendMessage = 'そのルームは開かれていません'
            return res.redirect(`/friend?friendMessage=${encodeURIComponent(friendMessage)}`);
        }
        //console.log("scenenum: " + sceneNumber);
        
    //部屋を作成の場合
    }else if(req.session.checkValue === 'createRoom') {
        req.session.room = await createRoom.createRoom(req.user.id);
        console.log(req.session.room);
        
    
        res.redirect('situation'); // シチュエーション選択画面
    }
    
})




//シチュエーション選択画面
app.get("/situation",(req,res) => {
    if (req.isAuthenticated()) {
        const arraySituation = Object.values(situation);
        res.render('situation', {array_situation: arraySituation,mode: req.session.mode});
    } else {
        res.redirect('/');
    }
})



//希望理解度・ロール選択画面(シングル・フレンドモード)
app.get("/comprehension/:scene", async(req,res) => {
    if(req.isAuthenticated()) {
        var totalComprehension = await calcTotalComprehension.calcTotalComprehension(req.session.name);
        req.session.sceneNumber = req.params.scene;
        res.render('comprehension',{totalComprehension: totalComprehension, scene:req.session.sceneNumber, comprehensionMessage: req.query.comprehensionMessage|| '' });
        
    }else{
        res.redirect('/');
    }
})

app.post("/comprehension", (req, res) => {
    let comprehensionMessage = '';
    //var scenenum = req.body.sceneNumber;
    if (!req.body.comprehension) {
        comprehensionMessage = '理解度を入力してください';
        return res.redirect(`/comprehension/${req.session.sceneNumber}?comprehensionMessage=${encodeURIComponent(comprehensionMessage)}`);
    }else if(req.body.comprehension < 0 || req.body.comprehension > 100){
        comprehensionMessage = '0~100の数値で入力してください';
        return res.redirect(`/comprehension/${req.session.sceneNumber}?comprehensionMessage=${encodeURIComponent(comprehensionMessage)}`);
    }
    if(!req.body.role){
        comprehensionMessage = 'ロールを選択してください';
        return res.redirect(`/comprehension/${req.session.sceneNumber}?comprehensionMessage=${encodeURIComponent(comprehensionMessage)}`);
    }
    req.session.reqComprehension = req.body.comprehension;
    req.session.role = parseInt(req.body.role);
    res.redirect(`/chat/${req.session.sceneNumber}`)

})

//希望理解度・ロール選択画面(マルチモード)
app.get("/multisetting/:scene", async(req,res) => {
    if(req.isAuthenticated()) {
        var totalComprehension = await calcTotalComprehension.calcTotalComprehension(req.session.name);
        req.session.sceneNumber = req.params.scene;
        const sceneData = Object.values(modelAnswers).find(scene => scene.scene_num == req.session.sceneNumber); 
        let role1Name = sceneData.role1_name;
        let role2Name = sceneData.role2_name;
        logger.info(`${req.session.name}：シーン${req.session.sceneNumber}を選択`)
        res.render('multisetting',{totalComprehension: totalComprehension, scene:req.session.sceneNumber, role1: role1Name, role2: role2Name, comprehensionMessage: req.query.comprehensionMessage || '' });
        
    }else{
        res.redirect('/');
    }
})

app.post("/multisetting", async(req, res) => {
    let comprehensionMessage = '';
    if (!req.body.comprehension) {
        comprehensionMessage = '理解度を入力してください';
        return res.redirect(`/multisetting/${req.session.sceneNumber}?comprehensionMessage=${encodeURIComponent(comprehensionMessage)}`);
    }
    if(!req.body.role){
        comprehensionMessage = 'ロールを選択してください';
        return res.redirect(`/multisetting/${req.session.sceneNumber}?comprehensionMessage=${encodeURIComponent(comprehensionMessage)}`);
    }
    
    var totalComp = await calcTotalComprehension.calcTotalComprehension(req.session.name);
    var reqComprehension = req.body.comprehension;
    var reqRole = parseInt(req.body.role);

    //Learnerオブジェクト作成（インスタンスをsessionに入れたらオブジェクト化されるから使うときにインスタンス化する）
    req.session.learnerData = {comp: totalComp, reqComp: reqComprehension, reqRole: reqRole};
    logger.info(`${req.session.name}：希望理解度 ${reqComprehension}, 希望ロール ${reqRole}, Learnerオブジェクト ${JSON.stringify(req.session.learnerData)}`)
    res.redirect(`/multi`)

})

//マルチモード画面
app.get('/multi', (req, res) => {
    if (req.isAuthenticated()) {
        const roomLength = roomsBySituation[req.session.sceneNumber].length;
        res.render('multi',{multiMessage: req.query.multiMessage|| '' , scene:req.session.sceneNumber|| '' ,roomLength:roomLength});
    } else {
        res.redirect('/');
    }
});

app.post('/multi', async(req, res) => {
    if(!req.body.multiRoom){
        multiMessage = '選択してください';
        return res.redirect(`/multi?multiMessage=${encodeURIComponent(multiMessage)}`);
    }
    req.session.checkValue = req.body.multiRoom;
    if(req.session.checkValue === "createMultiRoom"){
        req.session.room = await createRoom.createRoom(req.user.id);
        //ルーム作成
        const learner = toLearnerInstance.toLearnerInstance(req.session.learnerData);
        roomsBySituation[req.session.sceneNumber].push(new Room(learner, req.session.room));
        console.log(JSON.stringify(roomsBySituation));
        logger.info(`${req.session.name}：ルーム作成 ルームID:${req.session.room}`)
    }else if(req.session.checkValue === "joinMultiRoom"){
        //マッチング処理
        
    }
    res.redirect(`/waiting`)
})

//マッチング待機画面
app.get('/waiting', (req, res) => {
    if(req.isAuthenticated()){
        res.render('waiting',{situation: req.session.sceneNumber});
    }else{
        res.redirect('/');
    }
})

//ロールプレイ画面
app.get("/chat/:scene",async(req,res) => {
    if (req.isAuthenticated()) {
        //situationオブジェクトを配列にして、findを用いてsituation.ejsで選択されたsceneNumberに一致するsceneを探す
        req.session.scene = Object.values(situation).find(scene => scene.scenenum == req.params.scene); 
        req.session.sceneNumber = req.params.scene;
        console.log("sceneNumber: "+req.session.sceneNumber);
        if(req.session.scene){
            try {
                const conn = await pool.getConnection();
                await conn.query("UPDATE room_logs SET situation_num = ? WHERE room_id = ?",[req.session.sceneNumber, req.session.room]);
                conn.release();
            }catch(err){
                console.error('シチュエーションの保存ができませんでした', err);
            }
            res.render('chat',{usernamedata: req.user.name, roomiddata: req.session.room, joinorcreate: req.session.checkValue, mode: req.session.mode});
        } else {
            res.status(404).send('Scene not found');
        }
        
    } else {
        res.redirect('/');
    }
    
});

//フィードバック
app.get("/feedback",async(req,res) => {
    if(req.isAuthenticated()){
        //ログ
        var log;
        try {
            const conn = await pool.getConnection();
            log = await conn.query("SELECT message FROM message_logs WHERE room_id = ?", [req.session.room]);
            conn.release();
        } catch (err) {
            console.error('ログを送信できませんでした：', err);
        }

        //正解データ
        var modelAnswer = getInfo.getModelAnswer(req.session.sceneNumber);
        
        //学習者が間違えた単語
        var wordMistakeCount;
        if(req.session.wordMistakeCount){
            wordMistakeCount = req.session.wordMistakeCount;
        }else{
            console.log("wordMistakeCount is not found");
        }

        //ログにハイライト
        const hilightedModel = modelAnswer.map(text => {
            wordMistakeCount.forEach(word => {
                if(text.includes(word.word)){
                    const regex = new RegExp(`(${word.word})`,'g');
                    text = text.replace(regex, `<span class="mistake_word">$1</span>`);
                    
                }
            })
            return text;
        })

        

        
        //CLAが間違えた単語
        var CLAMistakes;
        if(req.session.mistakeList){
            CLAMistakes = req.session.mistakeList;
        }else{
            console.log("CLAMistakes is not found");
        }

        var wrongWordList = getInfo.getCLAMistake(CLAMistakes);
        //ログにハイライト
        const hilightedLog = log.map(text => {
            text = text.message;
            wrongWordList.forEach(word => {
                if(text.includes(word) && text.includes("CLA")){
                    const regex = new RegExp(`(${word})`,'g');
                    text = text.replace(regex, `<span class="CLAmistake_word">$1</span>`);
                    
                }
            })
            return text;
        })
        
        
        //指摘の結果
        var pointoutResult;
        if(req.session.pointoutResult){
            pointoutResult = req.session.pointoutResult;
        }else{
            console.log("pointoutResult is not found");
        }

        //正答率
        var accuracy = calcAccuracy.calcAccuracy(req.session.sceneNumber,req.session.role,req.session.wordMistakeCount);

        //指摘成功率
        var pointoutAccuracy = req.session.pointoutWord.length / CLAMistakes.length * 100;
        pointoutAccuracy = Math.round(Math.round(pointoutAccuracy * 10) / 10);

        res.render('feedback',{hilightedLog,hilightedModel,wordMistakeCount,CLAMistakes,pointoutResult,accuracy,pointoutAccuracy});
    }else{
        res.redirect('/');
    }
})

//フィードバック(マルチモード)
app.get("/multifeedback",async(req,res) => {
    if(req.isAuthenticated()){
        //ログ
        logger.info(`${req.session.name}：フィードバックに遷移`)
        var log;
        try {
            const conn = await pool.getConnection();
            log = await conn.query("SELECT message FROM message_logs WHERE room_id = ?", [req.session.room]);
            conn.release();
        } catch (err) {
            console.error('ログを送信できませんでした：', err);
        }

        const logMessage = log.map(text => {
            text = text.message;
            return text;
        })

        //正解データ
        var modelAnswer = getInfo.getModelAnswer(req.session.sceneNumber);
        
        res.render('multifeedback',{logMessage,modelAnswer});
    }else{
        res.redirect('/');
    }
})


let roomResults = {};
let roomCompletion = {};

//socket.io通信
io.on('connection', (socket) => {
    console.log('a user connected');
    const session = socket.request.session;
    socket.on('disconnect', () => {
        console.log('user disconnected');
    })

    let roleResult;
    

    function handleMatching(socket, session, matchingNgList) {
        try{
            var id = socket.id;
            console.log("マッチング開始");
            
            if(!session.sceneNumber){
                throw new Error("sceneNumber undefined");
            }
            if(session.checkValue === 'createMultiRoom'){
                socket.join(session.room);
            }else if(session.checkValue === 'joinMultiRoom'){
                socket.join('waiting');
                if(!roomsBySituation[session.sceneNumber]){
                    throw new Error(`roomsBySituation[${session.sceneNumber}] undefined`);
                }
                if(roomsBySituation[session.sceneNumber].length === 0){
                    io.to(id).emit('noRoom');
                    logger.info(`${session.name}：待機ルームなし`)
                    return;
                }
                let retryCount = 0;
                const maxRetry = roomsBySituation[session.sceneNumber].length;
                let result;
                let room;
            
                while(retryCount < maxRetry){
                    result = matching(session.learnerData, roomsBySituation[session.sceneNumber], matchingNgList);
                    if(!result){
                        throw new Error("result undefined");
                    }
                    if(result.room === null){
                        //マッチング可能なルームなし
                        io.to(id).emit('noRoom');
                        logger.info(`${session.name}：マッチング可能なルームなし`)
                        return;
                    }
                    room = roomsBySituation[session.sceneNumber].find(r => r.roomID === result.room.roomID);
                    logger.info(`${session.name}：マッチング結果(仮) ${JSON.stringify(result)}`)
                    if(room.isMatchable){
                        room.isMatchable = false;
                        break;
                    }
                    retryCount++;
                    logger.info(`${session.name}：room.isMatchableがfalseでした`)
                    
                }
                
                
                
                
                logger.info(`${session.name}：マッチング結果 ${JSON.stringify(result)}`)
                if(result.status === 0){ //両者の希望が満たされる
                    //ロールを確認する処理
                    roleResult = desideRole(session.learnerData.reqRole, result.room);
                    if(!roleResult){
                        throw new Error("role result undefined");
                    }
                    if(roleResult.status === 1){
                        logger.info(`${session.name}：ロール確認ダイアログを表示`)
                        io.to(id).emit('confirmRole');
                    }else{
                        //マッチング成立
                        console.log("matching成立")
                        const room = roomsBySituation[session.sceneNumber].find(r => r.roomID === result.room.roomID);
                        if(!room){
                            throw new Error("room undefined");
                        }
                        room.roles = {
                            createdLearnerRole: roleResult.roomRole,
                            joinedLearnerRole: roleResult.learnerRole
                        };
                        io.to(id).emit('matching complete', result.room.roomID);
                        io.to(result.room.roomID).emit('matching complete',result.room.roomID);
                        session.room = result.room.roomID;
                        session.save();
                        }
                }else if(result.status === 1){ //作成者の希望のみ満たされる　参加者にダイアログボックスを表示
                    logger.info(`${session.name}：作成者の希望〇参加者の希望× 参加者にダイアログ表示`)
                    io.to(id).emit('status1', result.room.roomID, result.room.createdLearner.comp,Math.round(session.learnerData.comp*100)/100);
                    console.log("createdLearner's comp is "+Math.round(result.room.createdLearner.comp*100)/100,Math.round(session.learnerData.comp*100)/100);
                }else if(result.status === 2 || result.status === 3){ //作成者の希望が満たされない
                    logger.info(`${session.name}：作成者の希望× 作成者にダイアログ表示`)
                    io.to(result.room.roomID).emit('status2',Math.round(session.learnerData.comp*100)/100,Math.round(result.room.createdLearner.comp*100)/100);
                    console.log("joinedLearner's comp is " + session.learnerData.comp,result.room.createdLearner.comp*100/100);
                }
                roomResults[result.room.roomID] = {result: result, roleResult: roleResult, joinReqRole: session.learnerData.reqRole, joinID: id, joinComp: Math.round(session.learnerData.comp*100)/100};  
                session.result = result;
                session.save();
            }
        }catch(err){
            console.error('handleMatchingでエラー発生:', err);
            logger.error(`handleMatching error (${session.name || 'unknown'}): ${err.stack}`);
            socket.emit('serverError', { message: 'マッチング中にエラーが発生しました。' });
        }
        
        
    }

    socket.on('matching', () => {
        logger.info(`${session.name}：初回マッチング`)
        var id = socket.id;
        let matchingNgList = [];
        handleMatching(socket, session, matchingNgList);
        
        
        socket.on('OK', () => {
            try{
                let roomID;
                if(session.checkValue === "joinMultiRoom" && session.result){
                    roomID = session.result.room.roomID;
                }else if(session.checkValue === "createMultiRoom"){
                    const rooms = Array.from(socket.rooms);
                    roomID = rooms[1];//socket.roomsの最初の要素は自分自身のID,2番目の要素がルームID
                }else{
                    throw new Error("roomID undefined");
                }
                logger.info(`${session.name}：OKイベントを送信 ルームID:${roomID}`)
                let roomData = (session.checkValue === 'joinMultiRoom') ? {result: session.result, roleResult: null, joinReqRole: session.learnerData.reqRole} : roomResults[roomID];
                if(!roomData){
                    throw new Error("roomData undefined");
                }
                let {result, roleResult, joinReqRole} = roomData;

                if(result.status === 1 || result.status === 2 || result.status === 5){
                    //ロールを確認する処理
                    roleResult = desideRole(joinReqRole, result.room);
                    if(!roleResult){
                        throw new Error("roleResult undefined");
                    }
                    roomResults[roomID].roleResult = roleResult;
                    if(roleResult.status === 1){
                        io.to(roomResults[roomID].joinID).emit('confirmRole');
                        logger.info(`${session.name}：ロール確認ダイアログを表示`)
                    }else{
                        //マッチング成立
                        console.log("matching成立")
                        session.room = result.room.roomID;
                        session.save();
                        const room = roomsBySituation[session.sceneNumber].find(r => r.roomID === result.room.roomID);
                        if(!room){
                            throw new Error("room undefined");
                        }
                        room.roles = {
                            createdLearnerRole: roleResult.roomRole,
                            joinedLearnerRole: roleResult.learnerRole
                        };
                        io.to(roomResults[roomID].joinID).emit('matching complete',result.room.roomID);
                        io.to(result.room.roomID).emit('matching complete',result.room.roomID);
                        
                    }
                }else if(result.status === 3){
                    logger.info(`${session.name}：参加者にダイアログを表示`)
                    io.to(roomResults[roomID].joinID).emit('status1', result.room.roomID, Math.round(result.room.createdLearner.comp*100)/100, roomResults[result.room.roomID].joinComp);
                    result.status = 5;
                }
            }catch(err){
                console.error('OKイベント処理中のエラー:', err);
                logger.error(`OK event error (${session.name || 'unknown'}): ${err.stack}`);
                socket.emit('serverError', { message: 'OK処理中にエラーが発生しました。' });
            }
            
        })
        socket.on('NG', () => {
            //マッチング中止処理
            logger.info(`${session.name}：マッチング中止`)
            console.log("NGイベント送信");
            let roomID;
            if (session.result && session.result.room) {
                roomID = session.result.room.roomID;
            } else {
                const rooms = Array.from(socket.rooms);
                roomID = rooms[1];
            }
            const room = roomsBySituation[session.sceneNumber].find(r => r.roomID === roomID);

            if(room){
                room.isMatchable = true;
                logger.info(`ルーム ${roomID} をマッチング可能に戻しました`);
            }else{
                logger.warn(`NG処理: ルーム ${roomID} が見つかりません`);
            }

            if(session.checkValue === 'joinMultiRoom'){
                socket.emit('cancelMatching');
            }else if(session.checkValue === 'createMultiRoom'){
                socket.to(roomResults[roomID].joinID).emit('creatorCancelMatching');
            }

            socket.on('createNewRoom', async() => {
                //新しいルームを作成してそちらに入る
                try{
                    socket.leave('waiting');
                    session.room = await createRoom.createRoom(session.userId);
                    if(!session.room){
                        throw new Error("createRoom failed");
                    }
                    const learner = toLearnerInstance.toLearnerInstance(session.learnerData);
                    roomsBySituation[session.sceneNumber].push(new Room(learner, session.room));
                    session.checkValue = 'createMultiRoom';
                    session.save();
                    console.log('createNewRoom: '+JSON.stringify(roomsBySituation));
                    logger.info(`${session.name}：新しい部屋を立てる ルームID:${session.room}`)
                    socket.join(session.room);
                }catch(err){
                    console.error('createNewRoomイベント処理中のエラー:', err);
                    logger.error(`createNewRoom event error (${session.name || 'unknown'}): ${err.stack}`);
                    socket.emit('serverError', { message: 'createNewRoom処理中にエラーが発生しました。' });
                }
                
            })

            
        })
        socket.on('joinAgain', () => {
            try{
                console.log("joinAgain");
                const result = session.result;
                matchingNgList.push(result.room.roomID);
                if(matchingNgList.length === roomsBySituation[session.sceneNumber].length){
                    socket.emit('noRoom');
                    return;
                }
                logger.info(`${session.name}：もう一度マッチング NG:${JSON.stringify(matchingNgList)}`)
                handleMatching(socket, session, matchingNgList);
            }catch(err){
                console.error('joinAgainイベント処理中のエラー:', err);
                logger.error(`joinAgain event error (${session.name || 'unknown'}): ${err.stack}`);
                socket.emit('serverError', { message: 'joinAgain処理中にエラーが発生しました。' });
                
            }
        })

        socket.on('cancelMatchingByUser', () => {
            //「マッチングをやめる」ボタンを押したとき
            logger.info(`${session.name}：マッチングをやめる`)
            if(session.checkValue === 'createMultiRoom'){
                console.log("マッチングをやめる");
                roomsBySituation[session.sceneNumber] = roomsBySituation[session.sceneNumber].filter(r => r.roomID !== session.room);
                if(roomResults[session.room]){
                    delete roomResults[session.room];
                }
            }

        })

        socket.on('role_OK' , () => {
            //マッチング成立
            try{
                logger.info(`${session.name}：role_okイベントを送信`)
                console.log("matching成立")
                let roomID;
                if(session.result){
                    roomID = session.result.room.roomID;
                }else{
                    const rooms = Array.from(socket.rooms);
                    roomID = rooms[1];//socket.roomsの最初の要素は自分自身のID,2番目の要素がルームID
                }
                const roomData = roomResults[roomID];
                if(!roomData){
                    throw new Error("roomData undefined")
                }
                const {result, roleResult} = roomData;
                
                const room = roomsBySituation[session.sceneNumber].find(r => r.roomID === result.room.roomID);
                if(!room){
                    throw new Error("room undefined");
                }
                room.roles = {
                    createdLearnerRole: roleResult.roomRole,
                    joinedLearnerRole: roleResult.learnerRole
                };
                session.room = result.room.roomID;
                session.save();
                console.log("roomID complete: "+roomID);
                io.to(roomResults[roomID].joinID).emit('matching complete',roomID);
                io.to(result.room.roomID).emit('matching complete',roomID);
            }catch(err){
                console.error('role_OKイベント処理中のエラー:', err);
                logger.error(`role_OK event error (${session.name || 'unknown'}): ${err.stack}`);
                socket.emit('serverError', { message: 'role_OK処理中にエラーが発生しました。' });
            }
            
        })

        socket.on('setRoomSession', (roomID) => {
            console.log("setRoomSession roomID: "+roomID);
            console.log("roomResults: "+JSON.stringify(roomResults));
            session.room = roomResults[roomID].result.room.roomID;
            session.save();
        })
    })

    

    socket.on('start', async(userName, roomId, checkValue) => {
        var id = socket.id;
        socket.join(roomId);
        socket.userName = userName;
        socket.roomId = session.room;
        logger.info(`${session.name}：マッチング成立(${socket.roomId})`)
        

        // 初期化
        if (!session.wordMistakeCount) {
            session.wordMistakeCount = [];  
        }
        if(!session.pointoutResult){
            session.pointoutResult = []
        }
        if(!session.pointoutWord){
            session.pointoutWord = []
        }
        if(!session.pointoutMistakeWord){
            session.pointoutMistakeWord = []
        }
        


        //同じルームIDにメッセージのログがあればルームに送信する
        try {
            const conn = await pool.getConnection();
            const messages = await conn.query("SELECT message FROM message_logs WHERE room_id = ?", [roomId]);
        
            if (messages.length > 0) {
                messages.forEach((messageObj) => {
                    io.to(id).emit('chat message', messageObj.message); // messageObj.message でメッセージ内容を取得
                });
            }
            conn.release();
        } catch (err) {
            console.error('ログを送信できませんでした：', err);
        }

        
        if(checkValue === 'createRoom'){
            //シングルモードの処理
            if(session.mode === 'single'){
                var CLArole;
                if(session.role === 1){
                    CLArole = 2;
                }else{
                    CLArole = 1;
                }
                //CLAが間違える単語のリストを作成
                session.mistakeList = await generateMistake.generateMistake(session.reqComprehension, CLArole, session.sceneNumber, socket.userName)
                session.pointoutMistakeList = await generateMistake.generateMistake(session.reqComprehension, session.role, session.sceneNumber, socket.userName)
                session.save();
                //console.log("pointoutMistakeList: "+session.pointoutMistakeList);
                //一言目の発話がCLAの場合
                var msg = firstMessage.firstMessage(session.role, session.sceneNumber);
                
                if(msg){
                    msg = finalReply.finalReply(msg, session.mistakeList, session.pointoutWord, 1); //CLAの誤りを含む文に
                    session.CLAAnswer = msg;
                    io.to(socket.roomId).emit('chat message', 'CLA：'+msg);
                    log = `CLA: ${msg}`;
                    //データベースにログを保存
                    try{
                        const conn = await pool.getConnection();
                        await conn .query("INSERT INTO message_logs (room_id, message) VALUES (?,?)", [socket.roomId, log]);
                        conn.release();
                    }catch(err){
                        console.error('データベースにメッセージを保存できませんでした');
                    }
                    //ルームの状態を管理するオブジェクト　createrole:ルームの作成者が選んだロール
                    roomState[session.room] = {roomid: session.room, scenenum: session.sceneNumber, statenum: 2, createrole: session.role};
                }else{
                    roomState[session.room] = {roomid: session.room, scenenum: session.sceneNumber, statenum: 1, createrole: session.role};
                }
            }else if(session.mode === 'friend'){ //フレンドモードであればfirstMessageを呼び出さない
                roomState[session.room] = {roomid: session.room, scenenum: session.sceneNumber, statenum: 1, createrole: session.role};
            }
            
        }else if(checkValue === 'joinRoom'){ //参加者の場合　createroleで無い方のロールがそのユーザのロールになる
            if(roomState[session.room]){
                if(roomState[session.room].createrole === 1){
                    session.role = 2;
                }else if(roomState[session.room].createrole === 2){
                    session.role = 1;
                }
            }
        }else if(checkValue === 'createMultiRoom'){
            let room =roomsBySituation[session.sceneNumber].find(r => r.roomID === session.room);
            //console.log("session.role: "+session.role);
            //console.log("room"+JSON.stringify(room));
            if(room){
                session.role = room.roles.createdLearnerRole;
                roomState[session.room] = {roomid: session.room, scenenum: session.sceneNumber, statenum: 2, createrole: session.role};
            }else if(roomState[session.room]){
                session.role = roomState[session.room].createrole;
            }
            //console.log("roomCompletion(create): "+JSON.stringify(roomCompletion));

            //待機部屋から退出
            if(roomCompletion[session.room]){
                roomsBySituation[session.sceneNumber] = roomsBySituation[session.sceneNumber].filter(room => room.roomID !== session.room);
                console.log("room is deleted(createMultiRoom)");
                roomCompletion[session.room] = delete roomCompletion[session.room];
            }else{
                roomCompletion[session.room] = true;
            }
        }else if(checkValue === 'joinMultiRoom'){
            let room =roomsBySituation[session.sceneNumber].find(r => r.roomID === session.room);
            if(room){
                session.role = room.roles.joinedLearnerRole;
            }else if(roomState[session.room]){
                if(roomState[session.room].createrole === 1){
                    session.role = 2;
                }else if(roomState[session.room].createrole === 2){
                    session.role = 1;
                }
            }
            //待機部屋から退出
            if(roomCompletion[session.room]){
                roomsBySituation[session.sceneNumber] = roomsBySituation[session.sceneNumber].filter(room => room.roomID !== session.room);
                console.log("room is deleted(joinMultiRoom)");
                roomCompletion[session.room] = delete roomCompletion[session.room];
            }else{
                roomCompletion[session.room] = true;
            }
            console.log("roomsBySituation after: "+ JSON.stringify(roomsBySituation));
        }
        
        //ロールカード表示
        if(session.role === 1){
            console.log("role1: "+session.sceneNumber);
            io.to(id).emit('displayRole',session.sceneNumber,session.scene.role1);
        }else if(session.role === 2){
            io.to(id).emit('displayRole',session.sceneNumber,session.scene.role2);
        }else{
            console.log("displayrole error:"+session.role);
            io.to(id).emit('displayRole','error');
        }
    })


    socket.on('join room message', async() => {
        var msg = `CLA: ルーム${socket.roomId}に${socket.userName}さんが入室しました`;
        try{
            const conn = await pool.getConnection();
            await conn .query("INSERT INTO message_logs (room_id, message) VALUES (?,?)", [socket.roomId, msg]);
            conn.release();
        }catch(err){
            console.error('データベースにシステムメッセージを保存できませんでした');
        }
        io.to(socket.roomId).emit('chat message', msg);
    })
        

    //チャットにメッセージが送信されたとき
    socket.on('chat message', async (msg) => {
        //console.log(socket.userName + ' : '+ msg);
        const sceneData = Object.values(modelAnswers).find(scene => scene.scene_num == session.sceneNumber); 
        const maxAnswerId = sceneData.max_answer_id; //ロールプレイが終了するid
        const roomClients = io.sockets.adapter.rooms.get(socket.roomId)?.size || 0; //その部屋にいる人数を取得
        const log = `${socket.userName}: ${msg}`;
        //logをデータベースに保存
        try{
            const conn = await pool.getConnection();
            await conn .query("INSERT INTO message_logs (room_id, message) VALUES (?,?)", [socket.roomId, log]);
            conn.release();
        }catch(err){
            console.error('データベースにメッセージを保存できませんでした');
        }
        
        io.to(socket.roomId).emit('chat message', socket.userName + ' : ' + msg); //部屋に送信
        
        //シングルモードの時
        if(session.mode === 'single'){

            //正誤判定
            console.log("roomState: "+JSON.stringify(roomState));
            const validateResult = validateAnswer.validateAnswer(msg,session.sceneNumber,roomState[socket.roomId].statenum);
            const isCorrect = validateResult.isCorrect;
            const mistakes = validateResult.mistakes;
            if (!isCorrect){
                //間違えた単語のmistakeCountをインクリメント。一回目ならpushする。
                mistakes.forEach(mistake => {
                    var tmp = session.wordMistakeCount.find(mistakeword => mistakeword.word === mistake);
                    if(tmp){
                        tmp.mistakeCount++;
                    }else if(!tmp){
                        session.wordMistakeCount.push({word:mistake, mistakeCount:1});
                    }
                    session.save();
                })
            }
            if (isCorrect){
                //statenumインクリメント
                roomState[socket.roomId].statenum++;
                if(roomState[socket.roomId].statenum === maxAnswerId + 1){
                    await calcWordComprehension.calcWordComprehension(session.wordMistakeCount, session.sceneNumber, session.role, socket.userName);
                    await calcTotalComprehension.calcTotalComprehension(socket.userName);
                    io.to(socket.roomId).emit('chat message',"CLA：ロールプレイはおわりです。おつかれさまでした。");
                    io.to(socket.roomId).emit('displayButton'); //学習を終わるボタンを表示
                }
                //console.log("statenum: " + roomState[socket.roomId].statenum);
            }

            //CLAが間違える単語を決定
            if(!session.mistakeList){
                var CLArole;
                if(session.role === 1){
                    CLArole = 2;
                }else{
                    CLArole = 1;
                }
                session.mistakeList = await generateMistake.generateMistake(session.reqComprehension, CLArole, session.sceneNumber, socket.userName)
                session.pointoutMistakeList = await generateMistake.generateMistake(session.reqComprehension, session.role, session.sceneNumber, socket.userName)
                session.save();
            }
            const AnswerMessage = reply.Reply(msg, session.sceneNumber, roomState[socket.roomId].statenum, isCorrect, session.wordMistakeCount, mistakes, session.mistakeList, session.pointoutMistakeList)//reply.jsのReplyを呼び出し、返信を生成
            if(AnswerMessage){
                //CLAが答えを伝えても不正解だった時のメッセージが送信されると「がくしゅうをおわる」ボタンを表示
                if(AnswerMessage[0].includes("むずかしければ")){
                    io.to(socket.roomId).emit('displayButton');
                }
            }
            const replyMessage = finalReply.finalReply(AnswerMessage, session.mistakeList,session.pointoutWord,roomState[socket.roomId].statenum); //AnswerMessageのmistakeListに含まれる単語を間違いに置換
            if(replyMessage){
                session.CLAAnswer = replyMessage;
                io.to(socket.roomId).emit('chat message',  replyMessage); //部屋に送信
                if(isCorrect){
                    roomState[socket.roomId].statenum++;
                    if(roomState[socket.roomId].statenum === maxAnswerId + 1){
                        await calcWordComprehension.calcWordComprehension(session.wordMistakeCount, session.sceneNumber, session.role, socket.userName);
                        await calcTotalComprehension.calcTotalComprehension(socket.userName);
                        io.to(socket.roomId).emit('chat message',"CLA：ロールプレイはおわりです。おつかれさまでした。");
                        io.to(socket.roomId).emit('displayButton');
                    }
                }
                try{
                    const conn = await pool.getConnection();
                    await conn .query("INSERT INTO message_logs (room_id, message) VALUES (?,?)", [socket.roomId,  replyMessage]);
                    conn.release();
                }catch(err){
                    console.error('データベースにシステムメッセージを保存できませんでした');
                }
                
            }
            
            
        }
    });

    //してきが送信されたとき
    socket.on('pointout', async(wrong, correct) => {
        var msg = `${socket.userName}: ${wrong}は、${correct}ではないですか？`;
        io.to(socket.roomId).emit('chat message', msg); //部屋に送信
        try{
            const conn = await pool.getConnection();
            await conn .query("INSERT INTO message_logs (room_id, message) VALUES (?,?)", [socket.roomId, msg]);
            conn.release();
        }catch(err){
            console.error('データベースにシステムメッセージを保存できませんでした');
        }
        //singleのときだけ指摘が成功したか判定し、返信する。
        //const roomClients = io.sockets.adapter.rooms.get(socket.roomId)?.size || 0; //roomの人数を取得
        if(session.mode === 'single'){
            var pointoutReply = pointout.pointout(wrong, correct, roomState[socket.roomId].statenum, session.sceneNumber, session.CLAAnswer);
            var replymsg = `CLA: ${pointoutReply}`;
            io.to(socket.roomId).emit('chat message', replymsg); //部屋に送信
            try{
                const conn = await pool.getConnection();
                await conn .query("INSERT INTO message_logs (room_id, message) VALUES (?,?)", [socket.roomId, replymsg]);
                conn.release();
            }catch(err){
                console.error('データベースにシステムメッセージを保存できませんでした');
            }

            if(pointoutReply === "そうですね。ありがとうございます。"){
                session.pointoutResult.push(wrong + " → " + correct + ": 成功");
                session.pointoutWord.push(correct);
                session.save();
                const AnswerMessage = reply.Reply(msg, session.sceneNumber, roomState[socket.roomId].statenum-1, true, session.wordMistakeCount, null, null, null)//reply.jsのReplyを呼び出し、返信を生成
                const replyMessage = finalReply.finalReply(AnswerMessage, session.mistakeList,session.pointoutWord,roomState[socket.roomId].statenum-1); //AnswerMessageのmistakeListに含まれる単語を間違いに置換
                if(replyMessage){
                    io.to(socket.roomId).emit('chat message',    replyMessage); 
                    console.log("answermessage: "+ AnswerMessage + ", replymessage: " + replyMessage);
                    try{
                        const conn = await pool.getConnection();
                        await conn .query("INSERT INTO message_logs (room_id, message) VALUES (?,?)", [socket.roomId,  replyMessage]);
                        conn.release();
                    }catch(err){
                        console.error('データベースにシステムメッセージを保存できませんでした');
                    }
                }
            }else{
                session.pointoutResult.push(wrong + " → " + correct + ": 失敗");
            }
            //console.log(session.pointoutResult);
            session.save();
            //console.log(pointoutReply);
            
        }
        
    })


    //接続が切れたとき
    socket.on('disconnect',async() => {
        if(session.name){
            var msg = `CLA: ${socket.userName}さんが退出しました`;
            try{
                const conn = await pool.getConnection();
                await conn .query("INSERT INTO message_logs (room_id, message) VALUES (?,?)", [socket.roomId, msg]);
                conn.release();
            }catch(err){
                console.error('データベースにシステムメッセージを保存できませんでした');
            }
            io.to(socket.roomId).emit('chat message',msg);
            const roomClients = io.sockets.adapter.rooms.get(socket.roomId)?.size || 0; //roomの人数を取得
            //roomの人数が0になったらroomClientsからそのroomの要素を削除する
            if (roomClients === 0) {
                for (let key in roomState) {
                    if (roomState[key].roomid === socket.roomId) {
                        delete roomState[key]; // 削除
                        delete roomResults[socket.roomId];
                        break;
                    }
                }
            }
        }
    })
});



server.listen(port, () => {
    console.log(`server runnning at http://localhost:${port}`);
});

