//CLAの間違いを生成する
const fs = require('fs');
const modelAnswers = JSON.parse(fs.readFileSync("public/lesson_data/model_answers.json"));
const getInfo  = require("./getInfo");


exports.generateMistake = async(reqComprehension, CLArole, scenenum, username) => {
    const scene = Object.values(modelAnswers).find(scene => scene.scene_num == scenenum);
    var keywordList = [];
    const comprehensionList = [];
    var mistakeWords = [];
    //CLAのロールの発話に含まれるキーワードのリストを作成
    const keywordListArr = scene.answer_list
    .filter(answer => answer.role === CLArole)
    .map(answer => answer.keyword.map(keyGroup => [keyGroup[0]])); //複数登録されている単語のひとつ目だけを抽出

    keywordList = keywordListArr.flat();
    
    //キーワードリストに含まれる単語の学習者の単語別理解度を取得
    for(const keyword of keywordList){
        comprehensionList.push({word: keyword, comprehension: await getInfo.getWordComprehension(username,keyword)});
    }

    //CLAが分からない単語の個数を決定
    //キーワードリストに含まれる単語数と学習者が希望するCLAの理解度から個数を決定する
    const keywordsAmount = keywordList.length;
    const mistakesAmount = Math.round(keywordsAmount * (1-reqComprehension / 100));

    console.log(isRandom(comprehensionList,mistakesAmount));
    if(isRandom(comprehensionList,mistakesAmount)){ //もし学習者の理解度に同じ値がmistakesAmountより多く含まれていたら
        mistakeWords = selectRandomWords(comprehensionList,mistakesAmount);
    }else{
        //mistakesAmountの分だけ、学習者の理解度が低い単語からCLAが分からない単語に決定
        for(var i=0; i<mistakesAmount; i++){
            var minComprehension = 4;
            for(var j=0; j<keywordsAmount; j++){
                if(parseFloat(comprehensionList[j].comprehension)<minComprehension){
                    minComprehension = parseFloat(comprehensionList[j].comprehension);
                    var minIndex = j;
                }
            }
            //console.log("minComprehension: " +minComprehension);
            comprehensionList[minIndex].comprehension = 5;//選ばれた単語のcomprehensionは5にすることで次選ばれないように
        }
        //comprehensionListをmistakeListにコピー
        var mistakeList = JSON.parse(JSON.stringify(comprehensionList));
        //CLAが分からない単語(comprehensionListのcomprehensionが5になっている単語)を1に、それ以外を0にする
        mistakeList.forEach(word => {
            if(word.comprehension === 5){
                word.comprehension = 1;
            }else{
                word.comprehension = 0;
            }
        })

        //mistakeListのキー名をcomprehension→mistakeに変更
        mistakeList = mistakeList.map(obj => {
            obj.mistake = obj.comprehension;
            delete obj.comprehension;
            return obj;
        })

        //console.log(mistakeList);

        //mistakeListの一部で0と1を入れ替える
        mistakeList = switchMistakeWords(mistakeList);
        //console.log(mistakeList);
    
        mistakeList.forEach(word => {
            if(word.mistake === 1){
                mistakeWords.push(word.word);
            }
        })
    }
    
    mistakeWords.forEach((row, index) => {
        mistakeWords[index] = mistakeWords[index][0];
    })
        
    console.log("mistakeWords(generateMistake): " +mistakeWords);
    return mistakeWords;
}


    
const isRandom = (comprehensionList, mistakesAmount) => {
    //学習者の個別理解度にmistakesAmount以上同じ値が含まれているかどうかを判別
    var counts = {};

    for(const word of comprehensionList){
        counts[word.comprehension] = (counts[word.comprehension] || 0) + 1;
        if (counts[word.comprehension] > mistakesAmount){
            return true;
        }
    }
    return false;
}

const selectRandomWords = (comprehensionList, mistakesAmount) => {
    const groupedWords = {};

    //同じ理解度を持つ単語をグループ化
    for (const word of comprehensionList) {
        const comprehension  = word.comprehension;
        if(!groupedWords[comprehension]){
            groupedWords[comprehension] = [];
        }
        groupedWords[comprehension].push(word.word);
    }

    //mistakesAmountを超えるグループを抽出
    const validGroupes = Object.entries(groupedWords) //groupedWordsを配列に
        .filter(([_, words]) => words.length >= mistakesAmount) // 閾値を満たすグループ
        .map(([comprehension, words]) => ({
            comprehension: Number(comprehension), //comprehensionを数値型にしてsortしやすく
            words,
        }));
    
    if (validGroupes.length === 0) {
        return []; // 条件を満たすグループがなければ空配列を返す
    }

    //比較関数を用いて昇順にsort
    validGroupes.sort((a,b) => a.comprehension - b.comprehension);

    //一番理解度が低いグループの中からランダムに選択
    const targetWords = validGroupes[0].words;
    const randomWords = [];
    while(randomWords.length < mistakesAmount && targetWords.length > 0){
        const randomIndex = Math.floor(Math.random() * targetWords.length);
        randomWords.push(targetWords.splice(randomIndex,1)[0]);
    }
    return randomWords;
}

const switchMistakeWords = (mistakeList) => {
    //mistakeが0の単語と1の単語に分ける
    const correct_words = mistakeList.filter(word => word.mistake === 0);
    const incorrect_words = mistakeList.filter(word => word.mistake === 1);

    //もしどちらも存在すれば
    if(correct_words.length > 0 && incorrect_words.length > 0){
        //それぞれの配列からランダムにインデックスを取得
        const c_index = Math.floor(Math.random() * correct_words.length);
        const i_index = Math.floor(Math.random() * incorrect_words.length);

        //元の配列のインデックスを取得
        const c_original_index = mistakeList.indexOf(correct_words[c_index]);
        const i_original_index = mistakeList.indexOf(incorrect_words[i_index]);

        //入れ替え
        [mistakeList[c_original_index].mistake, mistakeList[i_original_index].mistake] = [mistakeList[i_original_index].mistake, mistakeList[c_original_index].mistake];
        
    } 
    return mistakeList;
}
