// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión del Taller 1: datos en memoria (se pierden al reiniciar).
// En el Taller 2 se reemplaza por MySQL SIN tocar las otras capas.
// Todas las funciones son async (devuelven promesas) para que el cambio
// a una base de datos real no obligue a modificar la capa de servicio.
// =====================================================================
const historias = [
  {
    id: 1,
    paciente_id: 1,
    medico_id: 2,
    fecha: '2026-10-27',
    motivo_consulta: 'Motivo de consulta de ejemplo',
    diagnostico: 'Diagnóstico de ejemplo',
    tratamiento: 'Tratamiento de ejemplo',
  },
  {
    id: 2,
    paciente_id: 2,
    medico_id: 1,
    fecha: '2026-10-26',
    motivo_consulta: 'Motivo de consulta de ejemplo 2',
    diagnostico: 'Diagnóstico de ejemplo 2',
    tratamiento: 'Tratamiento de ejemplo 2',
  },
  {
    id: 3,
    paciente_id: 3,
    medico_id: 2,
    fecha: '2026-10-27',
    motivo_consulta: 'Motivo de consulta de ejemplo 3',
    diagnostico: 'Diagnóstico de ejemplo 3',
    tratamiento: 'Tratamiento de ejemplo 3',
  },
];
let siguienteId = 4;

async function findAll() {
  return historias;
}

async function findById(id) {
  return historias.find((historia) => historia.id === id) || null;
}

async function create(historia) {
  const nuevo = { id: siguienteId++, ...historia };
  historias.push(nuevo);
  return nuevo;
}

module.exports = { findAll, findById, create };
