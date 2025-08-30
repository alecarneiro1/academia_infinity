// Middleware para título da página e activePath automáticos
module.exports = (req, res, next) => {
  // normaliza: remove barra final
  const clean = req.path.replace(/\/+$/, '');
  const parts = clean.split('/');
  const section = (parts[1] === 'admin' ? parts[2] : null) || 'dashboard';

  const activePath = `/admin/${section}`;
  const titles = {
    '/admin/dashboard': 'Dashboard',
    '/admin/agente': 'Agente',
    '/admin/chatlogs': 'Mensagens',
    '/admin/contatos': 'Contatos',
    '/admin/atendimentos': 'Atendimentos',
    '/admin/matriculas': 'Matrículas',
  };

  res.locals.activePath = activePath;
  res.locals.pageTitle = titles[activePath] || 'Painel';

  // DEBUG: log para verificar se está funcionando
  console.log('pageTitlesMiddleware:', { path: req.path, activePath, pageTitle: res.locals.pageTitle });

  next();
};