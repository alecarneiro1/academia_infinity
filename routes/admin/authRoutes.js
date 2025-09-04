// routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const csrf = require("csurf");
const { Op } = require("sequelize");
const User = require('../../models/usersModel'); // ajuste o caminho se diferente

const router = express.Router();

// Limite de tentativas de login (básico)
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// CSRF
const csrfProtection = csrf();

// GET /login
router.get("/login", csrfProtection, (req, res) => {
  const to = req.query.to || "/admin";
  res.render("admin/loginView", { csrfToken: req.csrfToken(), to, error: null });
});

// POST /login
router.post("/login", loginLimiter, csrfProtection, async (req, res) => {
  try {
    const { email, senha, to } = req.body;
    if (!email || !senha) {
      return res.status(400).render("admin/loginView", { csrfToken: req.csrfToken(), to: to || "/admin", error: "Preencha email e senha." });
    }

    const user = await User.findOne({
      where: { email: { [Op.eq]: String(email).trim().toLowerCase() } },
    });
    if (!user) {
      return res.status(401).render("admin/loginView", { csrfToken: req.csrfToken(), to: to || "/admin", error: "Credenciais inválidas." });
    }

    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok) {
      return res.status(401).render("admin/loginView", { csrfToken: req.csrfToken(), to: to || "/admin", error: "Credenciais inválidas." });
    }

    // Autenticado
    req.session.user = { id: user.id, email: user.email };
    // renova expiração toda visita útil (opcional)
    req.session.touch?.();

    return res.redirect(to || "/admin");
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).render("admin/loginView", { csrfToken: req.csrfToken(), to: "/admin", error: "Erro no servidor. Tente novamente." });
  }
});

// POST /logout
router.post("/logout", csrfProtection, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie(process.env.COOKIE_NAME || "sid");
    res.redirect("/login");
  });
});

module.exports = router;
