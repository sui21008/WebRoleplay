//正答率計算
const fs = require('fs');
const modelAnswers = JSON.parse(fs.readFileSync("public/lesson_data/model_answers.json"));

exports.calcAccuracy = (scenenum,rolenum,mistakeCount) => {
    const scene = Object.values(modelAnswers).find(scene => scene.scene_num == scenenum);
    var keywordList = [];
    scene.answer_list.forEach(answer => {
        if(answer.role === rolenum) {
            keywordList.push(...answer.keyword);
        }
    })
    var mistakeLength = Object.values(mistakeCount).length;
    var accuracy = (1 - (mistakeLength / keywordList.length)) * 100;
    accuracy = Math.round(Math.round(accuracy * 10) / 10);
    return accuracy;
}

