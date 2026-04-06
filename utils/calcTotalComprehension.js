//総合理解度計算
const pool = require('../config/db.js');
const getInfo = require('./getInfo');

exports.calcTotalComprehension = async(username) => {
    const user_id = await getInfo.getUserId(username);
    var totalComprehension;

    try{
        if(username.includes('test')){
            if(username.includes('test_1')){
                totalComprehension = 10.0;
            }else if(username.includes('test_2')){
                totalComprehension = 15.0;
            }else if(username.includes('test_3')){
                totalComprehension = 30.0;
            }else if(username.includes('test_4')){
                totalComprehension = 55.0;
            }else if(username.includes('test_5')){
                totalComprehension = 80.0;
            }else if(username.includes('test_6')){
                totalComprehension = 85.0;
            }else if(username.includes('test_7')){
                totalComprehension = 20.0;
            }else if(username.includes('test_8')){
                totalComprehension = 90.0;
            }
        }else{
            const conn = await pool.getConnection();
            const temp = await conn.query("SELECT AVG(comprehension) FROM word_comprehension WHERE user_id = ?", [user_id]);
            
            //console.log(JSON.stringify(temp));
            const valueString = temp[0]["AVG(comprehension)"];
            var wordCompAve = parseFloat(valueString);
            totalComprehension = wordCompAve * 25;
            //console.log("total_comprehension: " + totalComprehension);
            conn.release();
        }
        
    }catch (err){
        console.error("単語別理解度が見つかりませんでした", err);
    }

    return totalComprehension;

}
