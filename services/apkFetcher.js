// ---------------------------------------------------------------------------
// APK Declaration Registry Fetcher
//
// Uses direct WordPress AJAX calls (no Puppeteer) to retrieve PDF declarations
// from the APK portal (https://apk-rks.net).
//
// Key discovery: the portal's custom.js calls admin-ajax.php with
//   action=items_filter_ajax, pt=rgj-deklarimit, is_declarations_page=true
// The `pt` (post type) value was the missing ingredient for earlier failures.
// ---------------------------------------------------------------------------

const AJAX_URL = "https://apk-rks.net/wp-admin/admin-ajax.php";
const REFERER  = "https://apk-rks.net/regjistrat-e-deklarimit/";
const PER_PAGE = 100;

const AJAX_HEADERS = {
  "Content-Type":    "application/x-www-form-urlencoded; charset=UTF-8",
  "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Referer":         REFERER,
  "Origin":          "https://apk-rks.net",
  "X-Requested-With":"XMLHttpRequest",
  "Accept":          "text/html, */*; q=0.01",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalise(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Call the APK portal AJAX endpoint and return the raw HTML data string.
 */
async function fetchRows(year, page, searchText) {
  const params = new URLSearchParams({
    action:                      "items_filter_ajax",
    is_declarations_page:        "true",
    is_arkiva_page:              "false",
    is_declarations_page_en:     "false",
    is_declarations_page_sr:     "false",
    is_arkiva_page_en:           "false",
    is_arkiva_page_sr:           "false",
    is_declarations_page_gift:   "false",
    page:                        String(page),
    template_id:                 "0",
    custom_tpl:                  "",
    "form_data[search_text]":    searchText,
    "form_data[date_year]":      String(year),
    pt:                          "rgj-deklarimit",
    per_page:                    String(PER_PAGE),
    date_field:                  "",
    parent_category_filter:      "",
    institution_field_filter:    "",
  });

  const resp = await fetch(AJAX_URL, {
    method:  "POST",
    headers: AJAX_HEADERS,
    body:    params.toString(),
  });

  if (!resp.ok) throw new Error(`APK AJAX HTTP ${resp.status} ${resp.statusText}`);

  const json = await resp.json();
  return json.data ?? "";
}

/**
 * Parse table rows from the AJAX HTML response.
 * Returns array of { name: string, pdfUrl: string|null }.
 */
function parseRows(html) {
  const rows = [];
  const trRe = /<tr[^>]*class="ItemsFilter-item[^"]*"[^>]*>([\s\S]*?)<\/tr>/g;
  let trMatch;
  while ((trMatch = trRe.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    // First <td> contains the name
    const tdMatch = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/);
    const name = tdMatch ? tdMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    // First <a href="..."> with a PDF path is the download link
    const hrefMatch = rowHtml.match(/href="([^"]+\.pdf[^"]*)"/i)
                   || rowHtml.match(/href="([^"]+\/uploads\/[^"]+)"/i);
    const pdfUrl = hrefMatch ? hrefMatch[1] : null;
    if (name) rows.push({ name, pdfUrl });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Fetch the declaration PDF for a given politician and year from the APK
 * registry, returning it as a Node.js Buffer ready for parsePdfDeclaration().
 *
 * @param {string} politicianName  - Full name as it appears on the APK portal.
 * @param {number|string} year     - Declaration year (e.g. 2024).
 * @returns {Promise<{ buffer: Buffer, fileName: string }>}
 */
export async function fetchDeclarationBuffer(politicianName, year) {
  if (!politicianName || typeof politicianName !== "string") {
    throw new Error("politicianName must be a non-empty string.");
  }

  const targetYear  = String(year);
  const normTarget  = normalise(politicianName);

  // ------------------------------------------------------------------
  // 1. Search by name first — fast path (usually 1 result)
  // ------------------------------------------------------------------
  const searchHtml = await fetchRows(targetYear, 1, politicianName);
  if (searchHtml && !searchHtml.includes("Nuk u gjet")) {
    const searchRows = parseRows(searchHtml);
    const match = searchRows.find(r => normalise(r.name) === normTarget)
               ?? searchRows.find(r => normalise(r.name).includes(normTarget) || normTarget.includes(normalise(r.name)));
    if (match) {
      return downloadPdf(match.pdfUrl, politicianName, targetYear, normTarget);
    }
  }

  // ------------------------------------------------------------------
  // 2. Fall back: paginate through all declarations for the year
  //    (handles name variations or encoding differences)
  // ------------------------------------------------------------------
  let page = 1;
  while (true) {
    const html = await fetchRows(targetYear, page, "");
    if (!html || html.includes("Nuk u gjet")) break;

    const rows = parseRows(html);
    if (rows.length === 0) break;

    const match = rows.find(r => normalise(r.name) === normTarget)
               ?? rows.find(r => normalise(r.name).includes(normTarget) || normTarget.includes(normalise(r.name)));

    if (match) {
      return downloadPdf(match.pdfUrl, politicianName, targetYear, normTarget);
    }

    if (rows.length < PER_PAGE) break; // last page
    page++;
  }

  throw new Error(
    `"${politicianName}" not found in the ${targetYear} declarations registry. ` +
    `Verify the exact name spelling as it appears on the APK portal.`
  );
}

async function downloadPdf(pdfUrl, politicianName, targetYear, normTarget) {
  if (!pdfUrl) {
    throw new Error(
      `Found "${politicianName}" in ${targetYear} declarations but no PDF link is available yet.`
    );
  }

  const pdfResp = await fetch(pdfUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Kosovo-Transparency-Bot/1.0)",
      "Accept":     "application/pdf,*/*",
      "Referer":    REFERER,
    },
  });

  if (!pdfResp.ok) {
    throw new Error(`HTTP ${pdfResp.status} downloading PDF from ${pdfUrl}`);
  }

  const buffer   = Buffer.from(await pdfResp.arrayBuffer());
  const fileName = pdfUrl.split("/").pop() || `${normTarget.replace(/\s/g, "_")}_${targetYear}.pdf`;

  return { buffer, fileName };
}
