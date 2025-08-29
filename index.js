require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");

const app = express();

// Body parser deve vir ANTES das rotas!
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const dashboardRoutes = require('./routes/admin/dashboardRoutes');
app.use('/admin', dashboardRoutes);

const agenteRoutes = require('./routes/admin/agenteRoutes');
app.use('/admin', agenteRoutes);

const contactsRoutes = require('./routes/admin/contactsRoutes');
app.use('/admin', contactsRoutes);

const atendimentoRoutes = require('./routes/admin/atendimentoRoutes');
app.use('/admin/atendimentos', atendimentoRoutes);

// ──────────────────────────────────────────────────────────
// Básico do Express
// ──────────────────────────────────────────────────────────
app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.locals.basedir = app.get('views');

app.use(express.static(path.join(__dirname, "public")));

// 404
app.use((req, res) => res.status(404).send("Rota não encontrada"));

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);