const crypto = require('crypto');
const ErrorLog = require('../models/ErrorLog');
const ErrorLogHistory = require('../models/ErrorLogHistory');
const logger = require('../config/logger');

// Sensitive keys to mask in stored logs
const SENSITIVE_KEYS = ['password', 'confirm_password', 'token', 'access_token', 'refresh_token', 'api_secret', 'private_key', 'authorization'];

const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      clean[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
};

/**
 * Record a backend API failure into tbl_errorlogs and tbl_errorlogshistory
 */
const recordApiFailure = async ({
  req,
  statusCode,
  errorMessage,
  responseBody = null,
  stackTrace = '',
  errorTitle = 'Backend API Failure'
}) => {
  try {
    // Avoid logging static files or health checks
    const url = req.originalUrl || req.url || '';
    if (url.startsWith('/uploads') || url === '/favicon.ico' || url === '/api/health') {
      return;
    }

    const endpoint = url.split('?')[0];
    const method = (req.method || 'GET').toUpperCase();
    const cleanMessage = (errorMessage || `HTTP ${statusCode} ${method} Failure`).trim();

    // Determine associated App if available (ensure valid ObjectId)
    const mongoose = require('mongoose');
    let appId = null;
    if (req.registeredApp && req.registeredApp._id && mongoose.Types.ObjectId.isValid(req.registeredApp._id)) {
      appId = req.registeredApp._id;
    } else if (req.body && req.body.app_id && mongoose.Types.ObjectId.isValid(req.body.app_id)) {
      appId = req.body.app_id;
    } else if (req.query && req.query.app_id && mongoose.Types.ObjectId.isValid(req.query.app_id)) {
      appId = req.query.app_id;
    }

    // Compute unique hash to deduplicate repeating failures
    const errorHash = crypto
      .createHash('md5')
      .update(`BACKEND_${method}_${endpoint}_${statusCode}_${cleanMessage.substring(0, 100)}`)
      .digest('hex');

    const sanitizedPayload = sanitizeData(req.body);
    const sanitizedQuery = sanitizeData(req.query);
    const sanitizedResponse = sanitizeData(responseBody);
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Capture relevant headers
    const sanitizedHeaders = {
      'content-type': req.headers['content-type'] || '',
      'x-api-key': req.headers['x-api-key'] ? '***KEY-PROVIDED***' : '',
      'authorization': req.headers['authorization'] ? '***AUTH-TOKEN***' : '',
      'user-agent': userAgent,
      'host': req.headers['host'] || ''
    };

    let existingError = await ErrorLog.findOne({ error_hash: errorHash });

    if (existingError) {
      existingError.occurrences_count += 1;
      existingError.last_seen_at = new Date();
      existingError.request_payload = sanitizedPayload || existingError.request_payload;
      existingError.request_query = sanitizedQuery || existingError.request_query;
      existingError.request_headers = sanitizedHeaders || existingError.request_headers;
      existingError.response_body = sanitizedResponse || existingError.response_body;
      existingError.ip_address = clientIp || existingError.ip_address;

      if (stackTrace && !existingError.stack_trace) {
        existingError.stack_trace = stackTrace;
      }

      // If previously marked RESOLVED, automatically reopen
      if (existingError.status === 'RESOLVED') {
        const prevStatus = existingError.status;
        existingError.status = 'REOPENED';
        await existingError.save();

        await ErrorLogHistory.create({
          error_id: existingError._id,
          app_id: appId,
          previous_status: prevStatus,
          new_status: 'REOPENED',
          resolution_notes: `API failed again with status ${statusCode}: ${cleanMessage}`,
          action_type: 'AUTO_DETECTED_REOPEN'
        });
      } else {
        await existingError.save();
      }
    } else {
      // Determine severity
      let severity = 'MEDIUM';
      if (statusCode >= 500) {
        severity = 'CRITICAL';
      } else if (statusCode === 404) {
        severity = 'LOW';
      } else if (statusCode === 401 || statusCode === 403) {
        severity = 'MEDIUM';
      } else if (statusCode >= 400) {
        severity = 'HIGH';
      }

      const newLog = await ErrorLog.create({
        app_id: appId,
        user_id: req.user ? req.user._id : null,
        error_source: 'BACKEND_API',
        endpoint,
        http_method: method,
        status_code: statusCode,
        request_payload: sanitizedPayload,
        request_query: sanitizedQuery,
        request_headers: sanitizedHeaders,
        response_body: sanitizedResponse,
        ip_address: clientIp,
        user_agent: userAgent,
        error_hash: errorHash,
        error_title: errorTitle,
        error_message: cleanMessage,
        stack_trace: stackTrace,
        file_name: endpoint,
        line_number: statusCode,
        os_type: 'BACKEND',
        os_version: process.version, // Node.js version
        device_model: 'Express API Server',
        app_version: '1.0.0',
        severity,
        status: 'PENDING',
        occurrences_count: 1,
        first_seen_at: new Date(),
        last_seen_at: new Date()
      });

      await ErrorLogHistory.create({
        error_id: newLog._id,
        app_id: appId,
        previous_status: 'NONE',
        new_status: 'PENDING',
        resolution_notes: `Initial backend API failure detected (${method} ${endpoint} -> ${statusCode})`,
        action_type: 'STATUS_CHANGE'
      });
    }
  } catch (err) {
    logger.error(`[Error Recording Failed] ${err.message}`);
  }
};

/**
 * Middleware: Response Interceptor to capture any 4xx / 5xx responses
 */
const apiErrorLogger = (req, res, next) => {
  // Capture the original res.json and res.send
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = function (body) {
    if (res.statusCode >= 400 || (body && body.success === false)) {
      const message = (body && (body.message || body.error)) || `Failed with HTTP status ${res.statusCode}`;
      recordApiFailure({
        req,
        statusCode: res.statusCode >= 400 ? res.statusCode : 400,
        errorMessage: typeof message === 'string' ? message : JSON.stringify(message),
        responseBody: body,
        errorTitle: `${req.method} ${req.originalUrl.split('?')[0]} (${res.statusCode})`
      });
    }
    return originalJson(body);
  };

  res.send = function (body) {
    if (res.statusCode >= 400) {
      let message = `Failed with HTTP status ${res.statusCode}`;
      let parsedBody = body;
      if (typeof body === 'string') {
        try {
          parsedBody = JSON.parse(body);
          message = parsedBody.message || parsedBody.error || message;
        } catch (_) {
          message = body.substring(0, 250);
        }
      }
      recordApiFailure({
        req,
        statusCode: res.statusCode,
        errorMessage: message,
        responseBody: parsedBody,
        errorTitle: `${req.method} ${req.originalUrl.split('?')[0]} (${res.statusCode})`
      });
    }
    return originalSend(body);
  };

  next();
};

/**
 * Express Global Error Handler (for unhandled exceptions / throws)
 */
const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  logger.error(`[Server Exception] ${err.message}`, { stack: err.stack });

  // Record to DB
  recordApiFailure({
    req,
    statusCode,
    errorMessage: err.message || 'Internal Server Error',
    stackTrace: err.stack || '',
    errorTitle: `Unhandled Exception: ${err.name || 'Error'} in ${req.method} ${req.originalUrl.split('?')[0]}`
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = {
  apiErrorLogger,
  globalErrorHandler,
  recordApiFailure
};
