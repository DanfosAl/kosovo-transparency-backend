import "dotenv/config";
import { fetchDeclarationBuffer } from "./services/apkFetcher.js";
import { parsePdfDeclaration } from "./services/pdfParserAgent.js";
import { prisma } from "./lib/prisma.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const targetCabinet = [
  { name: "Albin Kurti",             role: "Kryeministër",                            party: "Lëvizja Vetëvendosje" },
  { name: "Besnik Bislimi",          role: "Zëvendëskryeministër",                    party: "Lëvizja Vetëvendosje" },
  { name: "Donika Gërvalla Schwarz", role: "Ministre e Punëve të Jashtme",            party: "Lëvizja Vetëvendosje" },
  { name: "Xhelal Sveçla",           role: "Ministër i Punëve të Brendshme",          party: "Lëvizja Vetëvendosje" },
  { name: "Hekuran Murati",          role: "Ministër i Financave",                    party: "Lëvizja Vetëvendosje" },
  { name: "Albulena Haxhiu",         role: "Ministre e Drejtësisë",                   party: "Lëvizja Vetëvendosje" },
  { name: "Arben Vitia",             role: "Ministër i Shëndetësisë",                 party: "Lëvizja Vetëvendosje" },
  { name: "Liburn Aliu",             role: "Ministër i Mjedisit dhe Infrastrukturës", party: "Lëvizja Vetëvendosje" },
];

async function seedCabinet() {
  console.log("🚀 Starting Cabinet Extraction Protocol...");

  for (const { name, role, party } of targetCabinet) {
    try {
      console.log(`\n🔍 Searching for: ${name} (2024)...`);

      // 1. Upsert Politician (create if not exists)
      const politician = await prisma.politician.upsert({
        where: { name },
        update: {},
        create: { name, currentRole: role, partyAffiliation: party, transparencyScore: 100 },
      });

      // 2. Skip if declaration for this year already saved (before any API calls)
      const existing = await prisma.declaration.findFirst({
        where: { politicianId: politician.id, year: 2024 },
      });
      if (existing) {
        console.log(`⏭️  Declaration already exists for ${name} (2024), skipping.`);
        continue;
      }

      // 3. Fetch PDF from the APK portal
      const { buffer, fileName } = await fetchDeclarationBuffer(name, 2024);

      // 4. Parse with Gemini 2.5 Flash
      console.log(`🤖 Parsing PDF with AI for ${name}...`);
      const payload = await parsePdfDeclaration(buffer, fileName);

      // 5. Save Declaration
      await prisma.declaration.create({
        data: { politicianId: politician.id, ...payload },
      });

      console.log(`✅ Successfully saved declaration for ${name}!`);
      console.log("⏳ Waiting 10 seconds...");
      await delay(10000);

    } catch (error) {
      console.error(`❌ Failed to process ${name}:`, error.message);
    }
  }

  console.log("\n🏁 Cabinet Extraction Complete!");
  await prisma.$disconnect();
}

seedCabinet();
