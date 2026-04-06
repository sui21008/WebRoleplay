//結局使ってない（いつか使うかも）けどルーム作ったときの処理
const pool = require('../config/db.js');

exports.createRoom = async(userId) => {
    let roomId = '';
    let isUnique = false;
    let attemptCount = 0;//最大試行回数
    
    // データベースにないルームIDを生成
    while (!isUnique && attemptCount < 10) {
        let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        roomId = '';
        for (let i = 0; i < 5; i++) {
            roomId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    
        // 生成したルームIDがデータベースに存在するかを確認
        try {
            const conn = await pool.getConnection();
            const result = await conn.query("SELECT COUNT(*) as count FROM room_logs WHERE room_id = ?", [roomId]);
            conn.release();

            // もし存在しなければisUniqueをtrueにしてループを抜ける
            if (result[0].count === 0) {
                isUnique = true;
            }
    
        } catch (err) {
            console.error('ルームIDのチェック中にエラーが発生しました', err);
        }
        attemptCount++;
    }
    
    var roomIdStr = String(roomId); // roomIdを文字列に
    
    try {
        const conn = await pool.getConnection();
        await conn.query("INSERT INTO room_logs (room_id, user1_id) VALUES (?,?)", [roomIdStr, userId]);
        conn.release();
    } catch (err) {
        console.error('ルーム情報を保存できませんでした', err);
    }
    return roomIdStr;
}