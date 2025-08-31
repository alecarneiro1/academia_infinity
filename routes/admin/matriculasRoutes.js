const express = require('express');
const router = express.Router();
const matriculasController = require('../../controllers/admin/matriculasController');

// Lista/pesquisa de matrículas (SSR e AJAX)
router.get('/', matriculasController.listMatriculas);

// Detalhe/modal de matrícula por id
router.get('/:id', matriculasController.getMatricula);

module.exports = router;
