//一番初めの発話がCLAかどうか判定し、もしCLAであれば発話文を返す
const fs = require('fs');
const modelsAnswers = JSON.parse(fs.readFileSync("public/lesson_data/model_answers.json"));

exports.firstMessage = (role, scenenum) => {
    var sendMsg;
    const scene = Object.values(modelsAnswers).find(scene => scene.scene_num == scenenum);
    if(scene){
        const answer = scene.answer_list.find(answer => answer.answer_id === 1);
        if(answer){
            var firstRole = answer.role;
            if(firstRole !== role){
                sendMsg = [answer.answer_text];
            }
        }else{
            console.log('answer_id 1 not found');
        }
    }else{
        console.log('scene not found');
    }

    
    return sendMsg;
}