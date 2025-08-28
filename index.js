require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");

const app = express();

// ──────────────────────────────────────────────────────────
// Básico do Express
// ──────────────────────────────────────────────────────────
app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.locals.basedir = app.get('views');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ──────────────────────────────────────────────────────────
// Sessão (usa MemoryStore por simplicidade; troque por Redis em prod)
// ──────────────────────────────────────────────────────────
const TWO_WEEKS = 1000 * 60 * 60 * 24 * 14;
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: TWO_WEEKS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// ──────────────────────────────────────────────────────────
// Locals para injeção de CSS/JS por página + título
// (assim você não precisa passar sempre; o que a rota enviar sobrescreve)
// ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.title = "Painel";
  res.locals.styles = [];   // ex.: ["/css/admin/dashboard.css"]
  res.locals.scripts = [];  // ex.: ["/js/admin/dashboard.js"]
  next();
});

// ──────────────────────────────────────────────────────────
// Rotas
// ──────────────────────────────────────────────────────────
app.use(require("./routes/adminAuthRoutes"));       // login/logout
app.use(require("./routes/adminDashboardRoutes"));  // dashboard admin


// redirect raiz → login ou dashboard
app.get("/", (req, res) => {
  if (req.session?.adminAuth && req.session.adminAuthExpires > Date.now()) {
    return res.redirect("/admin/dashboard");
  }
  return res.redirect("/admin/login");
});

// 404
app.use((req, res) => res.status(404).send("Rota não encontrada"));

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
