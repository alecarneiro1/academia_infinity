// src/models/metricsModel.js
const sequelize = require("../config/db");

/**
 * Retorna [{ dia: '2025-08-01', total: 120 }, ...] dos últimos N dias,
 * já considerando America/Sao_Paulo e preenchendo dias sem dados com 0.
 */
async function getDailyMessageCounts(ndays = 10) {
  const sql = `
    WITH params AS ( SELECT ($1::int) AS ndays ),
    days AS (
      SELECT generate_series(
        ( (now() AT TIME ZONE 'America/Sao_Paulo')::date - (SELECT ndays FROM params) + 1 ),
        (now() AT TIME ZONE 'America/Sao_Paulo')::date,
        interval '1 day'
      )::date AS dia
    ),
    agg AS (
      SELECT
        (time AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
        COUNT(*) AS total
      FROM chatlogs
      WHERE (time AT TIME ZONE 'America/Sao_Paulo')::date >=
            ( (now() AT TIME ZONE 'America/Sao_Paulo')::date - (SELECT ndays FROM params) + 1 )
      GROUP BY 1
    )
    SELECT d.dia, COALESCE(a.total, 0) AS total
    FROM days d
    LEFT JOIN agg a USING (dia)
    ORDER BY d.dia;
  `;
  const [rows] = await sequelize.query(sql, { bind: [ndays] });
  return rows;
}

module.exports = { getDailyMessageCounts };
