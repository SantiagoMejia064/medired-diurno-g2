// =====================================================================
// CAPA DE ACCESO A DATOS (REPOSITORIO)
// Microservicio: ms-pacientes
// Tabla: pacientes
// =====================================================================

const pool = require('../db');

// Consultar todos los pacientes
async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM pacientes';
  const condiciones = [];
  const valores = [];

  if (filtros.eps) {
    condiciones.push('eps = ?');
    valores.push(filtros.eps);
  }

  if (filtros.ids) {
    if (filtros.ids.length === 0) return [];

    const marcadores = filtros.ids.map(() => '?').join(', ');
    condiciones.push(`id IN (${marcadores})`);
    valores.push(...filtros.ids);
  }

  if (condiciones.length > 0) {
    sql += ' WHERE ' + condiciones.join(' AND ');
  }

  const [filas] = await pool.query(sql + ' ORDER BY id', valores);
  return filas;
}

// Buscar un paciente por ID
async function findById(id) {
  const [filas] = await pool.query(
    'SELECT * FROM pacientes WHERE id = ?',
    [id]
  );

  return filas.length > 0 ? filas[0] : null;
}

// Buscar un paciente por documento
async function findByDocumento(documento) {
  const [filas] = await pool.query(
    'SELECT * FROM pacientes WHERE documento = ?',
    [documento]
  );

  return filas.length > 0 ? filas[0] : null;
}

// Registrar un paciente
async function create(paciente) {
  const [resultado] = await pool.query(
    `INSERT INTO pacientes
     (nombre, documento, fecha_nacimiento, eps, telefono)
     VALUES (?, ?, ?, ?, ?)`,
    [
      paciente.nombre,
      paciente.documento,
      paciente.fecha_nacimiento,
      paciente.eps,
      paciente.telefono
    ]
  );

  return findById(resultado.insertId);
}

// Actualizar un paciente
async function update(id, paciente) {
  const [resultado] = await pool.query(
    `UPDATE pacientes
     SET nombre = ?, documento = ?, fecha_nacimiento = ?,
         eps = ?, telefono = ?
     WHERE id = ?`,
    [
      paciente.nombre,
      paciente.documento,
      paciente.fecha_nacimiento,
      paciente.eps,
      paciente.telefono,
      id
    ]
  );

  if (resultado.affectedRows === 0) return null;

  return findById(id);
}

// Eliminar un paciente
async function remove(id) {
  const [resultado] = await pool.query(
    'DELETE FROM pacientes WHERE id = ?',
    [id]
  );

  return resultado.affectedRows > 0;
}

// Exportar funciones
module.exports = {
  findAll,
  findById,
  findByDocumento,
  create,
  update,
  remove
};
