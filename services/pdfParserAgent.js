import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";

// ---------------------------------------------------------------------------
// Client initialisation
// The caller must set GEMINI_API_KEY in the environment.
// ---------------------------------------------------------------------------
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a forensic financial auditor specialising in
public-sector asset declaration analysis for the Republic of Kosovo's
Anti-Corruption Agency (AKK) and Agency for Prevention of Corruption (APK).

Your sole task is to extract structured financial data from scanned APK
declaration PDFs and return it as a single, minified JSON object.

EXTRACTION RULES
----------------
1. Currency normalisation  — Convert all values to EUR (whole numbers, no
   decimals). If a value is stated in another currency (ALL, USD, CHF, etc.),
   use the exchange rate implied by the document or a conservative estimate.
   If no rate is available, note the original currency in the "description"
   field and set the numeric value to 0.
2. Dates                   — ISO-8601 format only (YYYY-MM-DD). If only a
   year is available, use YYYY-01-01.
3. Ownership mapping       — Map declarant owner to "DECLARANT", spouse to
   "SPOUSE", jointly held to "JOINT", children to "CHILDREN". Default to
   "DECLARANT" when ownership is ambiguous.
4. Asset category mapping  — Map assets to exactly one of:
     REAL_ESTATE       (land, apartments, houses, commercial premises)
     VEHICLE           (cars, motorcycles, boats, agricultural vehicles)
     BUSINESS_EQUITY   (shares, stakes, partnerships, sole trader interests)
     CASH              (bank accounts, savings, cash-in-hand)
     CRYPTO            (cryptocurrency, NFTs, digital assets)
   If an asset cannot be mapped, default to CASH and describe it accurately.
5. Totals                  — Compute totalAssets, totalLiabilities, and
   totalHouseholdIncome by summing the respective arrays. Do NOT trust
   pre-printed totals; recompute from line items.
6. Missing data            — Use null for any field that is genuinely absent.
   Never fabricate values.
7. submissionDate          — Use the date the declaration was signed or
   officially submitted. If absent, default to the last day of the declared
   year (YYYY-12-31).

CRITICAL: Return ONLY the raw JSON object described below. No markdown
fences, no commentary, no preamble. Any character outside the JSON object
will cause a fatal parsing failure.`;

// ---------------------------------------------------------------------------
// Output JSON schema (mirrors Prisma models for a direct prisma.declaration.create())
// ---------------------------------------------------------------------------
const DECLARATION_SCHEMA = {
  type: "OBJECT",
  description: "A single APK financial declaration, ready for database insertion.",
  properties: {
    year: {
      type: "INTEGER",
      description: "The calendar year this declaration covers.",
    },
    submissionDate: {
      type: "STRING",
      description: "ISO-8601 date the declaration was submitted (YYYY-MM-DD).",
    },
    totalAssets: {
      type: "NUMBER",
      description: "Sum of all declared asset values in EUR.",
    },
    totalLiabilities: {
      type: "NUMBER",
      description: "Sum of all declared liability amounts in EUR.",
    },
    totalHouseholdIncome: {
      type: "NUMBER",
      description: "Sum of all income source amounts in EUR.",
    },
    assets: {
      type: "ARRAY",
      description: "All assets declared in this filing.",
      items: {
        type: "OBJECT",
        properties: {
          category: {
            type: "STRING",
            enum: ["REAL_ESTATE", "VEHICLE", "BUSINESS_EQUITY", "CASH", "CRYPTO"],
          },
          description: {
            type: "STRING",
            description: "Free-text description of the asset (address, make/model, company name, etc.).",
          },
          origin: {
            type: "STRING",
            description: "How the asset was acquired: e.g. 'purchased', 'inherited', 'gift', 'unknown'.",
          },
          acquisitionYear: {
            type: "INTEGER",
            description: "Year the asset was acquired.",
          },
          declaredValue: {
            type: "NUMBER",
            description: "Declared market value in EUR.",
          },
          ownership: {
            type: "STRING",
            enum: ["DECLARANT", "SPOUSE", "JOINT", "CHILDREN"],
          },
        },
        required: ["category", "description", "origin", "acquisitionYear", "declaredValue", "ownership"],
      },
    },
    liabilities: {
      type: "ARRAY",
      description: "All liabilities declared in this filing.",
      items: {
        type: "OBJECT",
        properties: {
          creditor: {
            type: "STRING",
            description: "Name of the lending institution or individual creditor.",
          },
          purpose: {
            type: "STRING",
            description: "Stated purpose of the loan or obligation.",
          },
          totalAmount: {
            type: "NUMBER",
            description: "Original total loan amount in EUR.",
          },
          remainingAmount: {
            type: "NUMBER",
            description: "Outstanding balance remaining in EUR.",
          },
          ownership: {
            type: "STRING",
            enum: ["DECLARANT", "SPOUSE", "JOINT", "CHILDREN"],
          },
        },
        required: ["creditor", "purpose", "totalAmount", "remainingAmount", "ownership"],
      },
    },
    incomeSources: {
      type: "ARRAY",
      description: "All income sources declared in this filing.",
      items: {
        type: "OBJECT",
        properties: {
          sourceName: {
            type: "STRING",
            description: "Name of the employer, institution, or income-generating activity.",
          },
          annualAmount: {
            type: "NUMBER",
            description: "Gross annual income amount in EUR.",
          },
          ownership: {
            type: "STRING",
            enum: ["DECLARANT", "SPOUSE", "JOINT", "CHILDREN"],
          },
        },
        required: ["sourceName", "annualAmount", "ownership"],
      },
    },
  },
  required: [
    "year",
    "submissionDate",
    "totalAssets",
    "totalLiabilities",
    "totalHouseholdIncome",
    "assets",
    "liabilities",
    "incomeSources",
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validate and coerce the parsed declaration to ensure numeric fields are
 * actual numbers and required arrays are present.
 *
 * @param {object} data - Raw parsed object from the LLM.
 * @returns {object} Coerced declaration data.
 * @throws {Error} If the structure is fundamentally malformed.
 */
function validateDeclarationPayload(data) {
  if (!data || typeof data !== "object") {
    throw new Error("LLM returned a non-object payload.");
  }

  const requiredTopLevel = [
    "year",
    "submissionDate",
    "totalAssets",
    "totalLiabilities",
    "totalHouseholdIncome",
    "assets",
    "liabilities",
    "incomeSources",
  ];

  for (const key of requiredTopLevel) {
    if (data[key] === undefined || data[key] === null) {
      throw new Error(`Missing required field in LLM response: "${key}".`);
    }
  }

  if (!Array.isArray(data.assets)) throw new Error('"assets" must be an array.');
  if (!Array.isArray(data.liabilities)) throw new Error('"liabilities" must be an array.');
  if (!Array.isArray(data.incomeSources)) throw new Error('"incomeSources" must be an array.');

  // Coerce numeric totals (LLMs sometimes return strings)
  data.totalAssets = Number(data.totalAssets);
  data.totalLiabilities = Number(data.totalLiabilities);
  data.totalHouseholdIncome = Number(data.totalHouseholdIncome);

  if (
    isNaN(data.totalAssets) ||
    isNaN(data.totalLiabilities) ||
    isNaN(data.totalHouseholdIncome)
  ) {
    throw new Error("One or more total fields could not be coerced to a number.");
  }

  // Coerce nested numeric fields
  data.assets = data.assets.map((a, i) => ({
    ...a,
    acquisitionYear: Number(a.acquisitionYear),
    declaredValue: Number(a.declaredValue),
  }));

  data.liabilities = data.liabilities.map((l) => ({
    ...l,
    totalAmount: Number(l.totalAmount),
    remainingAmount: Number(l.remainingAmount),
  }));

  data.incomeSources = data.incomeSources.map((s) => ({
    ...s,
    annualAmount: Number(s.annualAmount),
  }));

  return data;
}

/**
 * Shape the validated LLM output into the exact nested-write structure
 * expected by prisma.declaration.create({ data: ... }).
 *
 * The caller is responsible for supplying `politicianId`.
 *
 * @param {object} validated - Output of validateDeclarationPayload().
 * @returns {object} Prisma create payload (without politicianId).
 */
function toPrismaCreatePayload(validated) {
  return {
    year: validated.year,
    submissionDate: new Date(validated.submissionDate),
    totalAssets: validated.totalAssets,
    totalLiabilities: validated.totalLiabilities,
    totalHouseholdIncome: validated.totalHouseholdIncome,
    assets: {
      create: validated.assets.map(({ category, description, origin, acquisitionYear, declaredValue, ownership }) => ({
        category,
        description,
        origin,
        acquisitionYear,
        declaredValue,
        ownership,
      })),
    },
    liabilities: {
      create: validated.liabilities.map(({ creditor, purpose, totalAmount, remainingAmount, ownership }) => ({
        creditor,
        purpose,
        totalAmount,
        remainingAmount,
        ownership,
      })),
    },
    incomeSources: {
      create: validated.incomeSources.map(({ sourceName, annualAmount, ownership }) => ({
        sourceName,
        annualAmount,
        ownership,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Parse an APK declaration PDF using the Gemini Files API and structured output.
 *
 * @param {Buffer}  pdfBuffer         - Raw PDF file contents.
 * @param {string}  originalFileName  - Original file name (used for upload metadata).
 * @returns {Promise<object>} Prisma-ready nested create payload (no politicianId).
 *
 * @example
 * import { parsePdfDeclaration } from "./services/pdfParserAgent.js";
 * import { prisma } from "./lib/prisma.js";
 *
 * const payload = await parsePdfDeclaration(pdfBuffer, "declaration_2024.pdf");
 * const declaration = await prisma.declaration.create({
 *   data: { politicianId: "...", ...payload },
 * });
 */
export async function parsePdfDeclaration(pdfBuffer, originalFileName = "declaration.pdf") {
  if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    throw new Error("pdfBuffer must be a non-empty Buffer.");
  }

  // 1. Upload the PDF via the Files API so the model can read the full document.
  let uploadedFile;
  try {
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    const uploadResponse = await ai.files.upload({
      file: blob,
      config: { mimeType: "application/pdf", displayName: originalFileName },
    });
    uploadedFile = uploadResponse;
  } catch (uploadError) {
    throw new Error(`PDF upload to Gemini Files API failed: ${uploadError.message}`);
  }

  // 2. Ask the model to extract structured data using the declared JSON schema.
  let rawText;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: createUserContent([
        createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
        "Extract all financial declaration data from this APK document.",
      ]),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: DECLARATION_SCHEMA,
        temperature: 0,       // deterministic extraction
        thinkingConfig: {
          thinkingBudget: 0,  // disable reasoning tokens for faster extraction
        },
      },
    });

    rawText = response.text;
  } catch (generationError) {
    throw new Error(`Gemini generation failed: ${generationError.message}`);
  } finally {
    // 3. Always delete the uploaded file to avoid storage accumulation.
    try {
      await ai.files.delete(uploadedFile.name);
    } catch {
      // Non-fatal: log but do not rethrow.
      console.warn(`[pdfParserAgent] Failed to delete uploaded file "${uploadedFile?.name}".`);
    }
  }

  // 4. Parse and validate the JSON output.
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(
      `LLM returned malformed JSON. Raw response (first 500 chars): ${String(rawText).slice(0, 500)}`
    );
  }

  const validated = validateDeclarationPayload(parsed);
  return toPrismaCreatePayload(validated);
}
