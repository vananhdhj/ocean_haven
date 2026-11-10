/**
 * Stored procedures raise business-rule violations with THROW 50000–50999
 * and a message meant for the user (e.g. "Room is not available for selected dates.").
 * Returns that message, or null for any other (technical) error.
 */
export function businessErrorMessage(err: unknown): string | null {
  const number = (err as { number?: unknown } | null)?.number;
  if (typeof number === "number" && number >= 50000 && number < 51000) {
    return (err as Error).message;
  }
  return null;
}
