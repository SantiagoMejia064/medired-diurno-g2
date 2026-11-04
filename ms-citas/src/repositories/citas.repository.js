// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Gestiona el almacenamiento y consulta de las citas médicas.
// Taller 2: versión temporal en memoria con CRUD completo.
// Posteriormente se reemplazará el almacenamiento por MySQL.
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

// -------------------------------------------------------------
// LISTAR: obtiene todas las citas o filtra por estado.
// -------------------------------------------------------------
async function findAll(filtros = {}) {
  let resultado = citas;

  if (filtros.estado) {
    resultado = resultado.filter((cita) => cita.estado === filtros.estado);
  }

  return resultado.map((cita) => ({ ...cita }));
}

// -------------------------------------------------------------
// OBTENER: busca una cita por su identificador.
// -------------------------------------------------------------
async function findById(id) {
  const cita = citas.find((cita) => cita.id === id);
  return cita ? { ...cita } : null;
}

// -------------------------------------------------------------
// CREAR: registra una cita y genera su identificador.
// -------------------------------------------------------------
async function create(cita) {
  const nueva = { ...cita, id: siguienteId++ };
  citas.push(nueva);
  return { ...nueva };
}

// -------------------------------------------------------------
// BUSCAR CONFLICTO: verifica si un médico tiene ocupado
// un horario con una cita programada o atendida.
// excluirId permite ignorar la propia cita durante un PUT.
// -------------------------------------------------------------
async function findByMedicoYFecha(medicoId, fechaHora, excluirId = null) {
  const cita = citas.find(
    (cita) =>
      cita.medico_id === medicoId &&
      cita.fecha_hora === fechaHora &&
      (cita.estado === "programada" || cita.estado === "atendida") &&
      cita.id !== excluirId,
  );

  return cita ? { ...cita } : null;
}

// -------------------------------------------------------------
// ACTUALIZAR: reemplaza los datos de una cita existente.
// -------------------------------------------------------------
async function update(id, datos) {
  const indice = citas.findIndex((cita) => cita.id === id);

  if (indice === -1) {
    return null;
  }

  citas[indice] = { ...datos, id };

  return { ...citas[indice] };
}

// -------------------------------------------------------------
// ELIMINAR: elimina una cita por su identificador.
// -------------------------------------------------------------
async function remove(id) {
  const indice = citas.findIndex((cita) => cita.id === id);

  if (indice === -1) {
    return false;
  }

  citas.splice(indice, 1);
  return true;
}

module.exports = {
  findAll,
  findById,
  create,
  findByMedicoYFecha,
  update,
  remove,
};
