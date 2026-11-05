// =====================================================================
 // CAPA DE SERVICIO (lógica de negocio)
 // Aplica las reglas del negocio y las validaciones.
 // No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
 // =====================================================================

const repo = require('../repositories/medicos.repository');
const { validarMedico, construirMedico } = require('../models/medico');
const HttpError = require('../utils/http-error');

async function listar(filtros) {
  return repo.findAll(filtros);
}

async function obtener(id) {
  const medico = await repo.findById(id);

  if (!medico) {
    throw new HttpError(404, `No existe el médico con id ${id}`);
  }

  return medico;
}

async function crear(datos) {
  const errores = validarMedico(datos);

  if (errores.length > 0) {
    throw new HttpError(400, 'Datos inválidos', errores);
  }

  const medico = construirMedico(datos);

  // Regla de negocio:
  // No pueden existir dos médicos con el mismo registro médico.
  if (await repo.findByRegistroMedico(medico.registro_medico)) {
    throw new HttpError(
      409,
      `Ya existe un médico con el registro ${medico.registro_medico}`
    );
  }

  return repo.create(medico);
}

async function actualizar(id, datos) {
  const errores = validarMedico(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  const medico = construirMedico(datos);

  const actualizado = await repo.update(id, medico);
  if (!actualizado) throw new HttpError(404, `No existe el médico con id ${id}`);

  return actualizado;
}

async function eliminar(id) {
  const eliminado = await repo.remove(id);
  if (!eliminado) throw new HttpError(404, `No existe el médico con id ${id}`);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
