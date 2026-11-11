// =====================================================================
// CAPA DE PRESENTACIÓN (controlador)
// Traduce HTTP <-> servicio: recibe parámetros, filtros y cuerpo JSON,
// llama al servicio y construye las respuestas HTTP.
// =====================================================================

const service = require("../services/citas.service");
const HttpError = require("../utils/http-error");

// El id de la URL debe ser un entero positivo.
function leerId(req) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "El id debe ser un entero positivo");
  }

  return id;
}

// Lista las citas con filtros y sus datos relacionados.
async function listar(req, res) {
  const filtros = { estado: req.query.estado };

  // Reenviar el JWT para consultar otros microservicios.
  const citas = await service.listar(filtros, req.headers.authorization);

  res.status(200).json(citas);
}

// Consulta una cita por id con su paciente y médico.
async function obtener(req, res) {
  const cita = await service.obtener(leerId(req), req.headers.authorization);

  res.status(200).json(cita);
}

// Crea una cita validando sus referencias y responde 201.
async function crear(req, res) {
  const nueva = await service.crear(req.body, req.headers.authorization);

  res.status(201).location(`${req.baseUrl}/${nueva.id}`).json(nueva);
}

// Actualiza una cita y devuelve sus datos relacionados.
async function actualizar(req, res) {
  const id = leerId(req);

  const citaActualizada = await service.actualizar(
    id,
    req.body,
    req.headers.authorization,
  );

  res.status(200).json(citaActualizada);
}

// Elimina la cita indicada y responde sin contenido.
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
