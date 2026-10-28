// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require("../repositories/citas.repository");
const { validarCita, construirCita } = require("../models/cita");
const HttpError = require("../utils/http-error");

async function listar() {
  return repo.findAll();
}

async function obtener(id) {
  const cita = await repo.findById(id);
  if (!cita) throw new HttpError(404, `No existe la cita con id ${id}`);
  return cita;
}

async function crear(datos) {
  const errores = validarCita(datos);
  if (errores.length > 0) {
    throw new HttpError(400, "Datos inválidos", errores);
  }

  const cita = construirCita(datos);

  // Regla de negocio: evitar citas en horarios ocupados
  if (cita.estado !== "cancelada") {
    const citaExistente = await repo.findByMedicoYFecha(
      cita.medico_id,
      cita.fecha_hora,
    );

    if (citaExistente) {
      throw new HttpError(
        409,
        "El médico ya tiene una cita programada o atendida en esa fecha y hora",
      );
    }
  }

  return repo.create(cita);
}

module.exports = { listar, obtener, crear };
