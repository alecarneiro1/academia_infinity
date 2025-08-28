// src/models/infoModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Info = sequelize.define("Info", {
  id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
  titulo: { type: DataTypes.STRING(255), allowNull: false },
  conteudo: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: "info",
  timestamps: false,
});

module.exports = Info;
