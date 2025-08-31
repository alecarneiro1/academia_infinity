const express = require('express');
const router = express.Router();
const contactsController = require('../../controllers/admin/contactsController');

router.get('/contatos/search', contactsController.searchContacts);
router.get('/contatos', contactsController.listContacts);

module.exports = router;
module.exports = router;
