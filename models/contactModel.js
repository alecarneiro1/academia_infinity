// src/models/contactModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Contact = sequelize.define("Contact", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  contactname: { type: DataTypes.STRING(100), allowNull: false },
  contactphone: { type: DataTypes.STRING(20), allowNull: false },
}, {
  tableName: "contacts",
  timestamps: false,
});

module.exports = Contact;
