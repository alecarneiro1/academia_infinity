// src/routes/matriculasRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/matriculasController");

// GET do formulário (singular e plural)
router.get("/matriculas", ctrl.form);
router.get("/matriculas/:numero", ctrl.form);

// (opcional) página de sucesso
// router.get("/matricula/sucesso", ctrl.sucesso);

module.exports = router;
