// controllers/admin/dashboardController.js
exports.index = async (req, res) => {
  const metrics = {
    totalChats: 1234,
    totalContacts: 567,
    totalMatriculas: 89,
    totalResumos: 432
  };

  res.render("admin/dashboard", {
    title: "Dashboard",
    styles: [
      "/css/admin/main-adminStyle.css", // Adicione este
      "/css/admin/dashboardStyle.css"   // E outros que desejar
    ],
    scripts: ["/js/admin/dashboardScripts.js", "https://cdn.jsdelivr.net/npm/chart.js"],
    metrics // removi "recent" pois não está sendo usado
  });
};
