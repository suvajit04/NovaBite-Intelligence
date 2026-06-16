const path = require('path');
const dbModule = require(path.join(process.cwd(), 'backend', 'db.js'));
const { getDb } = dbModule;
const db = getDb();
const sql = `SELECT sku, product_name, category, subcategory, SUM(units_sold) AS total_units_sold, SUM(net_revenue_usd) AS total_net_revenue FROM sales GROUP BY sku, product_name, category, subcategory ORDER BY total_net_revenue DESC`;
try {
  const rows = db.prepare(sql).all();
  console.log('ROWS_LEN', rows.length);
  console.log(rows.slice(0, 8));
} catch (e) {
  console.error('ERR', e.message);
}
