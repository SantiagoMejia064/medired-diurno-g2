// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión del Taller 1: datos en memoria (se pierden al reiniciar).
// En el Taller 2 se reemplaza por MySQL SIN tocar las otras capas.
// Todas las funciones son async (devuelven promesas) para que el cambio
// a una base de datos real no obligue a modificar la capa de servicio.
// =====================================================================
const citas = [
  {
    id: 1,
    paciente_id: 1,
    medico_id: 2,
    fecha_hora: "2026-11-03T09:00",
    sede: "Cali",
    estado: "programada",
  },
  {
    id: 2,
    paciente_id: 2,
    medico_id: 1,
    fecha_hora: "2026-11-03T10:30",
    sede: "Bogotá",
    estado: "programada",
  },
  {
    id: 3,
    paciente_id: 3,
    medico_id: 3,
    fecha_hora: "2026-11-04T14:00",
    sede: "Medellín",
    estado: "atendida",
  },
];

let siguienteId = 4;

async function findAll() {
  return citas;
}

async function findById(id) {
  return citas.find((cita) => cita.id === id) || null;
}

async function create(cita) {
  const nueva = { id: siguienteId++, ...cita };
  citas.push(nueva);
  return nueva;
}

async function findByMedicoYFecha(medicoId, fechaHora) {
  return citas.find((cita) =>
    cita.medico_id === medicoId &&
    cita.fecha_hora === fechaHora &&
    cita.estado !== 'cancelada'
  ) || null;
}

module.exports = { findAll, findById, create, findByMedicoYFecha };
