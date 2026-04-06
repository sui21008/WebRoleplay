const pool = require('../config/db.js');
const fs = require('fs');
const modelAnswers = JSON.parse(fs.readFileSync("public/lesson_data/model_answers.json"));
const wrongList = JSON.parse(fs.readFileSync("public/lesson_data/wrong_list.json"));

exports.getUserId = async(username) => {
    var userId;
    try{
        const conn = await pool.getConnection();
        const [userResult] = await conn.query("SELECT id FROM users WHERE name=?;", [username]);
        userId = userResult.id;
        conn.release();
    }catch(err){
        console.error('ユーザーが見つかりませんでした');
    }
    
    // userIdが取得できなかった場合
    if(userId === null) {
        console.log("User ID not found for username:", username);
    }
    return userId;
}

exports.getWordId = async(word) => {
    let wordId;
    try {
        const conn = await pool.getConnection();
        const [wordResult] = await conn.query("SELECT word_id FROM word_list WHERE word = ?", [word]);

        if (wordResult && wordResult.word_id) {
            wordId = wordResult.word_id;
        } else {
            console.log(`単語が見つかりませんでした: '${word}'`);
        }
        
        conn.release();
    } catch (err) {
        console.error('単語検索エラー:', err);
    }
    return wordId;
}

exports.getWordComprehension = async(username, word) => {
    var wordComprehension;
    var userId = await exports.getUserId(username);
    var wordId = await exports.getWordId(word);
    try{
        const conn = await pool.getConnection();
        const [comprehensionResult] = await conn.query("SELECT comprehension FROM word_comprehension WHERE user_id = ? AND word_id = ?", [userId, wordId]);
        //console.log("comprehension result: " +JSON.stringify(comprehensionResult));
        if(comprehensionResult){
            wordComprehension = comprehensionResult.comprehension;
        }else{
            wordComprehension = -1;
        }
        conn.release();
    }catch(err){
        console.error('単語別理解度が見つかりませんでした' + err);
    }
    return wordComprehension;
}

exports.getModelAnswer = (sceneNumber) => {
    var scenenum = parseInt(sceneNumber);
    var modelAnswerArr = [];
    const sceneData = modelAnswers.find(scene => scene.scene_num === scenenum); 
    for(var i=1; i<=sceneData.max_answer_id; i++){
        const answer_text = modelAnswers
            .filter(scene => scene.scene_num === scenenum)
            .flatMap(scene => scene.answer_list)
            .filter(answer => answer.answer_id === i)
            .map(answer => answer.answer_text);
        
        const rolenum = modelAnswers
            .filter(scene => scene.scene_num === scenenum)
            .flatMap(scene => scene.answer_list)
            .filter(answer => answer.answer_id === i)
            .map(answer => answer.role);
        
        var role;
        if(rolenum[0] === 1){
            role = sceneData.role1_name;
        }else if(rolenum[0] === 2){
            role = sceneData.role2_name;
        }else{
            console.error('roleがみつかりませんでした');
        }

        var modelAnswer = role + ":" + answer_text;
        modelAnswerArr.push(modelAnswer);
    }
    return modelAnswerArr;
    
}
    
exports.getCLAMistake = (mistake_list => {
    var wrongWordList = [];
    mistake_list.forEach(mistake => {
        const replacementEntry = wrongList.words.find(entry => entry.word === mistake);
        wrongWordList.push(replacementEntry.mistake);
    })
    return wrongWordList;
}) 