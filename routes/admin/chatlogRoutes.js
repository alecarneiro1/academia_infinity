const express = require('express');
const router = express.Router();
const chatlogController = require('../../controllers/admin/chatlogController');

// Autocomplete de contatos
router.get('/search', chatlogController.searchContacts);

// URL-driven (mais específico primeiro)
router.get('/:userid/:ids', chatlogController.chatlogView);   // /admin/chatlogs/1/2,3,4
router.get('/:userid',      chatlogController.chatlogView);   // /admin/chatlogs/1
router.get('/',             chatlogController.chatlogView);   // /admin/chatlogs (inicial)

module.exports = router;
