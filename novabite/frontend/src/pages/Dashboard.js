import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";

const API = process.env.REACT_APP_API_URL || "";

function fmt(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

const ACCENT = "#00e5a0";
const ACCENT2 = "#0088fe";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#141920",
      border: "1px solid #242d3c",
      borderRadius: 8,
      padding: "10px 14px",
      fontFamily: "DM Mono, monospace",
      fontSize: 12,
    }}>
      <p style={{ color: "#8a95a8", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || ACCENT }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [catTrends, setCatTrends] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAllProducts, setShowAllProducts] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, t, ct, p] = await Promise.all([
          fetch(`${API}/api/summary`).then((r) => r.json()),
          fetch(`${API}/api/trends`).then((r) => r.json()),
          fetch(`${API}/api/trends?breakdown=category`).then((r) => r.json()),
          fetch(`${API}/api/products`).then((r) => r.json()),
        ]);
        if (!s.success) throw new Error("summary failed");
        setSummary(s.summary);
        setTrends(t.trends || []);

        // Pivot category trends: [{month, Snacks, Beverages, ...}]
        const pivot = {};
        for (const row of ct.trends || []) {
          if (!pivot[row.month]) pivot[row.month] = { month: row.month };
          pivot[row.month][row.category] = row.net_revenue;
        }
        setCatTrends(Object.values(pivot).sort((a, b) => a.month.localeCompare(b.month)));

  // store all products, let the UI decide how many to show
  setProducts(p.products || []);
      } catch (e) {
        setError("Could not connect to the API. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">Loading data…</div>
      </div>
      <div className="content">
        <div className="kpi-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="kpi-card">
              <div className="skeleton" style={{ width: "60%", marginBottom: 12 }} />
              <div className="skeleton" style={{ width: "80%", height: 32 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="content">
      <div className="error-pill">⚠ {error}</div>
    </div>
  );

  const categories = ["Snacks", "Beverages", "Personal Care", "Home Care"];
  const catColors = { "Snacks": "#00e5a0", "Beverages": "#0088fe", "Personal Care": "#ff6b6b", "Home Care": "#ffc658" };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Revenue Overview</div>
        <div className="page-subtitle">Jan 2024 – Dec 2025 · All regions & channels</div>
      </div>

      <div className="content">
        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Total Net Revenue</div>
            <div className="kpi-value accent">{fmt(summary?.total_net_revenue)}</div>
            <div className="kpi-sub">across all channels and regions</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Gross Profit Margin</div>
            <div className="kpi-value">{summary?.gross_profit_margin_pct?.toFixed(1)}%</div>
            <div className="kpi-sub">{fmt(summary?.total_gross_profit)} gross profit</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Top Region</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>{summary?.top_region ?? "—"}</div>
            <div className="kpi-sub">{fmt(summary?.top_region_revenue)} net revenue</div>
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="chart-panel">
          <div className="panel-header">
            <div className="panel-title">Monthly Net Revenue</div>
            <span className="badge">TREND</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trends} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACCENT} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#242d3c" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "#4a5568", fontFamily: "DM Mono", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                tick={{ fill: "#4a5568", fontFamily: "DM Mono", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="net_revenue"
                name="Net Revenue"
                stroke={ACCENT}
                strokeWidth={2}
                fill="url(#areaGrad)"
                dot={false}
                activeDot={{ r: 5, fill: ACCENT }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Revenue Chart */}
        <div className="chart-panel">
          <div className="panel-header">
            <div className="panel-title">Revenue by Category</div>
            <span className="badge">BREAKDOWN</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={catTrends} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#242d3c" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "#4a5568", fontFamily: "DM Mono", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                tick={{ fill: "#4a5568", fontFamily: "DM Mono", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontFamily: "DM Mono", fontSize: 11, color: "#8a95a8", paddingTop: 12 }}
              />
              {categories.map((cat) => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={catColors[cat]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Table */}
        <div className="products-panel">
          <div className="panel-header" style={{ padding: "16px 20px 0", display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="panel-title">Top Products</div>
              <span className="badge">BY NET REVENUE</span>
            </div>
            <div>
              <button
                onClick={() => setShowAllProducts((s) => !s)}
                style={{ background: 'transparent', border: '1px solid #2b3948', color: '#8a95a8', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
              >
                {showAllProducts ? 'Show top 10' : `Show all (${products.length || 0})`}
              </button>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Category</th>
                <th>Net Revenue</th>
                <th>Units Sold</th>
              </tr>
            </thead>
            <tbody>
              {(showAllProducts ? products : products.slice(0, 10)).map((p, i) => (
                <tr key={p.sku}>
                  <td className="mono">{String(i + 1).padStart(2, "0")}</td>
                  <td>{p.product_name}</td>
                  <td><span className="category-pill">{p.category}</span></td>
                  <td className="revenue">{fmt(p.total_net_revenue)}</td>
                  <td className="muted">{p.total_units_sold?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
