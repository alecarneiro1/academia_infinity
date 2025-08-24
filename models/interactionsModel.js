// src/models/interactionsModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Interaction = sequelize.define("Interaction", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  contactName: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  contactNumber: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  userMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  agentResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  summary: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
}, {
  tableName: "interactions",
  timestamps: false,
});

module.exports = Interaction;
