const SESSION_DURATION = 1000 * 60 * 60 * 24 * 14; // 2 semanas
const MAX_ATTEMPTS = 3;

exports.showLogin = (req, res) => {
  res.render("admin/login", {
    error: req.session.adminAuthError,
    blocked: req.session.adminBlocked,
    styles: ["/css/admin/main-adminStyle.css"],
  });
};

exports.login = (req, res) => {
  const { login, senha } = req.body;
  const ADMINLOGIN = process.env.ADMINLOGIN?.replace(/"/g, "");
  const ADMINPASS = process.env.ADMINPASS?.replace(/"/g, "");

  if (!req.session.adminAttempts) req.session.adminAttempts = 0;

  if (req.session.adminBlocked) {
    req.session.adminAuthError = "Acesso bloqueado por excesso de tentativas.";
    return res.redirect("/admin/login");
  }

  if (login === ADMINLOGIN && senha === ADMINPASS) {
    req.session.adminAuth = true;
    req.session.adminAuthExpires = Date.now() + SESSION_DURATION;
    req.session.adminAttempts = 0;
    req.session.adminBlocked = false;
    req.session.adminAuthError = null;
    return res.redirect("/admin/dashboard");
  } else {
    req.session.adminAttempts += 1;
    req.session.adminAuthError = "Login ou senha inválidos.";
    if (req.session.adminAttempts >= MAX_ATTEMPTS) {
      req.session.adminBlocked = true;
      req.session.adminAuthError = "Acesso bloqueado por excesso de tentativas.";
    }
    return res.redirect("/admin/login");
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
};
