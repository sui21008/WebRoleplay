const { toLearnerInstance } = require("./toLearnerInstance");

function matching (learner_obj, roomsBySituation, matchingNgList) {
    var matchList = [];
    var matchList_j = [];
    var minDiffRoom_j;//参加者の希望に作成者の理解度が近いルーム
    var minDiffRoom_c;//作成者の希望に参加者の理解度が近いルーム

    var count = 0;
    
    const baselearner = toLearnerInstance(learner_obj);
    const learner = baselearner.clone();
    const rooms = roomsBySituation.map(room => room.clone());
    console.log("roomsBySituation: "+JSON.stringify(roomsBySituation));
    let originalroom;

    while(count < 5 && matchList.length === 0){
        var minDiff = 100;
        let matchableRoomCount = 0;
        rooms.forEach(room => {
            originalroom = roomsBySituation.find(r => r.roomID === room.roomID);
            if(!matchingNgList.includes(room.roomID) && originalroom.isMatchable){
                console.log(room.roomID + " isMatchable: "+room.isMatchable)
                matchableRoomCount++;
                let diff = compareComprehension(learner.comp, room.createdLearner.maxReqComp, room.createdLearner.minReqComp);
                if(diff === 0){
                    matchList.push(room);
                }else{
                    console.log(room.roomID+"(1):"+room.createdLearner.maxReqComp, room.createdLearner.minReqComp)
                    room.createdLearner.expandRange(); //範囲を広げる
                    if(diff < minDiff){
                        minDiff = diff;
                        //参加者の理解度に一番希望理解度が近いルーム
                        minDiffRoom_c = room;
                    }
                }
            }
        })
        if(matchableRoomCount == 0){
            return {room:null, status:null}
        }
        count++;
    }
    //console.log(JSON.stringify(matchList));   
    
    if(matchList.length !== 0){
        count = 0;
        //console.log("matchListにルームがあります");
        while(count < 5){
            minDiff = 100;
            for(let room of matchList) {
                let diff = compareComprehension(room.createdLearner.comp, learner.maxReqComp, learner.minReqComp);
                if(diff === 0){
                    //console.log("roomID:"+room.roomID+", status:0 作成者〇参加者〇");              
                    return {room:room, status:0};
                }else{
                    if(diff < minDiff){
                        minDiff = diff;
                        //参加者の理解度に一番希望理解度が近いルーム
                        minDiffRoom_j = room;
                    }
                    
                }
            }
            //console.log(learner.maxReqComp, learner.minReqComp)
            learner.expandRange(); //範囲を広げる
            count++;
        }
        //console.log("roomID:"+minDiffRoom_j+" status:1 作成者〇参加者× (matchListの中で参加者の希望と作成者の理解度が一番近いルーム)");
        return {room:minDiffRoom_j, status:1};
    }else{
        //console.log("matchListにルームがありません");
        //5回のループが終わってもリストの長さが0のとき→フローチャートの右側
        //全ルームで参加者の希望に合ったルームを探す
        count = 0;
        while(count < 5 && matchList_j.length === 0){
            var minDiff = 100;
            for(let room of rooms) {
                originalroom = roomsBySituation.find(r => r.roomID === room.roomID);
                if(!matchingNgList.includes(room.roomID) && originalroom.isMatchable){
                    let diff = compareComprehension(room.createdLearner.comp, learner.maxReqComp, learner.minReqComp);
                    if(diff === 0){
                        //参加者の希望に合ったルームがある
                        matchList_j.push(room);
                    }else{
                        
                        if(diff < minDiff){
                            minDiff = diff;
                            //参加者の希望理解度に一番近いルーム
                            minDiffRoom_j = room;
                        }
                    }
                }
                
            }
            //console.log(learner.maxReqComp, learner.minReqComp)
            learner.expandRange(); //範囲を広げる
            count++;
            
        }
        //console.log(JSON.stringify(matchList_j));

        if(matchList_j.length !== 0){
            minDiff = 100;
            for(let room of matchList_j){
                let diff = compareComprehension(learner.comp, room.createdLearner.maxReqComp, room.createdLearner.minReqComp);
                if(diff<minDiff){
                    minDiff = diff;
                    minDiffRoom_c = room;
                }
            }
            console.log("roomID:"+minDiffRoom_c.roomID+", status:2 作成者×参加者〇 (作成者の希望にはマッチしないが参加者の希望にマッチするルーム）"); 
            return {room:minDiffRoom_c, status:2}; //作成者×参加者〇
        }else{
            //console.log("roomID:"+minDiffRoom_c+", status:3 作成者×参加者× (作成者の希望と参加者の理解度が一番近いルーム)")
            return {room:minDiffRoom_c, status:3};
        }

        
    }
    
}

compareComprehension = (comprehension, max, min) => {
    var diff;
    if(comprehension >= min){
        if(comprehension <= max){
            return 0;
        }else{
            diff = comprehension - max;
        }
    }else{
        diff = min - comprehension;
    }
    return diff;
}

function desideRole(learner_reqRole, room) {
    const l_req = learner_reqRole;
    //console.log(room);
    const r_req = room.createdLearner.reqRole;
    let result = {learnerRole: null, roomRole: null, status: null};

    if(l_req !== r_req){
        if(l_req === 3){
            result.learnerRole = (r_req===1) ? 2 : 1; //3項演算子　r_req===1がtrueなら2を、falseなら1を代入
            result.roomRole = r_req;
        }else if(r_req === 3){
            result.roomRole = (l_req===1) ? 2 : 1;
            result.learnerRole = l_req;
        }else if(l_req !== 3 && r_req !== 3){
            result.roomRole = r_req;
            result.learnerRole = l_req;
        }
        result.status = 0;
    }else if(l_req === r_req){
        if(l_req === 3 && r_req === 3){
            result.learnerRole = 1;
            result.roomRole = 2;
            result.status = 0;
        }else{
            result.learnerRole = (r_req===1) ? 2 : 1;
            result.roomRole = r_req;
            result.status = 1;
        }
    }
    //console.log(result);
    return result;
}

module.exports = {
    matching,
    desideRole,
};