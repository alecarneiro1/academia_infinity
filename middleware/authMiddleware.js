module.exports = function (req, res, next) {
  if (req.session?.adminAuth && req.session.adminAuthExpires > Date.now()) {
    return next();
  }
  return res.redirect("/admin/login");
};
