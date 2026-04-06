//正誤判定
const fs = require('fs');
const modelAnswers = JSON.parse(fs.readFileSync("public/lesson_data/model_answers.json"));


exports.validateAnswer = (msg,sceneNumber,statenum) => {
    var scenenum = parseInt(sceneNumber); //int型に
    var returnobj = {}; //戻り値用オブジェクト
    
    const mistakes = [];
    const keywords = modelAnswers
        .filter(scene => scene.scene_num === scenenum)//scemenumの
        .flatMap(scene => scene.answer_list)//平坦化
        .filter(answer => answer.answer_id === statenum)//statenum
        .flatMap(answer => answer.keyword);
    //全てのキーワードがmsgに含まれているかどうか
    var isCorrect = true;
    for(var i=0; i<keywords.length; i++){
        var length = keywords[i].length;
        var isCorrect_tmp = false;
        for(var j=0; j<length; j++){
            if(msg.includes(keywords[i][j])){
                isCorrect_tmp = true;
                console.log("keyword: "+keywords[i][j]);
            }
        }
        if(!isCorrect_tmp){
            isCorrect = false;
        }
    }
    console.log("isCorrect: " + isCorrect);
    //const isCorrect = keywords.every(keyword => msg.includes(keyword));
    returnobj.isCorrect = isCorrect;
    if(!isCorrect){
        keywords.forEach(keyword => {
            
            var tmp=true;
            /*
            keyword.forEach(word => {
                console.log("msg: "+msg+", keyword: "+word);
                if(!msg.includes(word)){
                    tmp=true;
                    return;
                }
            })
                */
            for(var i=0; i<keyword.length; i++){
                if(msg.includes(keyword[i])){
                    tmp = false;
                    break;
                }
            }
            console.log("keyword: "+keyword+", tmp: "+tmp);
            if(tmp){
                console.log("push");
                mistakes.push(keyword[0]);
            }
        }) 
    }
    returnobj.mistakes = mistakes;
    console.log(returnobj);
    return returnobj;
}
