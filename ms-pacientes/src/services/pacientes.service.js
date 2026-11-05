
// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================

const repo = require('../repositories/pacientes.repository');
const { validarPaciente, construirPaciente } = require('../models/paciente');
const HttpError = require('../utils/http-error');

// =====================================================================
// LISTAR PACIENTES
// =====================================================================

async function listar(filtros = {}) {
  return await repo.findAll(filtros);
}

// =====================================================================
// OBTENER UN PACIENTE POR ID
// =====================================================================

async function obtener(id) {
  const paciente = await repo.findById(id);

  if (!paciente) {
    throw new HttpError(404, `No existe el paciente con id ${id}`);
  }

  return paciente;
}

// =====================================================================
// CREAR UN PACIENTE
// =====================================================================

async function crear(datos) {
  const errores = validarPaciente(datos);

  if (errores.length > 0) {
    throw new HttpError(400, 'Datos inválidos', errores);
  }

  const paciente = construirPaciente(datos);

  // Verificar que el documento no esté registrado
  const existente = await repo.findByDocumento(paciente.documento);

  if (existente) {
    throw new HttpError(
      409,
      `Ya existe un paciente con el número de documento: ${paciente.documento}`
    );
  }

  return await repo.create(paciente);
}

// =====================================================================
// ACTUALIZAR UN PACIENTE
// =====================================================================

async function actualizar(id, datos) {

  // Primero verificar que el paciente exista
  await obtener(id);

  // Validar los datos recibidos
  const errores = validarPaciente(datos);

  if (errores.length > 0) {
    throw new HttpError(400, 'Datos inválidos', errores);
  }

  const paciente = construirPaciente(datos);

  // Verificar si el documento pertenece a otro paciente
  const otro = await repo.findByDocumento(paciente.documento);

  if (otro && Number(otro.id) !== Number(id)) {
    throw new HttpError(
      409,
      `Ya existe un paciente con el documento ${paciente.documento}`
    );
  }

  return await repo.update(id, paciente);
}

// =====================================================================
// ELIMINAR UN PACIENTE
// =====================================================================

async function eliminar(id) {

  // Primero verificar que el paciente exista
  await obtener(id);

  await repo.remove(id);

  return true;
}

// =====================================================================
// EXPORTAR FUNCIONES
// =====================================================================

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar
};
