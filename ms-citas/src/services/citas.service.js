
 // =====================================================================
 // CAPA DE SERVICIO (lógica de negocio)
 // Aplica las validaciones y reglas de negocio de las citas médicas.
 // No conoce HTTP (req/res) ni dónde se almacenan los datos.
 // =====================================================================

const repo = require("../repositories/citas.repository");
const { validarCita, construirCita } = require("../models/cita");
const HttpError = require("../utils/http-error");

// -------------------------------------------------------------
// VALIDAR DATOS: comprueba las reglas definidas en el modelo.
// -------------------------------------------------------------
function validarDatos(datos) {
  const errores = validarCita(datos);

  if (errores.length > 0) {
    throw new HttpError(400, "Datos inválidos", errores);
  }
}

// -------------------------------------------------------------
// VALIDAR DISPONIBILIDAD: comprueba si el médico tiene
// otra cita activa en la misma fecha y hora.
// excluirId permite ignorar la propia cita durante un PUT.
// -------------------------------------------------------------
async function validarDisponibilidad(cita, excluirId = null) {
  // Las citas canceladas no ocupan horarios, o sea que al estar cancelada no interfiere con las demás.
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

// -------------------------------------------------------------
// LISTAR: obtiene las citas aplicando filtros opcionales.
// -------------------------------------------------------------
async function listar(filtros = {}) {
  return repo.findAll(filtros);
}

// -------------------------------------------------------------
// OBTENER: consulta una cita por ID.
// -------------------------------------------------------------
async function obtener(id) {
  const cita = await repo.findById(id);

  if (!cita) {
    throw new HttpError(404, `No existe la cita con id ${id}`);
  }

  return cita;
}

// -------------------------------------------------------------
// CREAR: valida datos y disponibilidad antes de guardar.
// -------------------------------------------------------------
async function crear(datos) {
  validarDatos(datos);

  const cita = construirCita(datos);

  await validarDisponibilidad(cita);

  return repo.create(cita);
}

// -------------------------------------------------------------
// ACTUALIZAR: verifica existencia, valida datos y comprueba
// conflictos con otras citas antes de reemplazar el registro.
// -------------------------------------------------------------
async function actualizar(id, datos) {
  // Comprobar que la cita exista.
  await obtener(id);

  // Aplicar las mismas validaciones del POST.
  validarDatos(datos);

  const cita = construirCita(datos);

  // Ignorar la propia cita al buscar conflictos de horario.
  await validarDisponibilidad(cita, id);

  return repo.update(id, cita);
}

// -------------------------------------------------------------
// ELIMINAR: elimina la cita o informa que no existe.
// -------------------------------------------------------------
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
