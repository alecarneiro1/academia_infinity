const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/admin/dashboard", authMiddleware, (req, res) => {
  const metrics = {
    totalChats: 1234,
    totalContacts: 567,
    totalMatriculas: 89,
    totalResumos: 432
  };

  res.render("admin/dashboard", {
    title: "Dashboard - Admin",
    styles: ["/css/admin/dashboard.css"],
    metrics
  });
});

module.exports = router;
