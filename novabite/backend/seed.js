// seed.js — no-op when running with JS fallback DB
// The repository includes `data/novabite_sales_data.csv`. When better-sqlite3
// is available the original seed will create a novabite.db. When it's not
// available we rely on the in-memory CSV loader implemented in `db.js`.

console.log("ℹ️  seed.js: no-op (using CSV in-memory fallback). If you need a real SQLite DB, install better-sqlite3 or run the original seed with a compatible Node toolchain.");

