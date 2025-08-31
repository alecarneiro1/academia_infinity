const express = require('express');
const router = express.Router();
const atend = require('../../controllers/admin/atendimentosController');

// --------- APIs (AJAX) ----------
router.get('/api/list', atend.apiList);          // ?user=ID&ids=1,2,3&page=1
router.get('/search',  atend.searchContacts);    // q=nome (autocomplete)

// --------- Compat com URLs antigas (redireciona p/ query) ----------
router.get('/:ids', (req, res) => {
  const raw = req.params.ids || '';
  if (!raw) return res.redirect('/admin/atendimentos');

  // se tiver vírgula, são IDs de atendimentos
  if (raw.includes(',')) {
    return res.redirect(`/admin/atendimentos?ids=${encodeURIComponent(raw)}`);
  }

  // só dígitos -> antigo "contato" (user)
  if (/^\d+$/.test(raw)) {
    return res.redirect(`/admin/atendimentos?user=${encodeURIComponent(raw)}`);
  }

  return res.redirect('/admin/atendimentos');
});

// --------- Página (shell) ----------
router.get('/', atend.renderPage);

module.exports = router;
