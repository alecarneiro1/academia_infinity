// src/controllers/matriculasController.js
exports.form = (req, res) => {
  const webhookUrl = process.env.N8N_WEBHOOK_MATRICULAS;
  if (!webhookUrl) console.warn("⚠️ N8N_WEBHOOK_MATRICULAS não definido no .env");
  res.render("matriculasView", { webhookUrl });
};

exports.sucesso = (req, res) => {
  res.render("matriculaSucesso");
};
