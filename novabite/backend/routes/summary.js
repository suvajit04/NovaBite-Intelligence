// routes/summary.js
const express = require("express");
const { getDb } = require("../db");

const router = express.Router();

// GET /api/summary
// Returns top-level KPIs
router.get("/", (req, res) => {
  try {
    const db = getDb();

    const kpis = db
      .prepare(
        `
      SELECT
        ROUND(SUM(net_revenue_usd), 2)                                    AS total_net_revenue,
        ROUND(SUM(units_sold), 0)                                         AS total_units_sold,
        ROUND(SUM(gross_profit_usd) / NULLIF(SUM(net_revenue_usd),0) * 100, 2) AS gross_profit_margin_pct,
        ROUND(SUM(gross_profit_usd), 2)                                   AS total_gross_profit
      FROM sales
    `
      )
      .get();

    const topRegion = db
      .prepare(
        `
      SELECT region, ROUND(SUM(net_revenue_usd), 2) AS revenue
      FROM sales
      GROUP BY region
      ORDER BY revenue DESC
      LIMIT 1
    `
      )
      .get();

    const topChannel = db
      .prepare(
        `
      SELECT channel, ROUND(SUM(net_revenue_usd), 2) AS revenue
      FROM sales
      GROUP BY channel
      ORDER BY revenue DESC
      LIMIT 1
    `
      )
      .get();

    const topProduct = db
      .prepare(
        `
      SELECT product_name, ROUND(SUM(net_revenue_usd), 2) AS revenue
      FROM sales
      GROUP BY product_name
      ORDER BY revenue DESC
      LIMIT 1
    `
      )
      .get();

    res.json({
      success: true,
      summary: {
        ...kpis,
        top_region: topRegion?.region ?? null,
        top_region_revenue: topRegion?.revenue ?? null,
        top_channel: topChannel?.channel ?? null,
        top_channel_revenue: topChannel?.revenue ?? null,
        top_product: topProduct?.product_name ?? null,
        top_product_revenue: topProduct?.revenue ?? null,
      },
    });
  } catch (err) {
    console.error("GET /api/summary error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch summary." });
  }
});

module.exports = router;
