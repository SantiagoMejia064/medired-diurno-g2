// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// =====================================================================

const repo = require('../repositories/pacientes.repository');
const { validarPaciente, construirPaciente } = require('../models/paciente');
const HttpError = require('../utils/http-error');

// Listar pacientes
async function listar(filtros = {}) {
  const pacientes = await repo.findAll(filtros);

  console.log('\n========== LISTAR PACIENTES ==========');
  console.log('FILTROS:', filtros);
  console.log('RESPUESTA:', pacientes);
  console.log('TOTAL:', pacientes.length);
  console.log('======================================\n');

  return pacientes;
}

// Obtener paciente por ID
async function obtener(id) {
  const paciente = await repo.findById(id);

  if (!paciente) {
    console.log('\n========== PACIENTE NO ENCONTRADO ==========');
    console.log('ID:', id);
    console.log('============================================\n');

    throw new HttpError(404, `No existe el paciente con id ${id}`);
  }

  console.log('\n========== OBTENER PACIENTE ==========');
  console.log('ID:', id);
  console.log('RESPUESTA:', paciente);
  console.log('======================================\n');

  return paciente;
}

// Crear paciente
async function crear(datos) {
  const errores = validarPaciente(datos);

  if (errores.length > 0) {
    console.log('\n========== ERROR DE VALIDACIÓN ==========');
    console.log('ERRORES:', errores);
    console.log('=========================================\n');

    throw new HttpError(400, 'Datos inválidos', errores);
  }

  const paciente = construirPaciente(datos);

  const existente = await repo.findByDocumento(paciente.documento);

  if (existente) {
    console.log('\n========== DOCUMENTO DUPLICADO ==========');
    console.log('DOCUMENTO:', paciente.documento);
    console.log('=========================================\n');

    throw new HttpError(409, 'El documento ya está registrado');
  }

  try {
    const nuevo = await repo.create(paciente);

    console.log('\n========== PACIENTE CREADO ==========');
    console.log('DATOS:', nuevo);
    console.log('====================================\n');

    return nuevo;

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'El documento ya está registrado');
    }

    console.error('ERROR AL CREAR PACIENTE:', error);
    throw error;
  }
}

// Actualizar paciente
async function actualizar(id, datos) {
  const errores = validarPaciente(datos);

  if (errores.length > 0) {
    console.log('\n========== ERROR DE VALIDACIÓN ==========');
    console.log('ERRORES:', errores);
    console.log('=========================================\n');

    throw new HttpError(400, 'Datos inválidos', errores);
  }

  const paciente = construirPaciente(datos);

  const existente = await repo.findByDocumento(paciente.documento);

  if (existente && Number(existente.id) !== Number(id)) {
    console.log('\n========== DOCUMENTO DUPLICADO ==========');
    console.log('DOCUMENTO:', paciente.documento);
    console.log('=========================================\n');

    throw new HttpError(409, 'El documento ya está registrado');
  }

  try {
    const actualizado = await repo.update(id, paciente);

    if (!actualizado) {
      throw new HttpError(404, `No existe el paciente con id ${id}`);
    }

    console.log('\n========== PACIENTE ACTUALIZADO ==========');
    console.log('ID:', id);
    console.log('RESPUESTA:', actualizado);
    console.log('==========================================\n');

    return actualizado;

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'El documento ya está registrado');
    }

    console.error('ERROR AL ACTUALIZAR PACIENTE:', error);
    throw error;
  }
}

// Eliminar paciente
async function eliminar(id) {
  const eliminado = await repo.remove(id);

  if (!eliminado) {
    console.log('\n========== PACIENTE NO ENCONTRADO ==========');
    console.log('ID:', id);
    console.log('============================================\n');

    throw new HttpError(404, `No existe el paciente con id ${id}`);
  }

  console.log('\n========== PACIENTE ELIMINADO ==========');
  console.log('ID:', id);
  console.log('RESULTADO: Eliminación exitosa');
  console.log('========================================\n');
}

// Exportar funciones
module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar
};
