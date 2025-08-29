const express = require('express');
const router = express.Router();
const chatlogController = require('../../controllers/admin/chatlogController');

router.get('/search', chatlogController.searchContacts);
router.get('/:userid/:ids?', chatlogController.chatlogView);
router.get('/', (req, res) => res.render('admin/chatlogView', { activePath: '/admin/chatlogs', contact: null, messages: [], hasMore: false, userId: null, idsParam: '' }));

module.exports = router;
