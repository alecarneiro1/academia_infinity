const express = require('express');
const router = express.Router();
const chatlogController = require('../../controllers/admin/chatlogController');

// --------- APIs (AJAX) ----------
router.get('/api/calendar', chatlogController.apiCalendar);
router.get('/api/messages', chatlogController.apiMessages);

// Autocomplete de contatos
router.get('/search', chatlogController.searchContacts);

// --------- Compat com URLs antigas (redireciona p/ query) ----------
router.get('/:userid/:ids', (req, res) => {
  const { userid, ids } = req.params;
  return res.redirect(`/admin/chatlogs?user=${encodeURIComponent(userid)}&ids=${encodeURIComponent(ids)}`);
});
router.get('/:userid', (req, res) => {
  const { userid } = req.params;
  return res.redirect(`/admin/chatlogs?user=${encodeURIComponent(userid)}`);
});

// --------- Página (shell) ----------
router.get('/', chatlogController.renderPage);

module.exports = router;
