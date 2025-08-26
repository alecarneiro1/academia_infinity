const router = require("express").Router();
const ctrl = require("../controllers/listamatriculasController");

router.get("/admin/matriculas/:id", ctrl.show);

module.exports = router;
