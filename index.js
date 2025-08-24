// index.js
require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Rotas
const interactionsRoutes = require("./routes/interactionsRoutes");
app.use("/", interactionsRoutes);

// Rota raiz só pra teste
app.get("/", (req, res) => {
  res.send("✅ API do painel rodando!");
});

// Sobe o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
