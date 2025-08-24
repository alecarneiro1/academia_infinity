require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static
app.use(express.static(path.join(__dirname, "..", "public"))); // ajuste se seu index.js estiver na raiz

// Rotas
const interactionsRoutes = require("./routes/interactionsRoutes");
app.use("/", interactionsRoutes);

app.get("/", (_, res) => res.redirect("/historico/554291562180-1,2,3")); // opcional

app.listen(PORT, () => {
  console.log(`🚀 Painel rodando na porta ${PORT}`);
});
