  // =====================================================================
 // CAPA DE ACCESO A DATOS (repositorio)
 // Administra los datos de los médicos en memoria.
 // En el Taller 2 se reemplazará por MySQL.
 // =====================================================================

// Médicos ficticios registrados inicialmente
const medicos = [
  {
    id: 1,
    nombre: 'Carlos Ramírez',
    registro_medico: 'RM-001',
    especialidad: 'Cardiología',
    sede: 'Cali'
  },
  {
    id: 2,
    nombre: 'Laura Gómez',
    registro_medico: 'RM-002',
    especialidad: 'Pediatría',
    sede: 'Bogotá'
  },
  {
    id: 3,
    nombre: 'Andrés Castillo',
    registro_medico: 'RM-003',
    especialidad: 'Neurología',
    sede: 'Medellín'
  }
];

let siguienteId = 4;

// Obtener todos los médicos
async function findAll(filtros = {}) {
  return medicos.filter((m) =>
    (!filtros.ids || filtros.ids.includes(m.id))
  );
}

// Buscar un médico por su ID
async function findById(id) {
  return medicos.find((m) => m.id === id) || null;
}

// Buscar un médico por su registro médico
async function findByRegistroMedico(registro_medico) {
  return medicos.find(
    (m) => m.registro_medico === registro_medico
  ) || null;
}

// Crear un nuevo médico
async function create(medico) {
  const nuevo = { id: siguienteId++, ...medico };
  medicos.push(nuevo);
  return nuevo;
}

async function update(id, medico) {
  const posicion = medicos.findIndex((m) => m.id === id);
  if (posicion === -1) return null;

  medicos[posicion] = { id, ...medico };
  return medicos[posicion];
}

async function remove(id) {
  const posicion = medicos.findIndex((m) => m.id === id);
  if (posicion === -1) return false;

  medicos.splice(posicion, 1);
  return true;
}

module.exports = {
  findAll,
  findById,
  findByRegistroMedico,
  create,
  update,
  remove
};
