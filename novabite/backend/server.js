// server.js — NovaBite API server
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Guard: DB presence is optional — we have a JS fallback if SQLite isn't
// available. Warn if the SQLite file is missing but continue startup so the
// server can run with the in-memory CSV fallback.
const DB_PATH = path.join(__dirname, "novabite.db");
if (!fs.existsSync(DB_PATH)) {
  console.warn("⚠️  novabite.db not found. Using CSV in-memory fallback instead.");
}

// ── Routes ──────────────────────────────────────────────────
app.use("/api/products", require("./routes/products"));
app.use("/api/summary", require("./routes/summary"));
app.use("/api/trends", require("./routes/trends"));
app.use("/api/chat", require("./routes/chat"));

// ── Health check ────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── 404 catch-all ───────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: "Route not found." }));

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  NovaBite API running on http://localhost:${PORT}`);
});
