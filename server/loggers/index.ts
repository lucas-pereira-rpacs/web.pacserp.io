import winston from 'winston';
import transportConsole from '#loggers/transportConsole';

const { combine, colorize, json, printf, timestamp } = winston.format;
const isProduction = process.env.NODE_ENV === 'production';
let loggerFormat = combine(timestamp(), json());

if (!isProduction) {
  loggerFormat = combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    printf(({ level, message, timestamp: logTimestamp, ...metadata }) => {
      let details = '';
      if (Object.keys(metadata).length > 0) {
        details = ` ${JSON.stringify(metadata)}`;
      }
      return `${String(logTimestamp)} ${String(level)}: ${String(message)}${details}`;
    }),
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  defaultMeta: { service: 'web.pacserp.io' },
  format: loggerFormat,
  transports: [transportConsole],
});

export default logger;
