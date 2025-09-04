// middlewares/authMiddleware.js
module.exports = (req, res, next) => {
  if (process.env.AUTH_ACTIVATE === '2') return next(); // desativa autenticação
  if (req.session && req.session.user) return next();
  const to = encodeURIComponent(req.originalUrl || "/admin");
  return res.redirect(`/login?to=${to}`);
};
