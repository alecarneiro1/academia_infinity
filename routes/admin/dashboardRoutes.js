// src/routes/admin/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/admin/dashboardController");

// Dashboard main view
router.get("/dashboard", dashboardController.getDashboard);

// API for chart data
router.get("/dashboard/messages-metrics", dashboardController.getMessagesMetrics);

module.exports = router;
