// routes/products.js
const express = require("express");
const { getDb } = require("../db");

const router = express.Router();

// GET /api/products
// Returns distinct products with total net revenue and units sold
router.get("/", (req, res) => {
  try {
    const db = getDb();
    // Use a grouping that works with the CSV-backed JS fallback adapter.
    // The fallback understands grouping by product_name, so aggregate by that
    // and normalize the column names to the API contract.
    const rows = db
      .prepare(
        `
      SELECT
        product_name,
        category,
        subcategory,
        SUM(units_sold)      AS total_units_sold,
        SUM(net_revenue_usd) AS total_net_revenue,
        SUM(gross_profit_usd) AS total_gross_profit
      FROM sales
      GROUP BY product_name, category, subcategory
      ORDER BY total_net_revenue DESC
    `
      )
      .all() || [];

    // Normalize fields so frontend can rely on consistent keys
    const products = rows.map((r) => ({
      sku: r.sku || null,
      product_name: r.product_name || r.product_name,
      category: r.category || r.category,
      subcategory: r.subcategory || r.subcategory,
      total_units_sold: r.total_units_sold ?? r.units ?? 0,
      total_net_revenue: r.total_net_revenue ?? r.net_revenue ?? 0,
      total_gross_profit: r.total_gross_profit ?? r.gross_profit ?? 0,
    }));

    res.json({ success: true, count: products.length, products });
  } catch (err) {
    console.error("GET /api/products error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch products." });
  }
});

module.exports = router;
