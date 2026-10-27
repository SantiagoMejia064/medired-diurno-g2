// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión del Taller 1: datos en memoria (se pierden al reiniciar).
// En el Taller 2 se reemplaza por MySQL SIN tocar las otras capas.
// Todas las funciones son async (devuelven promesas) para que el cambio
// a una base de datos real no obligue a modificar la capa de servicio.
// =====================================================================
const pacientes = [
  { id: 1, nombre: 'María Fernanda López', documento: '1001234567', fecha_nacimiento: '1995-04-12', eps: 'Sura', telefono: '3001234567'},
  { id: 2, nombre: 'Carlos Andrés Ramírez',documento: '1023456789', fecha_nacimiento: '1988-09-25', eps: 'Sanitas', telefono: '3109876543'},
  { id: 3, nombre: 'Laura Camila Torres', documento: '1145678901', fecha_nacimiento: '2001-01-18', eps: 'Nueva EPS', telefono: '3154567890'},
  { id: 4, nombre: 'Juan David Castillo', documento: '945678123', fecha_nacimiento: '1979-11-03', eps: 'Coosalud', telefono: '3206543210'},
  { id: 5, nombre: 'Valentina Herrera', documento: '1112345678', fecha_nacimiento: '1998-07-21', eps: 'Famisanar', telefono: '3017894562'}
];
let siguienteId = 6;

async function findAll() {
  return pacientes;
}

async function findById(id) {
  return pacientes.find((p) => p.id === id) || null;
}

async function findByDocumento(documento) {
  return pacientes.find((p) => p.documento === documento) || null;
}

async function create(paciente) {
  const nuevo = { id: siguienteId++, ...paciente };
  pacientes.push(nuevo);
  return nuevo;
}

module.exports = { findAll, findById, findByDocumento, create };
