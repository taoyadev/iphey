/* eslint-disable no-console */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogMeta = Record<string, unknown>;

const formatMessage = (level: LogLevel, message?: string, meta?: LogMeta) => {
  const timestamp = new Date().toISOString();
  const parts = [`[${timestamp}]`, `[${level.toUpperCase()}]`];
  if (message) {
    parts.push(message);
  }
  if (meta && Object.keys(meta).length > 0) {
    parts.push(JSON.stringify(meta));
  }
  return parts.join(' ');
};

const logWriter = (level: LogLevel) => {
  const consoleMethod =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : level === 'debug'
          ? console.debug
          : console.log;
  return (metaOrMessage: LogMeta | string, maybeMessage?: string) => {
    if (typeof metaOrMessage === 'string') {
      consoleMethod(formatMessage(level, metaOrMessage));
      return;
    }

    const message = maybeMessage ?? '';
    consoleMethod(formatMessage(level, message, metaOrMessage));
  };
};

export const logger = {
  debug: logWriter('debug'),
  info: logWriter('info'),
  warn: logWriter('warn'),
  error: logWriter('error'),
};

export const redactIp = (ip: string | null | undefined): string | undefined => {
  if (!ip) return undefined;
  const [major, minor = 'x', ...rest] = ip.split('.');
  if (rest.length) {
    return `${major}.${minor}.x.x`;
  }
  return ip.slice(0, Math.max(0, ip.length - 4)) + '****';
};
