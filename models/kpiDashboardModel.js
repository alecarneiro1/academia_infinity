// models/kpiDashboardModel.js
const pool = require("../config/db");

async function getDashboardKpis() {
  try {
    const result = await pool.query("SELECT * FROM v_kpidashboard LIMIT 1;");

    // Caso Sequelize ou pool retornem array de arrays
    if (Array.isArray(result) && Array.isArray(result[0]) && result[0][0]) {
      return result[0][0];
    }
    // Caso pg (node-postgres)
    if (result && result.rows && result.rows[0]) {
      return result.rows[0];
    }
    // fallback: retorna zeros
    return {
      total_mensages: 0,
      total_contacts: 0,
      total_summaries: 0,
      total_matriculas: 0
    };
  } catch (err) {
    console.error('Erro no getDashboardKpis:', err);
    throw err;
  }
}

module.exports = { getDashboardKpis };

