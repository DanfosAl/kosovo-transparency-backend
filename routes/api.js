import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recompute totalAssets and totalLiabilities from the live nested arrays.
 * APK declarations sometimes contain pre-printed totals that don't match the
 * line items, so we always derive the totals ourselves before sending to the
 * client.
 *
 * @param {object} declaration - Prisma Declaration object with nested assets
 *                               and liabilities arrays already included.
 * @returns {object} The same declaration with corrected total fields.
 */
function recalculateTotals(declaration) {
  const totalAssets = declaration.assets.reduce(
    (sum, asset) => sum + asset.declaredValue,
    0
  );
  const totalLiabilities = declaration.liabilities.reduce(
    (sum, liability) => sum + liability.remainingAmount,
    0
  );
  const totalHouseholdIncome = declaration.incomeSources.reduce(
    (sum, source) => sum + source.annualAmount,
    0
  );

  return { ...declaration, totalAssets, totalLiabilities, totalHouseholdIncome };
}

// ---------------------------------------------------------------------------
// Endpoint 1 — GET /api/politicians
// Dashboard: all politicians ordered by transparencyScore ASC
// (lowest score = most suspicious → appears at top of the watchdog list)
// ---------------------------------------------------------------------------
router.get("/politicians", async (req, res) => {
  try {
    const politicians = await prisma.politician.findMany({
      select: {
        id: true,
        name: true,
        currentRole: true,
        partyAffiliation: true,
        transparencyScore: true,
      },
      orderBy: { transparencyScore: "asc" },
    });

    res.json(politicians);
  } catch (error) {
    console.error("[GET /politicians]", error);
    res.status(500).json({ error: "Failed to fetch politicians." });
  }
});

// ---------------------------------------------------------------------------
// Endpoint 2 — GET /api/politicians/:id
// Profile hero + alerts: single politician with all watchdog alerts
// ---------------------------------------------------------------------------
router.get("/politicians/:id", async (req, res) => {
  try {
    const politician = await prisma.politician.findUnique({
      where: { id: req.params.id },
      include: {
        alerts: {
          orderBy: [
            // Surface unresolved critical alerts first
            { isResolved: "asc" },
            { severity: "asc" },
          ],
        },
      },
    });

    if (!politician) {
      return res.status(404).json({ error: "Politician not found." });
    }

    res.json(politician);
  } catch (error) {
    console.error("[GET /politicians/:id]", error);
    res.status(500).json({ error: "Failed to fetch politician." });
  }
});

// ---------------------------------------------------------------------------
// Endpoint 3 — GET /api/politicians/:id/comparison
// Discrepancy engine: two most recent declarations with all nested records,
// totals recalculated from line items
// ---------------------------------------------------------------------------
router.get("/politicians/:id/comparison", async (req, res) => {
  try {
    const politician = await prisma.politician.findUnique({
      where: { id: req.params.id },
      include: {
        declarations: {
          orderBy: { year: "desc" },
          take: 2,
          include: {
            assets: true,
            liabilities: true,
            incomeSources: true,
          },
        },
      },
    });

    if (!politician) {
      return res.status(404).json({ error: "Politician not found." });
    }

    // Recalculate totals from live nested data before sending
    const correctedDeclarations = politician.declarations.map(recalculateTotals);

    res.json({ ...politician, declarations: correctedDeclarations });
  } catch (error) {
    console.error("[GET /politicians/:id/comparison]", error);
    res.status(500).json({ error: "Failed to fetch comparison data." });
  }
});

export default router;
