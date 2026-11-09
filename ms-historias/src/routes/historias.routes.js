// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/historias.controller');

const router = Router();

router.get('/', controller.listar);      // listar todos los historias
router.get('/:id', controller.obtener);  // obtener un historias por id
router.post('/', controller.crear);      // crear un historias

// Taller 2: agregar PUT /:id (actualizar) y DELETE /:id (eliminar)

module.exports = router;
