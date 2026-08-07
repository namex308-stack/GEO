import type {
  AutomationJobId,
  AutomationLogEntry,
  AutomationLogLevel,
} from "./types";

export type AutomationLogger = {
  entries: AutomationLogEntry[];
  log: (
    level: AutomationLogLevel,
    event: string,
    detail?: Record<string, unknown>,
    attempt?: number
  ) => void;
  debug: (event: string, detail?: Record<string, unknown>, attempt?: number) => void;
  info: (event: string, detail?: Record<string, unknown>, attempt?: number) => void;
  warn: (event: string, detail?: Record<string, unknown>, attempt?: number) => void;
  error: (event: string, detail?: Record<string, unknown>, attempt?: number) => void;
};

export type CreateAutomationLoggerOptions = {
  jobId: AutomationJobId;
  runId: string;
  /** When false, do not mirror to console (tests). Default true. */
  consoleMirror?: boolean;
  now?: () => Date;
};

/**
 * Structured logger for automation runs. Collects entries for the result
 * payload and optionally mirrors to console as JSON lines.
 */
export function createAutomationLogger(
  options: CreateAutomationLoggerOptions
): AutomationLogger {
  const entries: AutomationLogEntry[] = [];
  const now = options.now ?? (() => new Date());
  const mirror = options.consoleMirror !== false;

  const log: AutomationLogger["log"] = (level, event, detail, attempt) => {
    const entry: AutomationLogEntry = {
      at: now().toISOString(),
      level,
      event,
      jobId: options.jobId,
      runId: options.runId,
      ...(attempt != null ? { attempt } : {}),
      ...(detail ? { detail } : {}),
    };
    entries.push(entry);
    if (mirror) {
      const line = JSON.stringify({ channel: "automation", ...entry });
      switch (level) {
        case "debug":
          console.debug(line);
          break;
        case "info":
          console.info(line);
          break;
        case "warn":
          console.warn(line);
          break;
        case "error":
          console.error(line);
          break;
        default: {
          const _exhaustive: never = level;
          return _exhaustive;
        }
      }
    }
  };

  return {
    entries,
    log,
    debug: (event, detail, attempt) => log("debug", event, detail, attempt),
    info: (event, detail, attempt) => log("info", event, detail, attempt),
    warn: (event, detail, attempt) => log("warn", event, detail, attempt),
    error: (event, detail, attempt) => log("error", event, detail, attempt),
  };
}

export function createRunId(random: () => number = Math.random): string {
  const ts = Date.now().toString(36);
  const rand = Math.floor(random() * 1e9).toString(36);
  return `run_${ts}_${rand}`;
}
