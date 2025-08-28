// controllers/admin/dashboardController.js
exports.index = async (req, res) => {
  // ...
  res.render("admin/dashboard", {
    title: "Dashboard",
    styles: ["/css/admin/dashboardStyle.css"],
    scripts: ["/js/admin/dashboardScripts.js", "https://cdn.jsdelivr.net/npm/chart.js"],
    metrics, recent
  });
};
