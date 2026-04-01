//指摘の正誤判定
const fs = require('fs');
const modelAnswers = JSON.parse(fs.readFileSync("public/lesson_data/model_answers.json"));

exports.pointout = (wrongWord, correctWord, statenum, sceneNumber, CLAAnswer) => {
    var pointoutReply;
    var scenenum = parseInt(sceneNumber);
    
    statenum--; //CLAが発話したらstatenumがインクリメントされるから減らしとく
    
    const answerTextArr = modelAnswers
        .filter(scene => scene.scene_num === scenenum)
        .flatMap(scene => scene.answer_list)
        .filter(answer => answer.answer_id === statenum)
        .map(answer => answer.answer_text);

    if(answerTextArr){
        var answerText = answerTextArr[0];
    }
    //correctKeyword:複数の候補を含めた正解キーワード
    const correctKeywordObj = modelAnswers
        .filter(scene => scene.scene_num === scenenum)
        .flatMap(scene => scene.answer_list)
        .filter(answer => answer.answer_id === statenum)
        .map(answer => answer.keyword);

    const correctKeyword = correctKeywordObj.flat(2); //平坦化

    console.log("correctWord: "+correctWord+", correctKeyword: "+correctKeyword);
    console.log("result:" +correctKeyword.includes(correctWord));

    if(CLAAnswer.includes(wrongWord) && !correctKeyword.includes(wrongWord)){
        if((!CLAAnswer.includes(correctWord) && correctKeyword.includes(correctWord)) || (!CLAAnswer.includes(correctWord) && answerText.includes(correctWord)) ){
            pointoutReply = "そうですね。ありがとうございます。";
        }else{
            pointoutReply = "たしかに、そのたんごは まちがって いそうですが、ただしいたんごは それではなかった 気がします。"
        }
    }else{
        if(CLAAnswer.includes(wrongWord)){
            console.log("include wrongword");
        }
        console.log("CLAAnswer: "+CLAAnswer+", wrongword: "+wrongWord);
        if(correctKeyword.includes(wrongWord)){
            console.log("include correctkeyword");
        }
        pointoutReply = "そうでしょうか。まちがって いないと おもうのですが..."
    }
    return pointoutReply;
}