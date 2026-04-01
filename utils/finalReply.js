//誤りを含む文章を生成
const fs = require('fs');
const wrongList = JSON.parse(fs.readFileSync("public/lesson_data/wrong_list.json"));
const modelAnswers = JSON.parse(fs.readFileSync("public/lesson_data/model_answers.json"));

exports.finalReply = (answerArr, mistakeWords, pointoutWord) => {
    var replyMessage = "";
    var answer = "";
        //answerArr(answer)は正解例通りの文章
    if(answerArr){
        answer = answerArr[0];
    }
    //mistakeWordsはCLAが分からない単語。正解例に含まれているCLAが分からない単語をmatchesに
    var matches = mistakeWords.filter(word => answer.includes(word));
    console.log("matches: "+matches);
    if(matches.length > 0){
        var tempMsg = answer;
        matches.forEach(wordToReplace => {
            //置換予定の単語(wordToReplace)が指摘済みの単語(pointoutWord)に含まれていなければ置換
            var isPointoutedResult = isPointouted(pointoutWord,wordToReplace);
            if(!isPointoutedResult.isPointouted){
                if(!tempMsg.includes('こたえ')){ //文章に「こたえ」が含まれてたら置換しない
                    const replacementEntry = wrongList.words.find(entry => entry.word === wordToReplace);
                    //console.log("replacementEntry:"+JSON.stringify(replacementEntry));
                    if(replacementEntry){
                        const regex = new RegExp(replacementEntry.word, "g"); 
                        tempMsg = tempMsg.replace(regex, replacementEntry.mistake);
                    }
                }
            }else{
                const replacementEntry = isPointoutedResult.word;
                console.log("replacementEntry: " + replacementEntry);
                if(replacementEntry){
                    const regex = new RegExp(wordToReplace, "g"); 
                    tempMsg = tempMsg.replace(regex, replacementEntry);
                }
            }
            
        });
        replyMessage = tempMsg;
    }else{
        replyMessage = answer;
    }
    return replyMessage;
}

isPointouted = (pointoutedWord, wordToReplace) => {
    var result = {};
    result.isPointouted = false;
    var filteredKeywords;
    pointoutedWord.forEach(word => {
        filteredKeywords = modelAnswers.flatMap(scene =>
            scene.answer_list.flatMap(answer =>
                answer.keyword.filter(keywordArray =>
                    keywordArray.includes(word)
                )
            )
        );
        if(filteredKeywords.flat().includes(wordToReplace)){
            result.isPointouted = true;
            result.word = word;
        }
    })
    
    return result;
}