// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// =====================================================================

const { Router } = require("express");
const controller = require("../controllers/citas.controller");
const { verificarToken, requiereRol } = require("../middlewares/auth");

const router = Router();

// Todas las rutas de citas requieren autenticación.
router.use(verificarToken);

// Cualquier usuario autenticado puede consultar citas.
router.get("/", controller.listar);
router.get("/:id", controller.obtener);

// Solo administrador y admisiones pueden modificar citas.
router.post("/", requiereRol("administrador", "admisiones"), controller.crear);

router.put(
  "/:id",
  requiereRol("administrador", "admisiones"),
  controller.actualizar,
);

router.delete(
  "/:id",
  requiereRol("administrador", "admisiones"),
  controller.eliminar,
);

module.exports = router;
