const winston = require('winston');
require('winston-daily-rotate-file');

// 日ごとにログを分割
const transport = new winston.transports.DailyRotateFile({
    filename: 'logs/system-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
    maxFiles: '14d'
});

// ロガー作成
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) =>
        `[${timestamp}] [${level}] ${message}`
        )
    ),
    transports: [
        // コンソール出力
        new winston.transports.Console(),
        // ファイル出力
        //new winston.transports.File({ filename: 'logs/%DATE%.log' })
        transport
    ],
});

module.exports = logger;