import Parser from "rss-parser";
import prisma from "../lib/prisma.js";

const parser = new Parser();
const NEWS_FEED_URL = "https://telegrafi.com/lajme/feed/"; // Real RSS feed example
const RED_FLAG_KEYWORDS = ["korrupsion", "aktakuzë", "tender", "keqpërdorim", "arrestohet", "skandal"];

export async function scanForAlerts() {
  console.log("📰 Initiating Watchdog News Scan...");

  try {
    // 1. Get all politicians from your database
    const politicians = await prisma.politician.findMany();
    
    // 2. Fetch the latest news articles
    const feed = await parser.parseURL(NEWS_FEED_URL);
    console.log(`📥 Fetched ${feed.items.length} recent articles.`);

    for (const article of feed.items) {
      const contentToScan = `${article.title} ${article.contentSnippet || ""}`.toLowerCase();

      // 3. Check if the article mentions any of our politicians
      for (const pol of politicians) {
        if (contentToScan.includes(pol.name.toLowerCase())) {
          
          // 4. Check if it contains red flag keywords
          const hasRedFlag = RED_FLAG_KEYWORDS.some(keyword => contentToScan.includes(keyword));
          
          if (hasRedFlag) {
            console.log(`🚨 RED FLAG DETECTED for ${pol.name}: ${article.title}`);

            // 5. Check for duplicates (don't save the same article twice)
            const existingAlert = await prisma.watchdogAlert.findFirst({
              where: { url: article.link }
            });

            if (!existingAlert) {
              await prisma.watchdogAlert.create({
                data: {
                  politicianId: pol.id,
                  title: article.title,
                  url: article.link,
                  severity: "CRITICAL",
                  isResolved: false
                }
              });
              
              // Optionally deduct points from their transparency score
              await prisma.politician.update({
                where: { id: pol.id },
                data: { transparencyScore: { decrement: 15 } }
              });
              
              console.log(`💾 Saved alert and updated score for ${pol.name}`);
            }
          }
        }
      }
    }
    console.log("✅ Watchdog Scan Complete.");
  } catch (error) {
    console.error("❌ Watchdog Error:", error);
  }
}
