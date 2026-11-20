
const repo = require('../repositories/pacientes.repository');
const { validarPaciente, construirPaciente } = require('../models/paciente');
const HttpError = require('../utils/http-error');

// Listar pacientes
async function listar(filtros = {}) {
  const pacientes = await repo.findAll(filtros);
  return pacientes;
}

// Obtener paciente por ID
async function obtener(id) {
  const paciente = await repo.findById(id);

  if (!paciente) {
    throw new HttpError(404, `No existe el paciente con id ${id}`);
  }

  return paciente;
}

// Crear paciente
async function crear(datos) {
  const errores = validarPaciente(datos);

  if (errores.length > 0) {
    throw new HttpError(400, 'Datos inválidos', errores);
  }

  const paciente = construirPaciente(datos);
  const existente = await repo.findByDocumento(paciente.documento);

  if (existente) {
    throw new HttpError(409, 'El documento ya está registrado');
  }

  try {
    const nuevo = await repo.create(paciente);
    return nuevo;

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'El documento ya está registrado');
    }

    throw error;
  }
}

// Actualizar paciente
async function actualizar(id, datos) {
  const errores = validarPaciente(datos);

  if (errores.length > 0) {
    throw new HttpError(400, 'Datos inválidos', errores);
  }

  const paciente = construirPaciente(datos);
  const existente = await repo.findByDocumento(paciente.documento);

  if (existente && Number(existente.id) !== Number(id)) {
    throw new HttpError(409, 'El documento ya está registrado');
  }

  try {
    const actualizado = await repo.update(id, paciente);

    if (!actualizado) {
      throw new HttpError(404, `No existe el paciente con id ${id}`);
    }

    return actualizado;

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'El documento ya está registrado');
    }

    if (error.status === 404 || error.statusCode === 404) {
      throw error;
    }

    throw error;
  }
}

// Eliminar paciente
async function eliminar(id) {
  const eliminado = await repo.remove(id);

  if (!eliminado) {
    throw new HttpError(404, `No existe el paciente con id ${id}`);
  }
}

// Exportar funciones
module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar
};
