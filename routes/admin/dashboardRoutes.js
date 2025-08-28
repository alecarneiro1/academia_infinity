// src/routes/admin/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/admin/dashboardController");

// GET /admin/api/messages/daily?days=30
router.get("/api/messages/daily", ctrl.getDailyMessages);

// ...outras rotas, como dashboard...
router.get("/dashboard", ctrl.getDashboard);

module.exports = router;
