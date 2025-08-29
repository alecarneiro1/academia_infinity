const express = require('express');
const router = express.Router();
const matriculasController = require('../../controllers/admin/matriculasController');

router.get('/', matriculasController.listMatriculas);
router.get('/:id', matriculasController.singleMatricula);

module.exports = router;
