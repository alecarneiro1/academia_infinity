const Matricula = require('../../models/matriculaModel');
const { Op } = require('sequelize');

const PAGE_SIZE = 10;

exports.listMatriculas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const where = search
      ? { nome_completo: { [Op.iLike]: `%${search}%` } }
      : {};

    const { count, rows } = await Matricula.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    });

    // Se for AJAX (busca ou paginação), retorna JSON
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({
        matriculas: rows.map(m => ({
          id: m.id,
          nome_completo: m.nome_completo,
          submitted_at: m.submitted_at
        })),
        hasMore: (page * PAGE_SIZE) < count
      });
    }

    res.render('admin/matriculasView', {
      matriculas: rows,
      hasMore: (page * PAGE_SIZE) < count,
      activePath: '/admin/matriculas'
    });
  } catch (err) {
    console.error('Erro ao buscar matrículas:', err);
    res.status(500).send('Erro ao buscar matrículas');
  }
};

exports.singleMatricula = async (req, res) => {
  try {
    const id = req.params.id;
    const matricula = await Matricula.findByPk(id);
    if (!matricula) return res.status(404).send('Matrícula não encontrada');
    res.render('admin/matriculasSingleView', {
      matricula,
      activePath: '/admin/matriculas'
    });
  } catch (err) {
    console.error('Erro ao buscar matrícula:', err);
    res.status(500).send('Erro ao buscar matrícula');
  }
};

exports.getMatricula = async (req, res) => {
  try {
    const id = req.params.id;
    const matricula = await Matricula.findByPk(id);
    if (req.query.json == '1') {
      if (!matricula) return res.json({ matricula: null });
      return res.json({ matricula });
    }
    // ...renderização normal da view...
    res.render('admin/matriculasSingleView', { matricula });
  } catch (err) {
    if (req.query.json == '1') return res.json({ matricula: null });
    res.status(500).send('Erro ao buscar matrícula');
  }
};
