require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static
app.use("/painel", express.static(__dirname + "/public"));

// (Opcional) parsers - não são obrigatórios na Opção A,
// mas não atrapalham e ajudam em outras rotas
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rotas existentes
const interactionsRoutes = require("./routes/interactionsRoutes");
app.use("/", interactionsRoutes);

// Novas rotas de matrícula (somente GETs; POST vai direto ao n8n)
const matriculasRoutes = require("./routes/matriculasRoutes");
const listamatriculasRoutes = require("./routes/listamatriculasRoutes"); // novo
app.use("/", matriculasRoutes);
app.use("/", listamatriculasRoutes); // novo

// Home (exemplo)
app.get("/", (_, res) => res.redirect("/historico/554291562180-1,2,3"));

app.listen(PORT, () => {
  console.log(`🚀 Painel rodando na porta ${PORT}`);
});
