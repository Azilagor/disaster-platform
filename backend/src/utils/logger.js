const { createLogger, format, transports } = require("winston");
const path = require("path");
const fs = require("fs");

const LOG_DIR = path.join(__dirname, "..", "..", "logs");
fs.mkdirSync(LOG_DIR, { recursive: true });

const consoleFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: "HH:mm:ss" }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const extras = Object.keys(meta).length ? " " + JSON.stringify(meta) : "";
    return `[${timestamp}] ${level}: ${message}${extras}`;
  })
);

const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.json()
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "warn" : "http"),

  transports: [
    new transports.Console({
      format: consoleFormat,
      silent: false,
    }),
    new transports.File({
      filename: path.join(LOG_DIR, "combined.log"),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
    new transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
  ],

  exitOnError: false,
});

module.exports = logger;