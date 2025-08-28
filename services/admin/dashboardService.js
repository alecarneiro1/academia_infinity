// src/services/dashboardService.js
const { getDailyMessageCounts } = require("../models/metricsModel");

async function buildDailyMessagesSeries(ndays = 10) {
  const rows = await getDailyMessageCounts(ndays);
  const labels = rows.map(r =>
    new Date(r.dia).toLocaleDateString("pt-BR", { day: "2-digit" })
  );
  const series = rows.map(r => Number(r.total));
  return { labels, series, ndays };
}

module.exports = { buildDailyMessagesSeries };
