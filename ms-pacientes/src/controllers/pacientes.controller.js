// =====================================================================
// CAPA DE PRESENTACIÓN (controlador)
// Traduce HTTP <-> servicio: lee la petición (params, body),
// llama al servicio y arma la respuesta (código de estado + JSON).
// =====================================================================
const service = require('../services/pacientes.service');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
  return id;
}

// GET /pacientes
// GET /pacientes, GET /pacientes?eps=Sanitas, GET /pacientes?ids=1,3
async function listar(req, res) {
  const filtros = { eps: req.query.eps };
  if(req.query.ids){
    filtros.ids = String(req.query.ids).split(',').map(Number);
    if (filtros.ids.some((id) => !Number.isInteger(id) || id <= 0)){
      throw new HttpError(400, 'ids debe ser una lista de enteros separados por comas');
    }
  }
  const pacientes = await service.listar(filtros);
  res.status(200).json(pacientes);
}

// GET /pacientes/:id
async function obtener(req, res) {
  const pacientes = await service.obtener(leerId(req));
  res.status(200).json(pacientes);
}

// POST /pacientes
async function crear(req, res) {
  const nuevo = await service.crear(req.body);
  res.status(201).location(`${req.baseUrl}/${nuevo.id}`).json(nuevo);
}

async function actualizar(req, res){
  const actualizado = await service.actualizar(leerId(req), req.body);
  res.status(200).json(actualizado);
}

async function eliminar(req, res){
  await service.eliminar(leerId(req));
  res.status(204).end();   //204 No content: éxito, sin cuerpo
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
