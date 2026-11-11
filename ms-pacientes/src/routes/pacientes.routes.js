// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/pacientes.controller');
const { verificarToken, requiereRol } = require('../middlewars/auth');

const router = Router();

router.use(verificarToken); //todas las rutas exigen token


router.get('/', controller.listar);      // listar todos los pacientes
router.get('/:id', controller.obtener);  // obtener un pacientes por id
router.post('/', requiereRol('administrador'), controller.crear);      // crear un pacientes
router.put('/:id', requiereRol('administrador'), controller.actualizar); //actualizar un paciente
router.delete('/:id', requiereRol('administrador'), controller.eliminar); //eliminar un paciente

// Taller 2: agregar PUT /:id (actualizar) y DELETE /:id (eliminar)

module.exports = router;
