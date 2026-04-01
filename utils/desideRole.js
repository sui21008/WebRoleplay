function desideRole(learnerReqRole, room) {
    const l_req = learnerReqRole;
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

module.exports = desideRole;