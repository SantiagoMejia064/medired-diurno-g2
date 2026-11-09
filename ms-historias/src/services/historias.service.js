// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require('../repositories/historias.repository');
const { validarHistoria, construirHistoria } = require('../models/historias');
const HttpError = require('../utils/http-error');

async function obtener(id) {
  const historia = await repo.findById(id);
  if (!historia) throw new HttpError(404, `No existe la historia con id ${id}`);
  return historia;
}

function validarFechaNoFutura(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaAtencion = new Date(`${fecha}T00:00:00`);

  if (fechaAtencion > hoy) {
    throw new HttpError(
      400,
      'La fecha de la atención no puede ser futura'
    );
  }
}

async function crear(datos) {
  const errores = validarHistoria(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  validarFechaNoFutura(datos.fecha);

  const historia = construirHistoria(datos);
  return repo.create(historia);
}

async function actualizar(id, datos) {
  const errores = validarHistoria(datos);

  if (errores.length > 0) {
    throw new HttpError(400, 'Datos inválidos', errores);
  }

  validarFechaNoFutura(datos.fecha);

  const historia = construirHistoria(datos);
  const actualizada = await repo.update(id, historia);

  if (!actualizada) {
    throw new HttpError(404, `No existe la historia con id ${id}`);
  }

  return actualizada;
}

async function eliminar(id) {
  const eliminado = await repo.remove(id);

  if (!eliminado) {
    throw new HttpError(404, `No existe la historia con id ${id}`);
  }
}

async function listar(filtros = {}) {
  return repo.findAll(filtros);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
