const sensitiveKey = /authorization|token|secret|password|email|phone|nickname|payment|idfa|aaid|fingerprint/i;

export function redactForLog(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactForLog);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, sensitiveKey.test(key) ? "[REDACTED]" : redactForLog(nested)])
  );
}

export type SafeDiagnosticEvent = {
  event: string;
  routeCode?: string;
  engineCode?: string;
  completionId?: string;
  errorCode?: string;
  queueState?: string;
};

export function createSafeDiagnosticEvent(event: SafeDiagnosticEvent): SafeDiagnosticEvent {
  return { ...event };
}
