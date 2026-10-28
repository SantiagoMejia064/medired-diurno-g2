// =====================================================================
 // CAPA DE PRESENTACIÓN (controlador)
 // Traduce HTTP <-> servicio: lee la petición (params, body),
 // llama al servicio y arma la respuesta (código de estado + JSON).
 // =====================================================================

const service = require('../services/medicos.service');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'El id debe ser un entero positivo');
  }
  return id;
}

// GET /medicos
async function listar(req, res) {
  const medicos = await service.listar();
  res.status(200).json(medicos);
}

// GET /medicos/:id
async function obtener(req, res) {
  const medico = await service.obtener(leerId(req));
  res.status(200).json(medico);
}

// POST /medicos
async function crear(req, res) {
  const nuevo = await service.crear(req.body);
  res.status(201).location(`${req.baseUrl}/${nuevo.id}`).json(nuevo);
}

module.exports = { listar, obtener, crear };
