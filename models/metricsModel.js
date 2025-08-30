// src/models/metricsModel.js
const sequelize = require("../config/db");

/**
 * Hoje (distribuição 3h em 3h) — 8 pontos
 * Retorna: [{ label: '00–02', total }, ... , { '21–23', total }]
 * Observação: assume chatlogs.time como TIMESTAMP LOCAL (sem TZ) já em horário SP.
 */
async function getTodayMessageCounts3h() {
  const sql = `
    WITH tz AS (
      SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date AS d
    ),
    slots AS (
      -- série de timestamps: 00:00, 03:00, ..., 21:00
      SELECT gs AS bucket_start
      FROM generate_series(
             (SELECT d FROM tz)::timestamp,
             (SELECT d FROM tz)::timestamp + interval '21 hours',
             interval '3 hours'
           ) AS gs
    ),
    msgs AS (
      SELECT time AS ltime
      FROM chatlogs
      WHERE time::date = (SELECT d FROM tz)
    )
    SELECT
      to_char(s.bucket_start, 'HH24') || '–' ||
      to_char(s.bucket_start + interval '2 hours', 'HH24') AS label,
      COUNT(m.*) AS total
    FROM slots s
    LEFT JOIN msgs m
      ON m.ltime >= s.bucket_start
     AND m.ltime <  s.bucket_start + interval '3 hours'
    GROUP BY s.bucket_start
    ORDER BY s.bucket_start;
  `;
  const [rows] = await sequelize.query(sql);
  return rows;
}

/**
 * Semana (últimos 7 dias) — 7 pontos (um por dia)
 * Retorna: [{ dia, label: 'DD/MM', total }, ...]
 */
async function getLast7DaysMessageCounts() {
  const sql = `
    WITH b AS (
      SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date AS end_d
    ),
    days AS (
      SELECT generate_series((SELECT end_d FROM b) - 6,
                             (SELECT end_d FROM b),
                             interval '1 day')::date AS dia
    ),
    agg AS (
      SELECT time::date AS dia, COUNT(*) AS total
      FROM chatlogs
      WHERE time::date >= (SELECT end_d FROM b) - 6
      GROUP BY 1
    )
    SELECT d.dia,
           to_char(d.dia, 'DD/MM') AS label,
           COALESCE(a.total, 0)     AS total
    FROM days d
    LEFT JOIN agg a USING (dia)
    ORDER BY d.dia;
  `;
  const [rows] = await sequelize.query(sql);
  return rows;
}

/**
 * Mês (últimos 30 dias) — 10 bins (3 dias por bin)
 * Retorna: [{ label: 'DD–DD', total }, ...] (10 pontos)
 */
async function getLast30DaysMessageCounts10bins() {
  const sql = `
    WITH b AS (
      SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date AS end_d,
             ((now() AT TIME ZONE 'America/Sao_Paulo')::date - 29) AS start_d
    ),
    days AS (
      SELECT generate_series((SELECT start_d FROM b),
                             (SELECT end_d   FROM b),
                             interval '1 day')::date AS dia
    ),
    agg AS (
      SELECT time::date AS dia, COUNT(*) AS total
      FROM chatlogs
      WHERE time::date BETWEEN (SELECT start_d FROM b) AND (SELECT end_d FROM b)
      GROUP BY 1
    ),
    filled AS (
      SELECT d.dia, COALESCE(a.total,0) AS total
      FROM days d
      LEFT JOIN agg a USING (dia)
    ),
    bins AS (
      SELECT ((dia - (SELECT start_d FROM b)) / 3)::int AS bin_idx,
             MIN(dia) AS start_d, MAX(dia) AS end_d,
             SUM(total) AS total
      FROM filled
      GROUP BY 1
      ORDER BY 1
    )
    SELECT to_char(start_d, 'DD') || '–' || to_char(end_d, 'DD') AS label,
           total
    FROM bins
    ORDER BY bin_idx;
  `;
  const [rows] = await sequelize.query(sql);
  return rows;
}

/**
 * Ano (últimos 12 meses) — 12 pontos (um por mês)
 * Retorna: [{ label: 'MM/YYYY', total }, ...]
 */
async function getLast12MonthsMessageCounts() {
  const sql = `
    WITH b AS (
      SELECT date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') AS month_curr
    ),
    months AS (
      SELECT generate_series((SELECT month_curr FROM b) - interval '11 months',
                             (SELECT month_curr FROM b),
                             interval '1 month') AS m_start
    ),
    agg AS (
      SELECT date_trunc('month', time) AS m_start,
             COUNT(*) AS total
      FROM chatlogs
      WHERE time >= (SELECT month_curr - interval '11 months' FROM b)
        AND time <  (SELECT month_curr + interval '1 month'   FROM b)
      GROUP BY 1
    )
    SELECT to_char(m.m_start, 'MM/YYYY') AS label,
           COALESCE(a.total, 0)          AS total
    FROM months m
    LEFT JOIN agg a USING (m_start)
    ORDER BY m.m_start;
  `;
  const [rows] = await sequelize.query(sql);
  return rows;
}

module.exports = {
  getTodayMessageCounts3h,
  getLast7DaysMessageCounts,
  getLast30DaysMessageCounts10bins,
  getLast12MonthsMessageCounts,
};
