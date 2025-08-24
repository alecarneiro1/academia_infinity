// src/controllers/interactionsController.js
const { Op } = require("sequelize");
const Interaction = require("../models/interactionsModel");

// helper: "554291562180-1,2,3" -> { phone, ids[] }
function parsePhoneAndIds(raw) {
  if (!raw || !raw.includes("-")) {
    const e = new Error("Parâmetro inválido. Use telefone-ids (ex.: 554291562180-1,2,3)");
    e.status = 400;
    throw e;
  }
  const [phone, idsStr] = raw.split("-");
  const phoneClean = String(phone || "").replace(/\s+/g, "");
  if (!phoneClean) {
    const e = new Error("Telefone ausente.");
    e.status = 400;
    throw e;
  }
  const ids = String(idsStr || "")
    .split(",")
    .map((s) => Number(String(s).trim()))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (!ids.length) {
    const e = new Error("Nenhum ID válido informado.");
    e.status = 400;
    throw e;
  }

  return { phone: phoneClean, ids };
}

async function getHistorico(req, res) {
  try {
    const { phone, ids } = parsePhoneAndIds(req.params.phoneAndIds);

    const rows = await Interaction.findAll({
      where: { contactNumber: phone, id: { [Op.in]: ids } },
      order: [["time", "ASC"]],
    });

    if (!rows.length) {
      return res.status(404).json({ error: "Nenhuma interação encontrada para os critérios informados." });
    }

    res.set("Cache-Control", "no-store");
    return res.json({ contactNumber: phone, count: rows.length, rows });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: status === 500 ? "Erro ao buscar histórico" : err.message,
      detail: status === 500 ? err.message : undefined,
    });
  }
}

module.exports = { getHistorico };
