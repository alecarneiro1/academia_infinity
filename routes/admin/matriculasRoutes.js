const express = require('express');
const router = express.Router();
const matriculasController = require('../../controllers/admin/matriculasController');

router.get('/:id', matriculasController.getMatricula);

module.exports = router;
module.exports = router;
