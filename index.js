require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");

const app = express();

// ── Body parsers (sempre antes das rotas)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const sessionMiddleware = require("./middlewares/sessionMiddleware");
app.use(sessionMiddleware);


// ── View engine / estáticos
app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.locals.basedir = app.get("views");
app.use(express.static(path.join(__dirname, "public")));

// ── Middleware de títulos (se usa req.session, deixe após sessão)
const pageTitlesMiddleware = require("./middlewares/pageTitlesMiddleware");
app.use(pageTitlesMiddleware);

// ── Auth
const ensureAuth = require("./middlewares/authMiddleware"); // você criou este arquivo
const authRoutes = require("./routes/admin/authRoutes");    // seu caminho informado

// Monte as rotas de login/logout na raiz → /login e /logout
app.use(authRoutes);

// ── Protege tudo que começa com /admin
app.use("/admin", ensureAuth);

// ── Suas rotas /admin (agora todas já protegidas pelo guarda-chuva)
const dashboardRoutes = require("./routes/admin/dashboardRoutes");
app.use("/admin", dashboardRoutes);

const agenteRoutes = require("./routes/admin/agenteRoutes");
app.use("/admin", agenteRoutes);

const contactsRoutes = require("./routes/admin/contactsRoutes");
app.use("/admin", contactsRoutes);

const atendimentoRoutes = require("./routes/admin/atendimentoRoutes");
app.use("/admin/atendimentos", atendimentoRoutes);

const matriculasRoutes = require("./routes/admin/matriculasRoutes");
app.use("/admin/matriculas", matriculasRoutes);

const chatlogRoutes = require("./routes/admin/chatlogRoutes");
app.use("/admin/chatlogs", chatlogRoutes);

// ── 404
app.use((req, res) => res.status(404).send("Rota não encontrada"));

// ── Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
