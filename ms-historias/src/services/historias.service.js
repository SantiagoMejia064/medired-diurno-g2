// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require('../repositories/historias.repository');
const { validarHistoria, construirHistoria } = require('../models/historias');
const HttpError = require('../utils/http-error');

const pacientesClient = require('../clients/pacientes.client');
const medicosClient = require('../clients/medico.client');

async function validarReferencias(historia, token) {
  const pacienteExiste = await pacientesClient.existePaciente(historia.paciente_id, token);
  if (!pacienteExiste) {
    throw new HttpError(400, `No existe el paciente con id ${historia.paciente_id}`);
  }

  const medicoExiste = await medicosClient.existeMedico(historia.medico_id, token);
  if (!medicoExiste) {
    throw new HttpError(400, `No existe el médico con id ${historia.medico_id}`);
  }
}

async function componer(historias, token) {
  const idsPacientes = [...new Set(historias.map((historia) => historia.paciente_id))];
  const idsMedicos = [...new Set(historias.map((historia) => historia.medico_id))];

  const [pacientes, medicos] = await Promise.all([
    pacientesClient.pacientesPorIds(idsPacientes, token),
    medicosClient.medicosPorIds(idsMedicos, token),
  ]);

  const avisos = [];
  if (pacientes === null) avisos.push('ms-pacientes no está disponible');
  if (medicos === null) avisos.push('ms-medicos no está disponible');

  return historias.map((historia) => ({
    ...historia,
    paciente: pacientes?.get(historia.paciente_id) ?? null,
    medico: medicos?.get(historia.medico_id) ?? null,
    ...(avisos.length > 0 ? { aviso: avisos.join('. ') } : {}),
  }));
}

async function obtener(id, token) {
  const historia = await repo.findById(id);

  if (!historia) {
    throw new HttpError(404, `No existe la historia con id ${id}`);
  }

  const [compuesta] = await componer([historia], token);
  return compuesta;
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

async function crear(datos, token) {
  const errores = validarHistoria(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  validarFechaNoFutura(datos.fecha);

  const historia = construirHistoria(datos);
  await validarReferencias(historia, token);
  const nueva = await repo.create(historia);
  const [compuesta] = await componer([nueva], token);
  return compuesta;
}

async function actualizar(id, datos, token) {
  const errores = validarHistoria(datos);

  if (errores.length > 0) {
    throw new HttpError(400, 'Datos inválidos', errores);
  }

  validarFechaNoFutura(datos.fecha);

  const historia = construirHistoria(datos);
  await validarReferencias(historia, token);
  const actualizada = await repo.update(id, historia);

  if (!actualizada) {
    throw new HttpError(404, `No existe la historia con id ${id}`);
  }

  const [compuesta] = await componer([actualizada], token);
  return compuesta;
}

async function eliminar(id) {
  const eliminado = await repo.remove(id);

  if (!eliminado) {
    throw new HttpError(404, `No existe la historia con id ${id}`);
  }
}

async function listar(filtros = {}, token) {
  const historias = await repo.findAll(filtros);
  return componer(historias, token);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
