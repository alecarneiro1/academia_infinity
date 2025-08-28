require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");

const app = express();
const dashboardRoutes = require('./routes/admin/dashboardRoutes');

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
app.use('/admin', dashboardRoutes);


// 404
app.use((req, res) => res.status(404).send("Rota não encontrada"));

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);