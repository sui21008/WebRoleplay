//単語別理解度計算
const fs = require('fs');
const pool = require('../config/db.js');
const modelAnswers = JSON.parse(fs.readFileSync("public/lesson_data/model_answers.json"));
const alpha = 0.3;//係数α
const getInfo = require("./getInfo");

exports.calcWordComprehension = async(wordMistakeCount, scenenum, rolenum, username) => {
    var wordComprehension = [];
    var preComprehension;
    wordPoint = calcPoint(wordMistakeCount, scenenum, rolenum);
    var userId = await getInfo.getUserId(username);

    for(const word of wordPoint){
        //console.log("word: "+word.word);
        var wordId = await getInfo.getWordId(word.word);
        preComprehension = await getInfo.getWordComprehension(username, word.word);
        //console.log("precomprehension: "+ preComprehension);
        var comprehension; 
        if(preComprehension === -1){
            comprehension = word.point;
        }else{
            comprehension = alpha * word.point + (1-alpha) * preComprehension;
        }
        try{
            const conn = await pool.getConnection();
            var [temp] = await conn.query("SELECT * FROM word_comprehension WHERE word_id = ? AND user_id = ?;",[wordId, userId]);
            
            if(temp && temp.length !== 0){//すでに理解度が登録されていればUPDATE
                await conn.query("UPDATE word_comprehension SET comprehension = ? WHERE word_id = ? AND user_id = ?;", [comprehension, wordId, userId]);
            }else{//まだ登録されていなければINSERT
                await conn .query("INSERT INTO word_comprehension (word_id, user_id, comprehension) VALUES (?,?,?)", [wordId, userId, comprehension]);
            }
            
            conn.release();
        }catch(err){
            console.error('データベースに理解度を保存できませんでした:',err);
        }
        wordComprehension.push({word: word.word, comprehension: comprehension});
    }
        
    
    //console.log("wordComprehension" + JSON.stringify(wordComprehension));
    
    
}

//ポイントの計算
//mistakeCountが大きいほどポイントが低くなる
calcPoint = (wordMistakeCount, scenenum, rolenum) => {
    const wordPoint = [];
    const scene = Object.values(modelAnswers).find(scene => scene.scene_num == scenenum);
    wordMistakeCount.forEach(mistake => {
        var point = 4 - mistake.mistakeCount;
        if(point < 0){
            point = 0;
        }
        wordPoint.push({word: mistake.word, point: point});
        
    });

    //console.log(scene);

    //そのロールのキーワードをkeywordListに登録
    const keywordList = [];
    scene.answer_list.forEach(answer => {
        if(answer.role === rolenum) {
            keywordList.push(...answer.keyword);
        }
    })

    keywordList.forEach(keyword => {
        // wordMistakeCountに存在するかどうかを確認
        const isWordIncluded = wordPoint.some(comp => comp.word === keyword);

        // 存在しない場合、comprehension = 4 で追加
        if (!isWordIncluded) {
            wordPoint.push({word: keyword[0], point: 4});
        }
    });

    return wordPoint;
}



