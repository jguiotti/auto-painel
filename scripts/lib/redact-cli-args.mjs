/**
 * Redacts sensitive CLI flag values for safe logging.
 */
export function redactCliArgs(args) {
  const sensitiveFlags = new Set(["--password", "-p", "--token"]);
  const copy = [...args];
  for (let i = 0; i < copy.length; i++) {
    if (sensitiveFlags.has(copy[i]) && i + 1 < copy.length) {
      copy[i + 1] = "[REDACTED]";
    }
  }
  return copy;
}
