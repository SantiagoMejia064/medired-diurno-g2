
 // =====================================================================
 // CAPA DE PRESENTACIÓN (rutas)
 // Asocia cada método HTTP + URI con una función del controlador.
 // Taller 2: Autenticación JWT y autorización por roles.
 // =====================================================================

const { Router } = require('express');
const controller = require('../controllers/medicos.controller');

const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

// Todas las rutas de médicos requieren un token JWT válido
router.use(verificarToken);

// Consultas: cualquier usuario autenticado
router.get('/', controller.listar);
router.get('/:id', controller.obtener);

// Modificaciones: solo el administrador
router.post('/', requiereRol('administrador'), controller.crear);
router.put('/:id', requiereRol('administrador'), controller.actualizar);
router.delete('/:id', requiereRol('administrador'), controller.eliminar);

module.exports = router;
