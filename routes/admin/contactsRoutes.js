const express = require('express');
const router = express.Router();
const contactsController = require('../../controllers/admin/contactsController');

// Página (shell) — os cards vêm por AJAX
router.get('/contatos', contactsController.renderContactsPage);

// Endpoint AJAX com paginação e busca
router.get('/contatos/search', contactsController.searchContacts);

module.exports = router;
