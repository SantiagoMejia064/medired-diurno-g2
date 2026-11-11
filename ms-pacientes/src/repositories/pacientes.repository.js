
 // =====================================================================
 // CAPA DE ACCESO A DATOS (REPOSITORIO)
 // Microservicio: ms-pacientes
 // Base de datos: pacientes_db
 // Tabla: pacientes
 //
 // Esta capa se encarga de ejecutar las consultas SQL en MariaDB.
 // =====================================================================

const pool = require('../db');

// =====================================================================
// CONVERTIR FILA DE LA BASE DE DATOS A OBJETO PACIENTE
// =====================================================================

function aPaciente(fila) {
  if (!fila) return null;

  return {
    id: fila.id,
    nombre: fila.nombre,
    documento: fila.documento,
    fecha_nacimiento: fila.fecha_nacimiento,
    eps: fila.eps,
    telefono: fila.telefono
  };
}

// =====================================================================
// CONSULTAR TODOS LOS PACIENTES
// Permite filtrar por EPS y por IDs.
// =====================================================================

async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM pacientes';

  const condiciones = [];
  const valores = [];

  // Filtrar pacientes por EPS
  if (filtros.eps) {
    condiciones.push('eps = ?');
    valores.push(filtros.eps);
  }

  // Filtrar pacientes por una lista de IDs
  if (filtros.ids) {
    if (filtros.ids.length === 0) {
      return [];
    }

    const marcadores = filtros.ids.map(() => '?').join(', ');

    condiciones.push(`id IN (${marcadores})`);
    valores.push(...filtros.ids);
  }

  // Agregar condiciones a la consulta
  if (condiciones.length > 0) {
    sql += ' WHERE ' + condiciones.join(' AND ');
  }

  sql += ' ORDER BY id';

  const [filas] = await pool.query(sql, valores);

  return filas.map(aPaciente);
}

// =====================================================================
// BUSCAR UN PACIENTE POR ID
// =====================================================================

async function findById(id) {
  const [filas] = await pool.query(
    'SELECT * FROM pacientes WHERE id = ?',
    [id]
  );

  if (filas.length === 0) {
    return null;
  }

  return aPaciente(filas[0]);
}

// =====================================================================
// BUSCAR UN PACIENTE POR DOCUMENTO
// =====================================================================

async function findByDocumento(documento) {
  const [filas] = await pool.query(
    'SELECT * FROM pacientes WHERE documento = ?',
    [documento]
  );

  if (filas.length === 0) {
    return null;
  }

  return aPaciente(filas[0]);
}

// =====================================================================
// REGISTRAR UN PACIENTE
// =====================================================================

async function create(paciente) {
  try {
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

    return await findById(resultado.insertId);

  } catch (error) {

    // Verificar si el documento ya está registrado
    if (error.code === 'ER_DUP_ENTRY') {
      const duplicado = new Error(
        'Ya existe un paciente registrado con ese número de documento.'
      );

      duplicado.statusCode = 409;
      throw duplicado;
    }

    throw error;
  }
}

// =====================================================================
// ACTUALIZAR UN PACIENTE
// =====================================================================

async function update(id, paciente) {

  // Verificar si el paciente existe
  const existente = await findById(id);

  if (!existente) {
    const error = new Error(
      `No se puede actualizar el paciente porque no existe un registro con el ID ${id}.`
    );

    error.statusCode = 404;
    throw error;
  }

  try {
    await pool.query(
      `UPDATE pacientes
       SET nombre = ?,
           documento = ?,
           fecha_nacimiento = ?,
           eps = ?,
           telefono = ?
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

    return await findById(id);

  } catch (error) {

    // Verificar si el documento pertenece a otro paciente
    if (error.code === 'ER_DUP_ENTRY') {
      const duplicado = new Error(
        'No se puede actualizar el paciente porque ese documento ya pertenece a otro paciente.'
      );

      duplicado.statusCode = 409;
      throw duplicado;
    }

    throw error;
  }
}

// =====================================================================
// ELIMINAR UN PACIENTE
// =====================================================================

async function remove(id) {
  const [resultado] = await pool.query(
    'DELETE FROM pacientes WHERE id = ?',
    [id]
  );

  // Verificar si se eliminó algún registro
  if (resultado.affectedRows === 0) {
    const error = new Error(
      `No se puede eliminar el paciente porque no existe un registro con el ID ${id}.`
    );

    error.statusCode = 404;
    throw error;
  }

  return true;
}

// =====================================================================
// EXPORTAR FUNCIONES DEL REPOSITORIO
// =====================================================================

module.exports = {
  findAll,
  findById,
  findByDocumento,
  create,
  update,
  remove
};
