/**
 * Structured logger. Emits one JSON object per line in production and a
 * readable line in development. Sensitive keys are redacted.
 *
 *   const log = createLogger({ module: "checkin" });
 *   log.info("guest checked in", { guestId });
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};
const REDACT_PATTERN = /pass(word)?|secret|token|authorization|cookie|api[-_]?key/i;
export const REDACTED = "[redacted]";

export interface Logger {
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
  child(bindings: LogFields): Logger;
}

export interface LoggerOptions {
  level?: LogLevel;
  format?: "json" | "pretty";
  write?: (level: LogLevel, line: string) => void;
  now?: () => Date;
}

function serialize(value: unknown, depth = 0): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (depth > 5 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => serialize(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    out[key] = REDACT_PATTERN.test(key) ? REDACTED : serialize(inner, depth + 1);
  }
  return out;
}

function defaultWrite(level: LogLevel, line: string) {
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

function envLevel(): LogLevel {
  const raw = typeof process !== "undefined" ? process.env.LOG_LEVEL : undefined;
  return raw && raw in LEVEL_ORDER ? (raw as LogLevel) : "info";
}

export function createLogger(bindings: LogFields = {}, options: LoggerOptions = {}): Logger {
  const level = options.level ?? envLevel();
  const format = options.format ?? (process.env.NODE_ENV === "development" ? "pretty" : "json");
  const write = options.write ?? defaultWrite;
  const now = options.now ?? (() => new Date());

  function log(msgLevel: LogLevel, msg: string, fields: LogFields = {}) {
    if (LEVEL_ORDER[msgLevel] < LEVEL_ORDER[level]) return;
    const payload = serialize({ ...bindings, ...fields }) as LogFields;
    const time = now().toISOString();
    const line =
      format === "json"
        ? JSON.stringify({ level: msgLevel, time, msg, ...payload })
        : `${time} ${msgLevel.toUpperCase().padEnd(5)} ${msg}${
            Object.keys(payload).length ? ` ${JSON.stringify(payload)}` : ""
          }`;
    write(msgLevel, line);
  }

  return {
    debug: (msg, fields) => log("debug", msg, fields),
    info: (msg, fields) => log("info", msg, fields),
    warn: (msg, fields) => log("warn", msg, fields),
    error: (msg, fields) => log("error", msg, fields),
    child: (more) => createLogger({ ...bindings, ...more }, options),
  };
}

export const logger = createLogger({ app: "wedding" });
