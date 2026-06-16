// routes/chat.js
const express = require("express");
const fetch = require("node-fetch");
const { getDb } = require("../db");

const router = express.Router();

// Build a rich data context snapshot for the LLM prompt
function buildDataContext(db) {
  const totalKpis = db
    .prepare(
      `
    SELECT
      ROUND(SUM(net_revenue_usd), 2) AS total_net_revenue,
      ROUND(SUM(units_sold), 0) AS total_units,
      ROUND(SUM(gross_profit_usd) / NULLIF(SUM(net_revenue_usd), 0) * 100, 2) AS gp_margin_pct
    FROM sales
  `
    )
    .get();

  const byRegion = db
    .prepare(
      `
    SELECT region,
      ROUND(SUM(net_revenue_usd), 2) AS net_revenue,
      ROUND(SUM(units_sold), 0) AS units
    FROM sales GROUP BY region ORDER BY net_revenue DESC
  `
    )
    .all();

  const byChannel = db
    .prepare(
      `
    SELECT channel,
      ROUND(SUM(net_revenue_usd), 2) AS net_revenue,
      ROUND(SUM(units_sold), 0) AS units
    FROM sales GROUP BY channel ORDER BY net_revenue DESC
  `
    )
    .all();

  const byCategory = db
    .prepare(
      `
    SELECT category,
      ROUND(SUM(net_revenue_usd), 2) AS net_revenue,
      ROUND(SUM(gross_profit_usd) / NULLIF(SUM(net_revenue_usd), 0) * 100, 2) AS gp_margin_pct,
      ROUND(SUM(units_sold), 0) AS units
    FROM sales GROUP BY category ORDER BY net_revenue DESC
  `
    )
    .all();

  const byProduct = db
    .prepare(
      `
    SELECT product_name, category,
      ROUND(SUM(net_revenue_usd), 2) AS net_revenue,
      ROUND(SUM(units_sold), 0) AS units
    FROM sales GROUP BY product_name, category ORDER BY net_revenue DESC LIMIT 20
  `
    )
    .all();

  const bySalesRep = db
    .prepare(
      `
    SELECT sales_rep,
      ROUND(SUM(net_revenue_usd), 2) AS net_revenue,
      ROUND(SUM(units_sold), 0) AS units
    FROM sales GROUP BY sales_rep ORDER BY units DESC LIMIT 15
  `
    )
    .all();

  const byQuarter = db
    .prepare(
      `
    SELECT quarter,
      ROUND(SUM(net_revenue_usd), 2) AS net_revenue,
      ROUND(SUM(units_sold), 0) AS units
    FROM sales GROUP BY quarter ORDER BY quarter ASC
  `
    )
    .all();

  const byRegionQuarter = db
    .prepare(
      `
    SELECT quarter, region,
      ROUND(SUM(net_revenue_usd), 2) AS net_revenue
    FROM sales GROUP BY quarter, region ORDER BY quarter ASC, net_revenue DESC
  `
    )
    .all();

  const byChannelCategory = db
    .prepare(
      `
    SELECT channel, category,
      ROUND(SUM(net_revenue_usd), 2) AS net_revenue
    FROM sales GROUP BY channel, category ORDER BY channel ASC, net_revenue DESC
  `
    )
    .all();

  const byProductRegion = db
    .prepare(
      `
    SELECT region, product_name,
      ROUND(SUM(net_revenue_usd), 2) AS net_revenue
    FROM sales GROUP BY region, product_name ORDER BY region ASC, net_revenue DESC
  `
    )
    .all();

  return `
=== NOVABITE SALES DATA CONTEXT ===
Data covers Jan 2024 – Dec 2025, 1000 transactions.

--- OVERALL KPIs ---
${JSON.stringify(totalKpis, null, 2)}

--- NET REVENUE BY REGION ---
${JSON.stringify(byRegion, null, 2)}

--- NET REVENUE BY CHANNEL ---
${JSON.stringify(byChannel, null, 2)}

--- NET REVENUE BY CATEGORY (with GP Margin %) ---
${JSON.stringify(byCategory, null, 2)}

--- TOP 20 PRODUCTS BY NET REVENUE ---
${JSON.stringify(byProduct, null, 2)}

--- SALES REPS BY UNITS SOLD (Top 15) ---
${JSON.stringify(bySalesRep, null, 2)}

--- QUARTERLY PERFORMANCE ---
${JSON.stringify(byQuarter, null, 2)}

--- NET REVENUE BY QUARTER × REGION ---
${JSON.stringify(byRegionQuarter, null, 2)}

--- NET REVENUE BY CHANNEL × CATEGORY ---
${JSON.stringify(byChannelCategory, null, 2)}

--- TOP PRODUCT PER REGION ---
${JSON.stringify(byProductRegion, null, 2)}
`;
}

// POST /api/chat
// Body: { "question": "..." }
// Returns: { "answer": "..." }
router.post("/", async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== "string" || question.trim() === "") {
    return res.status(400).json({ success: false, error: "question field is required." });
  }

  try {
    const db = getDb();
    const dataContext = buildDataContext(db);

    const systemPrompt = `You are an expert sales analyst AI for NovaBite Consumer Goods.
You have access to aggregated sales data below. Use it to answer the user's question accurately.
Be concise, direct, and specific — cite exact numbers when possible.
Do not make up data not present in the context. If unsure, say so.

${dataContext}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: question.trim() }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic API error:", response.status, errBody);

      // Build a local fallback answer from the DB so the chat still returns
      // useful information even when the LLM provider fails (e.g. auth error).
      try {
        // Small summary using same aggregates as /api/summary
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

        const localAnswer = `LLM provider error (status ${response.status}). Local data summary: Total net revenue $${kpis.total_net_revenue || 0}, total units ${kpis.total_units_sold || 0}, gross profit margin ${kpis.gross_profit_margin_pct || 0}%. Top region: ${topRegion?.region || 'N/A'} ($${topRegion?.revenue || 0}). Top product: ${topProduct?.product_name || 'N/A'} ($${topProduct?.revenue || 0}).`;

        return res.status(200).json({ success: true, question: question.trim(), answer: localAnswer, fallback: true, provider_status: response.status, provider_body: errBody });
      } catch (localErr) {
        console.error('Local fallback failed:', localErr?.message || localErr);
        return res.status(502).json({ success: false, error: 'LLM API request failed and local fallback failed.' , provider_status: response.status, provider_body: errBody });
      }
    }

    const data = await response.json();
    const answer = data.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    res.json({ success: true, question: question.trim(), answer });
  } catch (err) {
    console.error("POST /api/chat error:", err.message);
    res.status(500).json({ success: false, error: "Internal server error." });
  }
});

module.exports = router;
