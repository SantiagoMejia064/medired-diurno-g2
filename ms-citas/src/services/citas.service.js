// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica validaciones, reglas de negocio y relaciones REST.
// No conoce HTTP (req/res) ni dónde se almacenan los datos.
// =====================================================================

const repo = require("../repositories/citas.repository");
const { validarCita, construirCita } = require("../models/cita");
const HttpError = require("../utils/http-error");

// Clientes HTTP de los microservicios relacionados.
const pacientesClient = require("../clients/pacientes.client");
const medicosClient = require("../clients/medicos.client");

// Rechaza los datos que incumplen las validaciones del modelo.
function validarDatos(datos) {
  const errores = validarCita(datos);

  if (errores.length > 0) {
    throw new HttpError(400, "Datos inválidos", errores);
  }
}

// Verifica que el médico no tenga otra cita en el mismo horario.
async function validarDisponibilidad(cita, excluirId = null) {
  // Las citas canceladas no ocupan horarios.
  if (cita.estado === "cancelada") {
    return;
  }

  const citaExistente = await repo.findByMedicoYFecha(
    cita.medico_id,
    cita.fecha_hora,
    excluirId,
  );

  if (citaExistente) {
    throw new HttpError(
      409,
      "El médico ya tiene una cita programada o atendida en esa fecha y hora",
    );
  }
}

// =====================================================================
// RELACIONES REST: VALIDACIÓN
// Comprueba que el paciente y el médico existan en sus microservicios.
// =====================================================================

async function validarReferencias(cita, token) {
  // Consultar al microservicio de pacientes.
  const existePaciente = await pacientesClient.existePaciente(
    cita.paciente_id,
    token,
  );

  if (!existePaciente) {
    throw new HttpError(
      400,
      `No existe el paciente con id ${cita.paciente_id}`,
    );
  }

  // Consultar al microservicio de médicos.
  const existeMedico = await medicosClient.existeMedico(cita.medico_id, token);

  if (!existeMedico) {
    throw new HttpError(400, `No existe el médico con id ${cita.medico_id}`);
  }
}

// =====================================================================
// RELACIONES REST: COMPOSICIÓN
// Agrega los datos del paciente y médico a cada cita.
// Utiliza una consulta por lotes a cada microservicio.
// =====================================================================

async function componer(citas, token) {
  if (citas.length === 0) {
    return [];
  }

  // Obtener IDs únicos para evitar consultas repetidas.
  const pacientesIds = [...new Set(citas.map((cita) => cita.paciente_id))];

  const medicosIds = [...new Set(citas.map((cita) => cita.medico_id))];

  // Consultar los dos microservicios.
  const [pacientes, medicos] = await Promise.all([
    pacientesClient.pacientesPorIds(pacientesIds, token),
    medicosClient.medicosPorIds(medicosIds, token),
  ]);

  // Incorporar los objetos relacionados a cada cita.
  return citas.map((cita) => {
    const resultado = {
      ...cita,

      paciente: pacientes
        ? pacientes.get(Number(cita.paciente_id)) || null
        : null,

      medico: medicos ? medicos.get(Number(cita.medico_id)) || null : null,
    };

    // Informar si alguno de los servicios no respondió.
    const avisos = [];

    if (pacientes === null) {
      avisos.push("ms-pacientes no disponible");
    }

    if (medicos === null) {
      avisos.push("ms-medicos no disponible");
    }

    if (avisos.length > 0) {
      resultado.aviso = avisos.join("; ");
    }

    return resultado;
  });
}

// =====================================================================
// OPERACIONES CRUD
// =====================================================================

// Consulta las citas aplicando los filtros y agrega sus relaciones.
async function listar(filtros = {}, token) {
  const citas = await repo.findAll(filtros);

  return componer(citas, token);
}

// Busca una cita por ID y agrega sus objetos relacionados.
async function obtener(id, token) {
  const cita = await repo.findById(id);

  if (!cita) {
    throw new HttpError(404, `No existe la cita con id ${id}`);
  }

  const [citaCompuesta] = await componer([cita], token);

  return citaCompuesta;
}

// Valida datos, referencias y disponibilidad antes de crear.
async function crear(datos, token) {
  validarDatos(datos);

  const cita = construirCita(datos);

  // Comprobar que existan el paciente y el médico.
  await validarReferencias(cita, token);

  // Mantener nuestra regla de horarios duplicados.
  await validarDisponibilidad(cita);

  const nueva = await repo.create(cita);

  // Devolver la nueva cita con sus relaciones.
  const [citaCompuesta] = await componer([nueva], token);

  return citaCompuesta;
}

// Verifica existencia, datos y referencias antes de actualizar.
async function actualizar(id, datos, token) {
  const existente = await repo.findById(id);

  if (!existente) {
    throw new HttpError(404, `No existe la cita con id ${id}`);
  }

  validarDatos(datos);

  const cita = construirCita(datos);

  // Comprobar que existan el paciente y el médico.
  await validarReferencias(cita, token);

  // Ignorar la propia cita al buscar conflictos de horario.
  await validarDisponibilidad(cita, id);

  const actualizada = await repo.update(id, cita);

  // Devolver la cita actualizada con sus relaciones.
  const [citaCompuesta] = await componer([actualizada], token);

  return citaCompuesta;
}

// Elimina la cita o informa que no existe.
async function eliminar(id) {
  const eliminado = await repo.remove(id);

  if (!eliminado) {
    throw new HttpError(404, `No existe la cita con id ${id}`);
  }
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
};
