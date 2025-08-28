const router = require("express").Router();
const dashboardController = require("../controllers/admin/dashboardController");

router.get("/admin/dashboard", dashboardController.index);

module.exports = router;
