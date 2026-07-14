type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE =
  /(password|token|authorization|apikey|api_key|secret|refresh_token|access_token)/i;

function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    if (SENSITIVE.test(value) && value.length > 12) {
      return '[redacted]';
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE.test(key) ? '[redacted]' : redact(nested);
    }
    return out;
  }
  return value;
}

function shouldEmit(level: LogLevel): boolean {
  if (__DEV__) {
    return true;
  }
  // Production: only warn/error reach the console; prefer crash adapter for errors.
  return level === 'warn' || level === 'error';
}

/**
 * Production-safe logger — never prints secrets; silences debug/info outside __DEV__.
 */
export const logger = {
  debug(...args: unknown[]) {
    if (shouldEmit('debug')) {
      console.debug('[taste]', ...args.map(redact));
    }
  },
  info(...args: unknown[]) {
    if (shouldEmit('info')) {
      console.info('[taste]', ...args.map(redact));
    }
  },
  warn(...args: unknown[]) {
    if (shouldEmit('warn')) {
      console.warn('[taste]', ...args.map(redact));
    }
  },
  error(...args: unknown[]) {
    if (shouldEmit('error')) {
      console.error('[taste]', ...args.map(redact));
    }
  },
};
