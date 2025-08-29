const express = require('express');
const router = express.Router();
const contactsController = require('../../controllers/admin/contactsController');

router.get('/contatos', contactsController.listContacts);

module.exports = router;
