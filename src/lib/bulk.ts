/**
 * Runs the same async action across a list of ids and reports how many
 * succeeded vs. failed, instead of letting one failure (a row some other
 * admin tab already changed, a dropped connection) abort the whole batch
 * the way a plain `Promise.all` would.
 */
export async function runBulk(ids: string[], action: (id: string) => Promise<unknown>) {
  const results = await Promise.allSettled(ids.map(action));
  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  return { succeeded, failed: results.length - succeeded };
}

/** Turns a runBulk() result (plus however many rows were skipped as not
 * eligible for the action) into one toast-friendly sentence. */
export function summarizeBulkResult(
  verb: string,
  { succeeded, failed }: { succeeded: number; failed: number },
  skipped = 0,
): string {
  const parts = [`${succeeded} ${verb}`];
  if (failed > 0) parts.push(`${failed} failed`);
  if (skipped > 0) parts.push(`${skipped} skipped (not eligible)`);
  return parts.join(', ');
}
