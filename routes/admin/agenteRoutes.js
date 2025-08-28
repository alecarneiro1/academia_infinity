const express = require('express');
const router = express.Router();
const agenteController = require('../../controllers/admin/agenteController');

router.get('/agente', agenteController.getInfoList);
router.post('/agente/:id', agenteController.updateInfo);

module.exports = router;
