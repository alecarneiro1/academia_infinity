// src/models/matriculaModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Matricula = sequelize.define("Matricula", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  nome_completo: { type: DataTypes.STRING(150), allowNull: false },
  endereco: { type: DataTypes.TEXT, allowNull: false },
  cep: { type: DataTypes.STRING(20), allowNull: false },
  cpf: { type: DataTypes.STRING(20), allowNull: false },
  whatsapp: { type: DataTypes.STRING(20), allowNull: false },
  data_nascimento: { type: DataTypes.TEXT, allowNull: false },
  plano: { type: DataTypes.STRING(50), allowNull: false },
  objetivo: { type: DataTypes.TEXT, allowNull: true },
  origem: { type: DataTypes.TEXT, allowNull: true },
  submitted_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
  contact: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: "matriculas",
  timestamps: false,
});

module.exports = Matricula;
