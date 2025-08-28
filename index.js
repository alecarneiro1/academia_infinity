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
// app.use(require("./routes/adminAuthRoutes"));       // login/logout
app.use(require("./routes/adminDashboardRoutes"));  // dashboard admin


// redirect raiz → login ou dashboard
app.get("/", (req, res) => {
  // Redirecione sempre para o dashboard, sem checar autenticação
  return res.redirect("/admin/dashboard");
});

// 404
app.use((req, res) => res.status(404).send("Rota não encontrada"));

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);