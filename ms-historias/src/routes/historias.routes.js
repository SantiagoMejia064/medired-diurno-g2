// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/historias.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

router.use(verificarToken);

router.get('/', controller.listar);      // listar todos los historias
router.get('/:id', controller.obtener);  // obtener un historias por id
router.post('/', requiereRol('administrador', 'medico'), controller.crear);
router.put('/:id', requiereRol('administrador', 'medico'), controller.actualizar);
router.delete('/:id', requiereRol('administrador', 'medico'), controller.eliminar);

module.exports = router;
