// src/models/chatlogModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Chatlog = sequelize.define("Chatlog", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  contactid: { type: DataTypes.INTEGER, allowNull: false },
  usermessage: { type: DataTypes.TEXT, allowNull: false },
  agentresponse: { type: DataTypes.TEXT, allowNull: false },
  time: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: sequelize.literal("(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')"),
  },
  summary: { type: DataTypes.SMALLINT, allowNull: true, defaultValue: 0 },
  action: { type: DataTypes.STRING(20), allowNull: true },
}, {
  tableName: "chatlogs",
  timestamps: false,
});

module.exports = Chatlog;
