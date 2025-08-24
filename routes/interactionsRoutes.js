// src/routes/interactionsRoutes.js
const express = require("express");
const { getHistorico, renderHistoricoView } = require("../controllers/interactionsController");

const router = express.Router();

router.get("/api/historico/:phoneAndIds", getHistorico);     // JSON
router.get("/historico/:phoneAndIds", renderHistoricoView);  // View

module.exports = router;
