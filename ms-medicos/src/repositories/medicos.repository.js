  // =====================================================================
 // CAPA DE ACCESO A DATOS (repositorio)
 // Administra los datos de los médicos en memoria.
 // En el Taller 2 se reemplazará por MySQL.
 // =====================================================================
// Obtener todos los médicos
const pool = require('../db');

async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM medicos';
  const condiciones = [];
  const valores = [];

  if (filtros.especialidad) {
    condiciones.push('especialidad = ?');
    valores.push(filtros.especialidad);
  }

  if (filtros.ids) {
    condiciones.push('id IN (?)');
    valores.push(filtros.ids);
  }

  if (condiciones.length > 0) {
    sql += ' WHERE ' + condiciones.join(' AND ');
  }
  const [filas] = await pool.query(sql + ' ORDER BY id', valores);

  console.log('SQL EJECUTADO:', sql);
  console.log('FILTROS:', filtros);
  console.log('MÉDICOS DEVUELTOS POR MYSQL:', filas);

  return filas;
}

// Buscar un médico por su ID
async function findById(id) {
  const [filas] = await pool.query(
    'SELECT * FROM medicos WHERE id = ?',
    [id]
  );
  return filas.length > 0 ? filas[0] : null;
}

// Buscar un médico por su registro médico
async function findByRegistroMedico(registro_medico) {
  const [filas] = await pool.query(
    'SELECT * FROM medicos WHERE registro_medico = ?',
    [registro_medico]
  );
  return filas.length > 0 ? filas[0] : null;
}

// Crear un nuevo médico
async function create(medico) {
  const [resultado] = await pool.query(
    `INSERT INTO medicos
     (nombre, registro_medico, especialidad, sede)
     VALUES (?, ?, ?, ?)`,
    [
      medico.nombre,
      medico.registro_medico,
      medico.especialidad,
      medico.sede
    ]
  );
  const nuevo = await findById(resultado.insertId);
  return nuevo;
}

async function update(id, medico) {
  const [resultado] = await pool.query(
    `UPDATE medicos
     SET nombre = ?, registro_medico = ?, especialidad = ?, sede = ?
     WHERE id = ?`,
    [
      medico.nombre,
      medico.registro_medico,
      medico.especialidad,
      medico.sede,
      id
    ]
  );
  if (resultado.affectedRows === 0) return null;
  return findById(id);
}

async function remove(id) {
  const [resultado] = await pool.query(
    'DELETE FROM medicos WHERE id = ?',
    [id]
  );
  return resultado.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  findByRegistroMedico,
  create,
  update,
  remove
};
