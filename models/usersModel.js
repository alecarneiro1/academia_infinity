// models/usersModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // ajusta o caminho se precisar

const User = sequelize.define("User", {
  id: {
    type: DataTypes.BIGINT,      // compatível com a PK
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(191), // respeita o índice UNIQUE em email
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  senha_hash: {
    type: DataTypes.STRING(255), // espaço suficiente para bcrypt/argon2
    allowNull: false,
  },
}, {
  tableName: "users",
  schema: "public",
  timestamps: false, // ativa se quiser Sequelize gerenciar createdAt/updatedAt
  indexes: [
    {
      name: "users_pkey",
      unique: true,
      fields: ["id"],
    },
    {
      name: "users_email_key",
      unique: true,
      fields: ["email"],
    },
  ],
});

module.exports = User;
