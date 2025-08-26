// src/models/matriculasModel.js
const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../config/db");

const Matricula = sequelize.define(
  "Matricula",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true, // nextval('matriculas_id_seq'::regclass)
    },

    // nome_completo: varchar(150) NOT NULL
    nome_completo: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    // endereco: text NOT NULL
    endereco: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // cep: varchar(20) NOT NULL
    cep: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    // cpf: varchar(20) NOT NULL
    cpf: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    // whatsapp: varchar(20) NOT NULL (único se você já criou o UNIQUE no DB)
    whatsapp: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true, // respeita o índice único criado no banco
    },

    // data_nascimento: text NOT NULL (mantido como TEXT conforme sua tabela)
    data_nascimento: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // plano: varchar(50) NOT NULL
    plano: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    // objetivo: text NULL
    objetivo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // origem: text NULL
    origem: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // submitted_at: timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP
    submitted_at: {
      type: DataTypes.DATE, // Sequelize mapeia sem timezone como DATE também
      allowNull: true,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },

    // form_mode: varchar(20) NULL
    form_mode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    tableName: "matriculas",
    timestamps: false, // tabela não tem createdAt/updatedAt
    indexes: [
      // garante o mesmo comportamento do índice único no banco
      { unique: true, fields: ["whatsapp"], name: "matriculas_whatsapp_key" },
    ],
  }
);

module.exports = Matricula;
