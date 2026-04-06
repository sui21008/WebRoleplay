//CLAの返信を生成（誤りなし）
const fs = require('fs');
const modelAnswers = JSON.parse(fs.readFileSync("public/lesson_data/model_answers.json"));

var commonReply = (msg) => {
    var replyMsg = '';
    if(msg.includes('こんにちは')){
        replyMsg = ['CLA: こんにちは、お元気ですか？'];
    }else if(msg.includes('さようなら')){
        replyMsg = ['CLA: お疲れさまでした、さようなら。'];
    }
    return replyMsg;
}

exports.Reply = (msg,sceneNumber,stateNumber,isCorrect,wordMistakeCount,mistakes,CLAmistakes,pointoutMistakeList) => {
    var scenenum = parseInt(sceneNumber);
    var replyMsg = '';    
    replyMsg = commonReply(msg);
    if(!replyMsg){
        /*
        const role = modelAnswers
        .filter(scene => scene.scene_num === scenenum)
        .flatMap(scene => scene.answer_list)
        .filter(answer => answer.answer_id === stateNumber)
        .map(answer => answer.role);
        */

        if(isCorrect){
            //学習者の発話が正解だったら次の文章を返信
            const answer_text = modelAnswers
            .filter(scene => scene.scene_num === scenenum)
            .flatMap(scene => scene.answer_list)
            .filter(answer => answer.answer_id === stateNumber)
            .map(answer => answer.answer_text);

            

            const sceneData = modelAnswers.find(scene => scene.scene_num === scenenum); 
            
            const maxAnswerId = sceneData.max_answer_id;
            if(stateNumber === maxAnswerId + 1){
                replyMsg = null;
            }else{
                replyMsg = ['CLA: '+answer_text];
            }
                

            
        }else{
            //学習者の発話が誤りなら場合分けして再入力を促す文章を返信
            var maxMistakeCount = 0; //同じ単語を最大何回間違えているか
            var isBothMistake = false;
            var isPointoutMistake = false;
            mistakes.forEach(mistake => {
                var tmp = wordMistakeCount.find(mistakeword => mistakeword.word === mistake);
                if(maxMistakeCount < tmp.mistakeCount){
                    maxMistakeCount = tmp.mistakeCount;
                }
                console.log("tmp: "+ JSON.stringify(tmp));
                //CLAの発話中でCLAが誤った単語を学習者が誤った場合
                CLAmistakes.forEach(CLAmistake => {
                    if(mistake === CLAmistake){
                        isBothMistake = true;
                    }
                })
                //学習者の発話に含まれるキーワードの中で設定したCLAが分からない単語を学習者が誤った場合　曖昧な指摘をする
                pointoutMistakeList.forEach(pointout_mistake => {
                    if(mistake === pointout_mistake){
                        isPointoutMistake = true;
                    }
                })
            })
            const answer_text = modelAnswers
                    .filter(scene => scene.scene_num === scenenum)
                    .flatMap(scene => scene.answer_list)
                    .filter(answer => answer.answer_id === stateNumber)
                    .map(answer => answer.answer_text);
            if(!isBothMistake){
                if(isPointoutMistake){
                    if(maxMistakeCount === 1){
                        replyMsg = ['CLA: なにかが まちがえていそうです。'];
                    }else if(maxMistakeCount === 2){
                        replyMsg = ['CLA: まだ ちがうきがします。つぎも分からなければ 先生をよんでみましょう。'];
                    }else if(maxMistakeCount === 3){
                        replyMsg = ['教師エージェント: こたえは 「'+answer_text+'」 です。もういちど にゅうりょくしてみましょう。'];
                    }else{
                        replyMsg = ['教師エージェント: こたえは 「'+answer_text+'」 です。もういちど にゅうりょくしてみましょう。 むずかしければ がくしゅうを おえてください。']
                    }
                }else{
                    if(maxMistakeCount === 1){
                        replyMsg = ['CLA: いいかたを かえてみましょう。'];
                    }else if(maxMistakeCount === 2){
                        replyMsg = ['CLA: シチュエーションを もういちど かくにんしてみましょう。'];
                    }else if(maxMistakeCount === 3){
                        replyMsg = ['CLA: こたえは 「'+answer_text+'」 です。もういちど にゅうりょくしてみましょう。'];
                    }else{
                        replyMsg = ['CLA: こたえは 「'+answer_text+'」 です。もういちど にゅうりょくしてみましょう。 むずかしければ がくしゅうを おえてください。']
                    }
                }
                
            }else if(isBothMistake){
                if(maxMistakeCount === 1){
                    replyMsg = ['教師エージェント: いいかたを かえてみましょう。'];
                }else if(maxMistakeCount === 2){
                    replyMsg = ['教師エージェント: シチュエーションを もういちど かくにんしてみましょう。'];
                }else if(maxMistakeCount === 3){
                    replyMsg = ['教師エージェント: こたえは 「'+answer_text+'」 です。もういちど にゅうりょくしてみましょう。'];
                }else{
                    replyMsg = ['教師エージェント: こたえは 「'+answer_text+'」 です。もういちど にゅうりょくしてみましょう。 むずかしければ がくしゅうを おえてください。']
                }
            }
        }
        
    }
    
    return replyMsg;
    
}