const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/admin/dashboardController');

router.get('/dashboard', dashboardController.getDashboard);

module.exports = router;
