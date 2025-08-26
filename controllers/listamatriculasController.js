const Matricula = require("../models/listamatriculasModel");

exports.show = async (req, res) => {
  const id = req.params.id;
  try {
    const matricula = await Matricula.findByPk(id);
    if (!matricula) {
      return res.status(404).send("Matrícula não encontrada.");
    }
    res.render("listamatriculasView", { matricula });
  } catch (err) {
    res.status(500).send("Erro ao buscar matrícula.");
  }
};
