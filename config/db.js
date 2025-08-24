// src/config/db.js
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    dialect: "postgres",
    logging: false, // coloca true se quiser ver os SQLs no console
  }
);

// Teste de conexão
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado ao PostgreSQL com Sequelize");
  } catch (err) {
    console.error("❌ Erro ao conectar ao PostgreSQL:", err.message);
  }
})();

module.exports = sequelize;
