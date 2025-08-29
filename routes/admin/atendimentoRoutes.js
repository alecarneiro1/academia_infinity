const express = require('express');
const router = express.Router();
const atendimentosController = require('../../controllers/admin/atendimentosController');

// /admin/atendimentos ou /admin/atendimentos/1,2,3
router.get('/:ids?', atendimentosController.listAtendimentos);

module.exports = router;
