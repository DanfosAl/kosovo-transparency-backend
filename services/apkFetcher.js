import puppeteer from "puppeteer";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const REGISTRY_URL = "https://apk-rks.net/regjistrat-e-deklarimit/";

/**
 * How long (ms) to wait for the declarations table to appear after navigation
 * or after applying a filter. The APK portal uses WordPress + a DataTables
 * plugin that fetches rows via XHR, so this can be slow on cold starts.
 */
const TABLE_TIMEOUT_MS = 20_000;

/**
 * How long (ms) to wait between applying the year filter and the table
 * re-rendering with the filtered results.
 */
const FILTER_SETTLE_MS = 2_500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a string for fuzzy name matching:
 * lower-case, strip diacritics, collapse whitespace.
 *
 * @param {string} str
 * @returns {string}
 */
function normalise(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // strip combining diacritics
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Navigate to the APK declaration registry, locate the row for the given
 * politician and year, and return the PDF as a Node.js Buffer — ready to be
 * passed directly to parsePdfDeclaration().
 *
 * @param {string} politicianName  - Full name as it appears in the registry
 *                                   (diacritics are tolerated via normalisation).
 * @param {number|string} year     - Declaration year (e.g. 2024).
 * @returns {Promise<{ buffer: Buffer, fileName: string }>}
 *
 * @example
 * import { fetchDeclarationBuffer } from "./services/apkFetcher.js";
 * import { parsePdfDeclaration }    from "./services/pdfParserAgent.js";
 *
 * const { buffer, fileName } = await fetchDeclarationBuffer("Albin Kurti", 2024);
 * const payload = await parsePdfDeclaration(buffer, fileName);
 */
export async function fetchDeclarationBuffer(politicianName, year) {
  if (!politicianName || typeof politicianName !== "string") {
    throw new Error("politicianName must be a non-empty string.");
  }

  const targetYear = String(year);
  const normalisedTarget = normalise(politicianName);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",  // prevents OOM crashes in Docker / low-memory envs
    ],
  });

  const page = await browser.newPage();

  // Block images, fonts, and media to speed up the scrape
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    if (["image", "font", "media", "stylesheet"].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  try {
    // ------------------------------------------------------------------
    // 1. Navigate to the registry page
    // ------------------------------------------------------------------
    await page.goto(REGISTRY_URL, { waitUntil: "networkidle2", timeout: 30_000 });

    // ------------------------------------------------------------------
    // 2. Select the target year using the "Viti" (Year) dropdown/select
    //    The portal renders a <select> or custom dropdown; we try both.
    // ------------------------------------------------------------------
    const yearSelected = await page.evaluate((targetYear) => {
      // Strategy A: native <select> element labelled "Viti" or similar
      const selects = Array.from(document.querySelectorAll("select"));
      for (const sel of selects) {
        const label = (sel.getAttribute("aria-label") || sel.name || sel.id || "").toLowerCase();
        if (label.includes("vit") || label.includes("year")) {
          const option = Array.from(sel.options).find((o) => o.value === targetYear || o.text.trim() === targetYear);
          if (option) {
            sel.value = option.value;
            sel.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
          }
        }
      }

      // Strategy B: look for any <select> whose options contain the year
      for (const sel of selects) {
        const option = Array.from(sel.options).find((o) => o.value === targetYear || o.text.trim() === targetYear);
        if (option) {
          sel.value = option.value;
          sel.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
      }

      return false;
    }, targetYear);

    if (!yearSelected) {
      throw new Error(
        `Could not find a year filter on the APK portal for year "${targetYear}". ` +
        `The portal layout may have changed.`
      );
    }

    // Wait for the table to re-render after the year filter is applied
    await new Promise((resolve) => setTimeout(resolve, FILTER_SETTLE_MS));

    // ------------------------------------------------------------------
    // 3. Wait for the declarations table to be present in the DOM
    // ------------------------------------------------------------------
    const tableSelector = "table tbody tr, .declarations-table tbody tr, .wp-list-table tbody tr";
    try {
      await page.waitForSelector(tableSelector, { timeout: TABLE_TIMEOUT_MS });
    } catch {
      throw new Error(
        `Declarations table did not appear within ${TABLE_TIMEOUT_MS}ms after applying the year filter. ` +
        `Check whether the APK portal is reachable and that the year "${targetYear}" has published declarations.`
      );
    }

    // ------------------------------------------------------------------
    // 4. Scan ALL loaded rows for the politician's name (with pagination)
    // ------------------------------------------------------------------
    let downloadHref = null;
    let pageNum = 1;

    while (!downloadHref) {
      const result = await page.evaluate((normalisedTarget) => {
        /**
         * Inline normalise — must be self-contained because this runs in
         * the browser context, not in Node.
         */
        function norm(str) {
          return str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        }

        const rows = Array.from(document.querySelectorAll("table tbody tr"));

        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll("td"));
          const rowText = cells.map((c) => norm(c.innerText)).join(" ");

          if (!rowText.includes(normalisedTarget)) continue;

          // Look for a download link in this row — try Albanian ("Shkarko")
          // and English ("Download") labels, and also bare PDF hrefs.
          const link =
            row.querySelector('a[href*=".pdf"]') ||
            row.querySelector('a[href*="download"]') ||
            row.querySelector('a[href*="shkarko"]') ||
            Array.from(row.querySelectorAll("a")).find((a) => {
              const text = norm(a.innerText);
              return text.includes("shkarko") || text.includes("download") || text.includes("shiko");
            });

          if (link) return { href: link.href, found: true };

          // Row found but no download link in it yet — may need scroll/expand
          return { href: null, found: true, noLink: true };
        }

        return { found: false };
      }, normalisedTarget);

      if (result.found) {
        if (result.noLink) {
          throw new Error(
            `Found a row matching "${politicianName}" for year ${targetYear} but it contains no ` +
            `download link. The declaration may not be published yet.`
          );
        }
        downloadHref = result.href;
        break;
      }

      // ------------------------------------------------------------------
      // 4a. Try to go to the next DataTables / pagination page
      // ------------------------------------------------------------------
      const nextPageClicked = await page.evaluate(() => {
        const next =
          document.querySelector(".paginate_button.next:not(.disabled)") ||
          document.querySelector('a[aria-label="Next"]') ||
          document.querySelector(".next-page:not([disabled])");
        if (next) {
          next.click();
          return true;
        }
        return false;
      });

      if (!nextPageClicked) {
        throw new Error(
          `Politician "${politicianName}" not found in the ${targetYear} declarations registry ` +
          `after scanning ${pageNum} page(s). Verify the exact name spelling as it appears on the APK portal.`
        );
      }

      pageNum++;
      // Wait for the next page of results to render
      await new Promise((resolve) => setTimeout(resolve, FILTER_SETTLE_MS));
    }

    // ------------------------------------------------------------------
    // 5. Download the PDF as a Buffer using Node's native fetch()
    //    (no browser download manager involved)
    // ------------------------------------------------------------------
    let pdfBuffer;
    let fileName;

    try {
      const response = await fetch(downloadHref, {
        headers: {
          // Mimic a browser request to avoid bot-detection rejections
          "User-Agent": "Mozilla/5.0 (compatible; Kosovo-Transparency-Bot/1.0)",
          Accept: "application/pdf,*/*",
          Referer: REGISTRY_URL,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} for URL: ${downloadHref}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
        console.warn(
          `[apkFetcher] Unexpected content-type "${contentType}" for ${downloadHref}. ` +
          `Proceeding anyway — the LLM parser will reject it if it is not a valid PDF.`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);

      // Derive a meaningful file name from the URL, fallback to a safe default
      const urlPath = new URL(downloadHref).pathname;
      fileName = urlPath.split("/").pop() || `${normalise(politicianName).replace(/\s/g, "_")}_${targetYear}.pdf`;
    } catch (fetchError) {
      throw new Error(`Failed to download PDF from "${downloadHref}": ${fetchError.message}`);
    }

    return { buffer: pdfBuffer, fileName };
  } finally {
    // ------------------------------------------------------------------
    // Always clean up — no zombie Chrome processes left behind
    // ------------------------------------------------------------------
    try { await page.close(); } catch { /* ignore */ }
    try { await browser.close(); } catch { /* ignore */ }
  }
}
