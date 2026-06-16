// db.js — Singleton SQLite connection with a safe JS fallback
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "novabite.db");
let _db = null;

function createFallback() {
  console.warn("⚠️  better-sqlite3 not available — using CSV-backed JS fallback DB.");

  const csvPath = path.join(__dirname, "..", "data", "novabite_sales_data.csv");
  if (!fs.existsSync(csvPath)) {
    console.warn("⚠️  CSV data file not found at", csvPath);
  }

  // Lazy-load parser to avoid top-level dependency errors
  const { parse } = require("csv-parse/sync");

  const raw = fs.existsSync(csvPath) ? fs.readFileSync(csvPath, "utf8") : "";
  const rows = raw ? parse(raw, { columns: true, skip_empty_lines: true }) : [];

  // normalize types
  const data = rows.map((r) => ({
    transaction_id: r.transaction_id,
    date: r.date,
    month: r.month,
    quarter: r.quarter,
    sku: r.sku,
    product_name: r.product_name,
    category: r.category,
    subcategory: r.subcategory,
    region: r.region,
    channel: r.channel,
    sales_rep: r.sales_rep,
    units_sold: parseFloat(r.units_sold) || 0,
    unit_price_usd: parseFloat(r.unit_price_usd) || 0,
    gross_revenue_usd: parseFloat(r.gross_revenue_usd) || 0,
    discount_pct: parseFloat(r.discount_pct) || 0,
    net_revenue_usd: parseFloat(r.net_revenue_usd) || 0,
    cogs_usd: parseFloat(r.cogs_usd) || 0,
    gross_profit_usd: parseFloat(r.gross_profit_usd) || 0,
  }));

  function round(n, digits = 2) {
    return Math.round((n + Number.EPSILON) * Math.pow(10, digits)) / Math.pow(10, digits);
  }

  function groupBy(keys, aggFields = []) {
    const map = new Map();
    for (const row of data) {
      const key = keys.map((k) => row[k]).join("|~|");
      if (!map.has(key)) map.set(key, { __key: key, __vals: [] });
      map.get(key).__vals.push(row);
    }
    const out = [];
    for (const entry of map.values()) {
      const vals = entry.__vals;
      const obj = {};
      for (const k of keys) obj[k] = vals[0][k];
      // aggregates
      const net = vals.reduce((s, r) => s + (r.net_revenue_usd || 0), 0);
      const units = vals.reduce((s, r) => s + (r.units_sold || 0), 0);
      const gp = vals.reduce((s, r) => s + (r.gross_profit_usd || 0), 0);
      obj.net_revenue = round(net, 2);
      obj.units = Math.round(units);
      if (aggFields.includes("gp_margin_pct")) obj.gp_margin_pct = net ? round((gp / net) * 100, 2) : 0;
      out.push(obj);
    }
    return out;
  }

  return {
    prepare(sql) {
      const normalized = (sql || "").toLowerCase();

      return {
        get() {
          // overall KPIs
          if (normalized.includes("count(" ) || normalized.includes("round(sum(net_revenue_usd)" ) || normalized.includes("total_net_revenue") || normalized.includes("total_gross_profit")) {
            const total_net_revenue = data.reduce((s, r) => s + (r.net_revenue_usd || 0), 0);
            const total_units = Math.round(data.reduce((s, r) => s + (r.units_sold || 0), 0));
            const total_gross_profit = data.reduce((s, r) => s + (r.gross_profit_usd || 0), 0);
            const gp_margin_pct = total_net_revenue ? round((total_gross_profit / total_net_revenue) * 100, 2) : 0;
            return {
              total_net_revenue: round(total_net_revenue, 2),
              total_units: total_units,
              gp_margin_pct: gp_margin_pct,
              total_units_sold: total_units,
              gross_profit_margin_pct: gp_margin_pct,
              total_gross_profit: round(total_gross_profit, 2),
            };
          }

          // top single-row queries (e.g., top region/channel/product)
          if (normalized.includes("group by region") && normalized.includes("limit 1")) {
            const groups = groupBy(["region"]);
            groups.sort((a,b) => b.net_revenue - a.net_revenue);
            return { region: groups[0]?.region ?? null, revenue: groups[0]?.net_revenue ?? 0 };
          }
          if (normalized.includes("group by channel") && normalized.includes("limit 1")) {
            const groups = groupBy(["channel"]);
            groups.sort((a,b) => b.net_revenue - a.net_revenue);
            return { channel: groups[0]?.channel ?? null, revenue: groups[0]?.net_revenue ?? 0 };
          }
          if (normalized.includes("group by product_name") && normalized.includes("limit 1")) {
            const groups = groupBy(["product_name"]);
            groups.sort((a,b) => b.net_revenue - a.net_revenue);
            return { product_name: groups[0]?.product_name ?? null, revenue: groups[0]?.net_revenue ?? 0 };
          }

          return {};
        },
        all() {
          // by region
          if (normalized.includes("group by region") && normalized.includes("order by net_revenue")) {
            const groups = groupBy(["region"]);
            groups.sort((a,b) => b.net_revenue - a.net_revenue);
            return groups.map(g => ({ region: g.region, net_revenue: g.net_revenue, units: g.units }));
          }

          // by channel
          if (normalized.includes("group by channel") && normalized.includes("order by net_revenue")) {
            const groups = groupBy(["channel"]);
            groups.sort((a,b) => b.net_revenue - a.net_revenue);
            return groups.map(g => ({ channel: g.channel, net_revenue: g.net_revenue, units: g.units }));
          }

          // by category
          if (normalized.includes("group by category")) {
            const groups = groupBy(["category"], ["gp_margin_pct"]);
            groups.sort((a,b) => b.net_revenue - a.net_revenue);
            return groups.map(g => ({ category: g.category, net_revenue: g.net_revenue, gp_margin_pct: g.gp_margin_pct, units: g.units }));
          }

          // top products
          if (normalized.includes("group by product_name")) {
            const groups = groupBy(["product_name", "category"]);
            groups.sort((a,b) => b.net_revenue - a.net_revenue);
            return groups.slice(0,20).map(g => ({ product_name: g.product_name, category: g.category, net_revenue: g.net_revenue, units: g.units }));
          }

          // sales reps
          if (normalized.includes("group by sales_rep")) {
            const groups = groupBy(["sales_rep"]);
            groups.sort((a,b) => b.units - a.units);
            return groups.slice(0,15).map(g => ({ sales_rep: g.sales_rep, net_revenue: g.net_revenue, units: g.units }));
          }

          // quarter
          if (normalized.includes("group by quarter") && normalized.includes("order by quarter")) {
            const groups = groupBy(["quarter"]);
            groups.sort((a,b) => (a.quarter > b.quarter ? 1 : -1));
            return groups.map(g => ({ quarter: g.quarter, net_revenue: g.net_revenue, units: g.units }));
          }

          // quarter x region
          if (normalized.includes("group by quarter, region") || normalized.includes("group by quarter, region")) {
            const out = [];
            // group by quarter then by region
            const quarters = groupBy(["quarter"]).map(q => q.quarter);
            for (const q of quarters) {
              const subset = data.filter(r => r.quarter === q);
              const map = new Map();
              for (const r of subset) {
                const key = r.region;
                if (!map.has(key)) map.set(key, 0);
                map.set(key, map.get(key) + (r.net_revenue_usd || 0));
              }
              for (const [region, net] of map.entries()) {
                out.push({ quarter: q, region, net_revenue: round(net,2) });
              }
            }
            return out;
          }

          // channel x category
          if (normalized.includes("group by channel, category")) {
            const groups = groupBy(["channel","category"]);
            groups.sort((a,b) => (a.channel === b.channel ? b.net_revenue - a.net_revenue : a.channel.localeCompare(b.channel)));
            return groups.map(g => ({ channel: g.channel, category: g.category, net_revenue: g.net_revenue }));
          }

          // product per region
          if (normalized.includes("group by region, product_name")) {
            const groups = groupBy(["region","product_name"]);
            groups.sort((a,b) => (a.region === b.region ? b.net_revenue - a.net_revenue : a.region.localeCompare(b.region)));
            return groups.map(g => ({ region: g.region, product_name: g.product_name, net_revenue: g.net_revenue }));
          }

          return [];
        },
      };
    },
  };
}

function getDb() {
  if (_db) return _db;

  try {
    // Try to use better-sqlite3 if available
    // eslint-disable-next-line global-require
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH, { readonly: false });
    db.pragma("journal_mode = WAL");
    _db = db;
    return _db;
  } catch (err) {
    // Fall back to JS adapter so the server can start even if native modules
    // couldn't be built (node-gyp issues on Windows, missing VC++ toolchain, etc.)
    _db = createFallback();
    return _db;
  }
}

module.exports = { getDb };
