// =====================================================================
// CAPA DE PRESENTACIÓN (controlador)
// Traduce HTTP <-> servicio: recibe parámetros, filtros y cuerpo JSON,
// llama al servicio y construye las respuestas HTTP.
// =====================================================================

const service = require("../services/citas.service");
const HttpError = require("../utils/http-error");

// -------------------------------------------------------------
// LEER ID: valida que el identificador de la URL
// sea un entero positivo.
// -------------------------------------------------------------
function leerId(req) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "El id debe ser un entero positivo");
  }

  return id;
}

// -------------------------------------------------------------
// LISTAR: GET /citas
// Permite filtrar por estado mediante ?estado=
// -------------------------------------------------------------
async function listar(req, res) {
  const filtros = { estado: req.query.estado };
  const citas = await service.listar(filtros);

  res.status(200).json(citas);
}

// -------------------------------------------------------------
// OBTENER: GET /citas/:id
// Consulta una cita mediante su identificador.
// -------------------------------------------------------------
async function obtener(req, res) {
  const cita = await service.obtener(leerId(req));

  res.status(200).json(cita);
}

// -------------------------------------------------------------
// CREAR: POST /citas
// Registra una nueva cita y devuelve 201 Created.
// -------------------------------------------------------------
async function crear(req, res) {
  const nueva = await service.crear(req.body);

  res.status(201).location(`${req.baseUrl}/${nueva.id}`).json(nueva);
}

// -------------------------------------------------------------
// ACTUALIZAR: PUT /citas/:id
// Reemplaza los datos de una cita existente.
// -------------------------------------------------------------
async function actualizar(req, res) {
  const id = leerId(req);

  const citaActualizada = await service.actualizar(id, req.body);

  res.status(200).json(citaActualizada);
}

// -------------------------------------------------------------
// ELIMINAR: DELETE /citas/:id
// Elimina una cita y devuelve 204 sin contenido.
// -------------------------------------------------------------
async function eliminar(req, res) {
  const id = leerId(req);

  await service.eliminar(id);

  res.status(204).end();
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
};
