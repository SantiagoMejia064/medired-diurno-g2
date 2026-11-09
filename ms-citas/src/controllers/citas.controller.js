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

// Lista las citas con filtro opcional por estado.
async function listar(req, res) {
  const filtros = { estado: req.query.estado };
  const citas = await service.listar(filtros);

  res.status(200).json(citas);
}

// Consulta una cita por id y devuelve sus datos.
async function obtener(req, res) {
  const cita = await service.obtener(leerId(req));

  res.status(200).json(cita);
}

// Crea una cita y responde con su ubicación y estado 201.
async function crear(req, res) {
  const nueva = await service.crear(req.body);

  res.status(201).location(`${req.baseUrl}/${nueva.id}`).json(nueva);
}

// Actualiza la cita indicada en la URL y devuelve sus datos.
async function actualizar(req, res) {
  const id = leerId(req);

  const citaActualizada = await service.actualizar(id, req.body);

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
