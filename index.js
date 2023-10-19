const winston = require("winston");
const format = winston.format;
const DailyRotateFile = require("winston-daily-rotate-file");
const config = require("config");
const logConfig = config.get("log.logConfig");

//YYYY-MM-DD format date -->ja-JP
const timezoned = () => {
	return new Date().toLocaleString("ja-JP", {
		timeZone: "Asia/Colombo",
	});
};

const enumerateErrorFormat = format((info) => {
	if (info.message instanceof Error) {
		info.message = Object.assign(
			{
				message: info.message.message,
				stack: info.message.stack,
			},
			info.message
		);
	}

	if (info instanceof Error) {
		return Object.assign(
			{
				message: info.message,
				stack: info.stack,
			},
			info
		);
	}

	return info;
});

const transportFile = new DailyRotateFile({
	filename: logConfig.logFolder + logConfig.logFile,
	datePattern: logConfig.datePattern,
	zippedArchive: logConfig.zippedArchive,
	maxSize: logConfig.maxSize,
	maxFiles: logConfig.maxFiles,
	prepend: true,
	level: process.env.LOG_LEVEL || logConfig.logLevel,
});

transportFile.on("rotate", function (oldFilename, newFilename) {
	// call function like upload to s3 or on cloud
	logger.info(" Log File Changed  ", oldFilename, " -->", newFilename);
});

const fileLogFormat = winston.format.combine(
	winston.format.timestamp({ format: timezoned }),
	winston.format.prettyPrint(),
	winston.format.splat(),
	format.printf((info) => {
		if (typeof info.message === "object") {
			info.message = JSON.stringify(info.message, null, 3);
		}
		return `${info.timestamp}  ${info.level}:  ${info.message}`;
	})
);

const consoleFormat = winston.format.combine(
	format.colorize(),
	format.timestamp({ format: timezoned }),
	format.prettyPrint(),
	format.splat(),
	format.printf((info) => {
		if (typeof info.message === "object") {
			info.message = JSON.stringify(info.message, null, 3);
		}
		return `${info.timestamp}  ${info.level}:  ${info.message}`;
	})
);
const logger = winston.createLogger({
	format: fileLogFormat,
	transports: [transportFile],
});

if (process.env.NODE_ENV !== "production") {
	logger.add(
		new winston.transports.Console({
			level: "debug",
			format: consoleFormat,
		})
	);
}

module.exports = logger;
