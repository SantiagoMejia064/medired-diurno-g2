
 // =====================================================================
 // CAPA DE SERVICIO (lógica de negocio)
 // Aplica las validaciones y reglas de negocio de las citas médicas.
 // No conoce HTTP (req/res) ni dónde se almacenan los datos.
 // =====================================================================

const repo = require("../repositories/citas.repository");
const { validarCita, construirCita } = require("../models/cita");
const HttpError = require("../utils/http-error");

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
    excluirId
  );

  if (citaExistente) {
    throw new HttpError(
      409,
      "El médico ya tiene una cita programada o atendida en esa fecha y hora"
    );
  }
}

// Consulta las citas aplicando los filtros recibidos.
async function listar(filtros = {}) {
  return repo.findAll(filtros);
}

// Busca una cita por id o informa que no existe.
async function obtener(id) {
  const cita = await repo.findById(id);

  if (!cita) {
    throw new HttpError(404, `No existe la cita con id ${id}`);
  }

  return cita;
}

// Valida los datos y la disponibilidad antes de guardar la cita.
async function crear(datos) {
  validarDatos(datos);

  const cita = construirCita(datos);

  await validarDisponibilidad(cita);

  return repo.create(cita);
}

// Verifica existencia, datos y disponibilidad antes de reemplazar la cita.
async function actualizar(id, datos) {
  await obtener(id);

  validarDatos(datos);

  const cita = construirCita(datos);

  // Ignorar la propia cita al buscar conflictos de horario.
  await validarDisponibilidad(cita, id);

  return repo.update(id, cita);
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
