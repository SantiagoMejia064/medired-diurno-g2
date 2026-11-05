// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require('../repositories/pacientes.repository');
const { validarPaciente, construirPaciente } = require('../models/paciente');
const HttpError = require('../utils/http-error');

async function listar(filtros) {
  return repo.findAll(filtros);
}

async function obtener(id) {
  const paciente = await repo.findById(id);
  if (!paciente) throw new HttpError(404, `No existe el paciente con id ${id}`);
  return paciente;
}

async function crear(datos) {
  const errores = validarPaciente(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  const paciente = construirPaciente(datos);

  // Regla de negocio: no puede haber dos pacientes con el mismo documento
  // (el documento es con lo que se inicia sesión). 409 = Conflict.
  if (await repo.findByDocumento(paciente.documento)) {
    throw new HttpError(409, `Ya existe un paciente con el número de documento: ${paciente.documento}`);
  }

  return repo.create(paciente);
}

async function actualizar(id, datos){
  const errores = validarPaciente(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const paciente = construirPaciente(datos);

  const actualizado = await repo.update(id, paciente);
  if (!actualizado) throw new HttpError(404, `No existe el paciente con id ${id}`);
  return actualizado;
}

async function eliminar(id){
  const eliminado = await repo.remove(id);
  if (!eliminado) throw new HttpError(404, `No existe el usuario con id ${id}`)
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
