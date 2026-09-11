const logger = require('../config/logger');

/**
 * Winston HTTP Request Logger Middleware
 */
const apiLogger = (req, res, next) => {
  // Ignore static asset or favicon requests
  if (req.originalUrl.startsWith('/uploads') || req.originalUrl === '/favicon.ico') {
    return next();
  }

  const startTime = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const durationMs = ((seconds * 1000) + (nanoseconds / 1000000)).toFixed(2);
    
    const statusCode = res.statusCode;
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const appName = req.registeredApp ? req.registeredApp.app_name : (apiKey ? `Key: ${apiKey.substring(0, 12)}...` : 'None');

    const logMessage = `${req.method} ${req.originalUrl} | Status: ${statusCode} | Duration: ${durationMs}ms | App: ${appName}`;

    if (statusCode >= 500) {
      logger.error(logMessage, {
        method: req.method,
        url: req.originalUrl,
        statusCode,
        duration: `${durationMs}ms`,
        appName,
        body: req.body
      });
    } else if (statusCode >= 400) {
      logger.warn(logMessage, {
        method: req.method,
        url: req.originalUrl,
        statusCode,
        duration: `${durationMs}ms`,
        appName
      });
    } else {
      logger.info(logMessage);
    }
  });

  next();
};

module.exports = apiLogger;
