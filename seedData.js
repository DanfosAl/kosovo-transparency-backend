import "dotenv/config";
import { fetchDeclarationBuffer } from "./services/apkFetcher.js";
import { parsePdfDeclaration } from "./services/pdfParserAgent.js";
import { prisma } from "./lib/prisma.js";

const YEAR = 2024;

/**
 * Seed politicians must exist before declarations can be created (foreign key).
 * We upsert on name so re-running the script is idempotent.
 * These are placeholder role/party values — update them as needed.
 */
const SEED_POLITICIANS = [
  {
    name: "Albin Kurti",
    currentRole: "Kryeministër",
    partyAffiliation: "Lëvizja Vetëvendosje",
  },
  {
    name: "Vjosa Osmani",
    currentRole: "Presidente",
    partyAffiliation: "Lëvizja Vetëvendosje",
  },
  {
    name: "Xhelal Sveçla",
    currentRole: "Ministër i Punëve të Brendshme",
    partyAffiliation: "Lëvizja Vetëvendosje",
  },
];

async function seed() {
  console.log("=== Kosovo Transparency Seed ===\n");

  for (const seedData of SEED_POLITICIANS) {
    const { name } = seedData;
    console.log(`[${name}] Starting...`);

    try {
      // ------------------------------------------------------------------
      // 1. Upsert the politician so the script is safely re-runnable
      // ------------------------------------------------------------------
      const politician = await prisma.politician.upsert({
        where: { name },
        update: {},
        create: {
          name: seedData.name,
          currentRole: seedData.currentRole,
          partyAffiliation: seedData.partyAffiliation,
          transparencyScore: 0,
        },
      });

      console.log(`[${name}] Politician upserted — id: ${politician.id}`);

      // ------------------------------------------------------------------
      // 2. Skip if a declaration for this year already exists
      // ------------------------------------------------------------------
      const existing = await prisma.declaration.findFirst({
        where: { politicianId: politician.id, year: YEAR },
        select: { id: true },
      });

      if (existing) {
        console.log(`[${name}] Declaration for ${YEAR} already exists (id: ${existing.id}), skipping.\n`);
        continue;
      }

      // ------------------------------------------------------------------
      // 3. Scrape the PDF from the APK registry
      // ------------------------------------------------------------------
      console.log(`[${name}] Fetching PDF from APK registry for year ${YEAR}...`);
      const { buffer, fileName } = await fetchDeclarationBuffer(name, YEAR);
      console.log(`[${name}] PDF downloaded — ${buffer.length} bytes, file: ${fileName}`);

      // ------------------------------------------------------------------
      // 4. Parse the PDF with the Gemini AI agent
      // ------------------------------------------------------------------
      console.log(`[${name}] Sending PDF to Gemini parser...`);
      const declarationPayload = await parsePdfDeclaration(buffer, fileName);
      console.log(`[${name}] Gemini parsed ${declarationPayload.assets.create.length} asset(s), ` +
        `${declarationPayload.liabilities.create.length} liability(ies), ` +
        `${declarationPayload.incomeSources.create.length} income source(s).`);

      // ------------------------------------------------------------------
      // 5. Persist to the database
      // ------------------------------------------------------------------
      const declaration = await prisma.declaration.create({
        data: {
          politicianId: politician.id,
          ...declarationPayload,
        },
      });

      console.log(`[${name}] Declaration saved — id: ${declaration.id}, year: ${declaration.year}`);
      console.log(`[${name}] ✓ Done.\n`);
    } catch (error) {
      // Log and continue — one failure should not abort the whole seed run
      console.error(`[${name}] ✗ Failed: ${error.message}\n`);
    }
  }

  console.log("=== Seed complete ===");
}

seed()
  .catch((error) => {
    console.error("Fatal seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
