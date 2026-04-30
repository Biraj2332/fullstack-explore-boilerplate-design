import { Logger } from '@nestjs/common';

const logger = new Logger('HttpRetry');

/**
 * Wraps the global `fetch` with exponential-backoff retry logic.
 *
 * @param url       Target URL
 * @param options   Standard RequestInit options
 * @param retries   Max number of retry attempts after the first failure (default 3)
 * @param delayMs   Initial back-off delay in ms; doubled on each attempt (default 300)
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  delayMs = 300,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);

      // 2xx/3xx ─ success; 4xx ─ client error, no point retrying
      if (res.ok || res.status < 500) return res;

      logger.warn(
        `fetchWithRetry [${attempt + 1}/${retries + 1}]: ${options.method ?? 'GET'} ${url} → HTTP ${res.status}`,
      );
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e: any) {
      logger.warn(
        `fetchWithRetry [${attempt + 1}/${retries + 1}]: ${options.method ?? 'GET'} ${url} → ${e.message}`,
      );
      lastError = e;
    }

    if (attempt < retries) {
      // Exponential back-off: 300 ms, 600 ms, 1200 ms, …
      await new Promise<void>((r) => setTimeout(r, delayMs * Math.pow(2, attempt)));
    }
  }

  throw lastError ?? new Error(`fetchWithRetry: all ${retries + 1} attempts failed for ${url}`);
}
