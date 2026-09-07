/**
 * SERVER-ONLY Google Sheets reader.
 *
 * The external sheets stay the source of truth; APEX only reads them. Nothing here writes to
 * any sheet, and no sheet is copied into the app.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

export type SheetRow = Record<string, string>;

/**
 * Read cache + request de-duplication.
 *
 * Sheets is quota-limited (read requests per minute). Portal pages read the same two ranges on
 * every visit, so identical reads inside the cache window reuse the last successful response,
 * concurrent identical reads share one in-flight request, and a rate-limited read falls back to
 * the last known rows rather than crashing the page.
 */
const CACHE_TTL_MS = 60_000;
/** How long a stale entry may still be served when the API refuses the refresh. */
const STALE_FALLBACK_MS = 30 * 60_000;
const cache = new Map<string, { rows: SheetRow[]; at: number }>();
const inFlight = new Map<string, Promise<SheetRow[]>>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchSheetRows(spreadsheetId: string, range: string): Promise<SheetRow[]> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new Error("Google Sheets connection is not configured on the server.");
  }

  // Up to 3 attempts, backing off only for rate limits / transient server errors.
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${GATEWAY_URL}/spreadsheets/${spreadsheetId}/values/${range}`, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const payload = (await response.json()) as { values?: string[][] };
      const values = payload.values ?? [];
      const [header, ...rest] = values;
      if (!header) return [];

      const keys = header.map((h) => String(h ?? "").trim());
      return rest
        .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
        .map((row) => {
          const obj: SheetRow = {};
          keys.forEach((key, i) => {
            if (key) obj[key] = String(row[i] ?? "").trim();
          });
          return obj;
        });
    }

    const body = await response.text();
    lastError = new Error(`Google Sheets read failed [${response.status}]: ${body}`);
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable) break;

    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : 500 * 2 ** attempt;
    if (attempt < 2) await sleep(Math.min(waitMs, 4000));
  }

  throw lastError ?? new Error("Google Sheets read failed.");
}

/**
 * Read a range and return one object per data row, keyed by the sheet's own header row.
 * Ragged rows are padded so every key exists (missing cells become "").
 */
export async function readSheetRows(spreadsheetId: string, range: string): Promise<SheetRow[]> {
  const cacheKey = `${spreadsheetId}!${range}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.rows;

  const pending = inFlight.get(cacheKey);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const rows = await fetchSheetRows(spreadsheetId, range);
      cache.set(cacheKey, { rows, at: Date.now() });
      return rows;
    } catch (error) {
      // Serve the last known good rows instead of failing the page outright.
      const stale = cache.get(cacheKey);
      if (stale && Date.now() - stale.at < STALE_FALLBACK_MS) {
        console.warn(`Google Sheets read failed, serving cached rows for ${cacheKey}:`, error);
        return stale.rows;
      }
      throw error;
    } finally {
      inFlight.delete(cacheKey);
    }
  })();

  inFlight.set(cacheKey, promise);
  return promise;
}

