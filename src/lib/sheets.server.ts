/**
 * SERVER-ONLY Google Sheets reader.
 *
 * The external sheets stay the source of truth; APEX only reads them. Nothing here writes to
 * any sheet, and no sheet is copied into the app.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

export type SheetRow = Record<string, string>;

/**
 * Short-lived read cache.
 *
 * Sheets is quota-limited (read requests per minute); portal pages read the same two ranges on
 * every visit, so identical reads inside this window reuse the last successful response instead
 * of re-hitting the API. Failures are never cached.
 */
const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { rows: SheetRow[]; at: number }>();

/**
 * Read a range and return one object per data row, keyed by the sheet's own header row.
 * Ragged rows are padded so every key exists (missing cells become "").
 */
export async function readSheetRows(spreadsheetId: string, range: string): Promise<SheetRow[]> {
  const cacheKey = `${spreadsheetId}!${range}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.rows;

  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new Error("Google Sheets connection is not configured on the server.");
  }


  const response = await fetch(`${GATEWAY_URL}/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Google Sheets read failed [${response.status}]: ${body}`);
    throw new Error(`Google Sheets read failed [${response.status}]: ${body}`);
  }

  const payload = (await response.json()) as { values?: string[][] };
  const values = payload.values ?? [];
  const [header, ...rest] = values;
  if (!header) return [];

  const keys = header.map((h) => String(h ?? "").trim());
  const rows = rest
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row) => {
      const obj: SheetRow = {};
      keys.forEach((key, i) => {
        if (key) obj[key] = String(row[i] ?? "").trim();
      });
      return obj;
    });

  cache.set(cacheKey, { rows, at: Date.now() });
  return rows;
}
