const router = require("express").Router();
const auth = require("../controllers/admin/authController");

router.get("/admin/login", auth.showLogin);
router.post("/admin/login", auth.login);
router.get("/admin/logout", auth.logout);

module.exports = router;
