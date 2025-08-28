// models/kpiDashboardModel.js
const pool = require("../config/db");

async function getDashboardKpis() {
  const result = await pool.query("SELECT * FROM v_kpidashboard;");
  return result.rows[0];
}

module.exports = { getDashboardKpis };
