/**
 * Returns the canonical base URL of the application.
 *
 * Priority:
 *  1. `NEXT_PUBLIC_APP_URL` env var (explicit, works on both client & server)
 *  2. `window.location.origin` (client-side only, always correct)
 *  3. `http://localhost:3000` (local dev fallback)
 *
 * Always use this instead of hard-coding any URL so that development and
 * production environments work without code changes.
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}
