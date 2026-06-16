// routes/trends.js
const express = require("express");
const { getDb } = require("../db");

const router = express.Router();

// GET /api/trends
// Returns monthly net revenue aggregated by month, optionally broken down by category or region
router.get("/", (req, res) => {
  try {
    const db = getDb();
    const { breakdown } = req.query; // ?breakdown=category | region

    let rows;

    if (breakdown === "category") {
      rows = db
        .prepare(
          `
        SELECT
          month,
          category,
          ROUND(SUM(net_revenue_usd), 2) AS net_revenue
        FROM sales
        GROUP BY month, category
        ORDER BY month ASC, category ASC
      `
        )
        .all();
    } else if (breakdown === "region") {
      rows = db
        .prepare(
          `
        SELECT
          month,
          region,
          ROUND(SUM(net_revenue_usd), 2) AS net_revenue
        FROM sales
        GROUP BY month, region
        ORDER BY month ASC, region ASC
      `
        )
        .all();
    } else {
      // Default: overall monthly trend
      rows = db
        .prepare(
          `
        SELECT
          month,
          ROUND(SUM(net_revenue_usd), 2) AS net_revenue,
          ROUND(SUM(units_sold), 0)       AS units_sold
        FROM sales
        GROUP BY month
        ORDER BY month ASC
      `
        )
        .all();
    }

    res.json({ success: true, count: rows.length, breakdown: breakdown ?? "total", trends: rows });
  } catch (err) {
    console.error("GET /api/trends error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch trends." });
  }
});

module.exports = router;
