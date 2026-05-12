import { fetchDeclarationBuffer } from "./services/apkFetcher.js";
import { parsePdfDeclaration } from "./services/pdfParserAgent.js";
import { prisma } from "./lib/prisma.js";

// Helper function to pause between scrapes
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const targetCabinet = [
  "Albin Kurti", // Kryeminist�r
  "Besnik Bislimi", // Z�vend�skryeminist�r
  "Donika G�rvalla-Schwarz", // Pun� t� Jashtme
  "Xhelal Sve�la", // Pun� t� Brendshme
  "Hekuran Murati", // Financave
  "Albulena Haxhiu", // Drejt�sis�
  "Arben Vitia", // Sh�ndet�sis�
  "Liburn Aliu" // Mjedisit dhe Infrastruktur�s
];

async function seedCabinet() {
  console.log("?? Starting Cabinet Extraction Protocol...");

  for (const name of targetCabinet) {
    try {
      console.log(`\n?? Searching for: ${name} (2024)...`);
      
      // 1. Fetch PDF from the portal
      const { buffer, fileName } = await fetchDeclarationBuffer(name, 2024);
      
      // 2. Parse with Gemini 2.5 Flash
      console.log(`?? Parsing PDF with AI for ${name}...`);
      const payload = await parsePdfDeclaration(buffer, fileName);

      // 3. Ensure Politician exists in Database
      let politician = await prisma.politician.findFirst({
        where: { name: name }
      });

      if (!politician) {
        politician = await prisma.politician.create({
          data: { name: name, transparencyScore: 100 }
        });
        console.log(`?? Created new profile for ${name} (ID: ${politician.id})`);
      }

      // 4. Save the Declaration
      const declaration = await prisma.declaration.create({
        data: { 
          politicianId: politician.id, 
          ...payload 
        },
      });

      console.log(`? Successfully saved declaration for ${name}!`);
      
      // 5. Be polite to the servers (Wait 10 seconds before the next one)
      console.log("? Waiting 10 seconds to avoid rate limits...");
      await delay(10000);

    } catch (error) {
      console.error(`? Failed to process ${name}:`, error.message);
    }
  }
  console.log("\n?? Cabinet Extraction Complete!");
}

seedCabinet();
