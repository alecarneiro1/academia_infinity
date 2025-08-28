// src/models/summaryModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Summary = sequelize.define("Summary", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  subject: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  start_time: { type: DataTypes.TIME, allowNull: true },
  end_time: { type: DataTypes.TIME, allowNull: true },
  duration_minutes: { type: DataTypes.INTEGER, allowNull: true },
  summary: { type: DataTypes.TEXT, allowNull: true },
  history_url: { type: DataTypes.TEXT, allowNull: true },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: sequelize.literal("(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')"),
  },
  contact: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: "summaries",
  timestamps: false,
});

module.exports = Summary;
