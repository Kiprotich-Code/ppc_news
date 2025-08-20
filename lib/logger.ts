/**
 * Secure logging utility to prevent sensitive data exposure
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  isDevelopment: boolean;
  enableDebugLogs: boolean;
  sensitiveFields: string[];
}

const config: LoggerConfig = {
  isDevelopment: process.env.NODE_ENV === 'development',
  enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === 'true',
  sensitiveFields: [
    'password',
    'apiKey',
    'secret',
    'token',
    'authorization',
    'phone',
    'phoneNumber',
    'email',
    'userId',
    'id',
    'session',
    'webhook',
    'till',
    'channel',
    'mpesa',
    'payhero',
    'content',
    'body',
    'payload',
    'response'
  ]
};

/**
 * Sanitizes objects by masking sensitive fields
 */
function sanitizeData(data: any, depth = 0): any {
  if (depth > 3) return '[Deep Object]'; // Prevent infinite recursion
  
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    return data.length > 100 ? data.substring(0, 100) + '...[truncated]' : data;
  }
  
  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.length > 5 
      ? [...data.slice(0, 5).map(item => sanitizeData(item, depth + 1)), `...[${data.length - 5} more items]`]
      : data.map(item => sanitizeData(item, depth + 1));
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase();
      const isSensitive = config.sensitiveFields.some(field => 
        keyLower.includes(field.toLowerCase())
      );
      
      if (isSensitive) {
        if (typeof value === 'string') {
          sanitized[key] = value.length > 0 ? 
            (value.length <= 4 ? '*'.repeat(value.length) : 
             value.substring(0, 2) + '*'.repeat(Math.min(value.length - 4, 6)) + value.substring(value.length - 2)) 
            : value;
        } else {
          sanitized[key] = '[REDACTED]';
        }
      } else {
        sanitized[key] = sanitizeData(value, depth + 1);
      }
    }
    
    return sanitized;
  }
  
  return data;
}

/**
 * Secure logger that automatically sanitizes sensitive data
 */
export const logger = {
  debug: (message: string, data?: any) => {
    if (config.isDevelopment && config.enableDebugLogs) {
      console.debug(`[DEBUG] ${message}`, data ? sanitizeData(data) : '');
    }
  },
  
  info: (message: string, data?: any) => {
    if (config.isDevelopment) {
      console.info(`[INFO] ${message}`, data ? sanitizeData(data) : '');
    }
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? sanitizeData(data) : '');
  },
  
  error: (message: string, error?: any) => {
    // Always log errors, but sanitize them
    const sanitizedError = error instanceof Error 
      ? { message: error.message, name: error.name, stack: config.isDevelopment ? error.stack : undefined }
      : sanitizeData(error);
    console.error(`[ERROR] ${message}`, sanitizedError);
  },
  
  // For production API logging - minimal information only
  apiCall: (endpoint: string, method: string, statusCode?: number) => {
    if (config.isDevelopment) {
      console.info(`[API] ${method} ${endpoint} - ${statusCode || 'pending'}`);
    }
  },
  
  // For payment operations - highly restricted logging
  payment: (operation: string, reference?: string) => {
    if (config.isDevelopment) {
      console.info(`[PAYMENT] ${operation} - Ref: ${reference ? reference.substring(0, 8) + '***' : 'N/A'}`);
    }
  }
};

/**
 * Legacy console.log replacement for gradual migration
 * @deprecated Use logger.debug, logger.info, logger.warn, or logger.error instead
 */
export const secureLog = (message: string, data?: any) => {
  logger.info(message, data);
};
 