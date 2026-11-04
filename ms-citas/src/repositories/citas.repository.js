// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Gestiona el almacenamiento y consulta de las citas médicas.
// =====================================================================

const pool = require("../db");

// Convierte una fila de MySQL al formato utilizado por la API.
function mapearCita(fila) {
  if (!fila) return null;

  return {
    id: fila.id,
    paciente_id: fila.paciente_id,
    medico_id: fila.medico_id,
    fecha_hora: fila.fecha_hora.replace(" ", "T").slice(0, 16),
    sede: fila.sede,
    estado: fila.estado,
  };
}

// Convierte la fecha de la API al formato DATETIME de MySQL.
function fechaParaMySQL(fechaHora) {
  return fechaHora.replace("T", " ") + ":00";
}

// Lista las citas y permite filtrarlas por estado.
async function findAll(filtros = {}) {
  let sql = "SELECT * FROM citas";
  const valores = [];

  if (filtros.estado) {
    sql += " WHERE estado = ?";
    valores.push(filtros.estado);
  }

  sql += " ORDER BY id";

  const [filas] = await pool.execute(sql, valores);
  return filas.map(mapearCita);
}

// Busca una cita por su identificador.
async function findById(id) {
  const [filas] = await pool.execute("SELECT * FROM citas WHERE id = ?", [id]);

  return mapearCita(filas[0]);
}

// Crea una cita y devuelve el registro almacenado.
async function create(cita) {
  const sql = `
    INSERT INTO citas
      (paciente_id, medico_id, fecha_hora, sede, estado)
    VALUES (?, ?, ?, ?, ?)
  `;

  const valores = [
    cita.paciente_id,
    cita.medico_id,
    fechaParaMySQL(cita.fecha_hora),
    cita.sede,
    cita.estado,
  ];

  const [resultado] = await pool.execute(sql, valores);

  return findById(resultado.insertId);
}

// Actualiza una cita existente conservando su identificador.
async function update(id, datos) {
  const sql = `
    UPDATE citas
    SET paciente_id = ?,
        medico_id = ?,
        fecha_hora = ?,
        sede = ?,
        estado = ?
    WHERE id = ?
  `;

  const valores = [
    datos.paciente_id,
    datos.medico_id,
    fechaParaMySQL(datos.fecha_hora),
    datos.sede,
    datos.estado,
    id,
  ];

  const [resultado] = await pool.execute(sql, valores);

  if (resultado.affectedRows === 0) {
    return null;
  }

  return findById(id);
}

// Elimina una cita e indica si existía.
async function remove(id) {
  const [resultado] = await pool.execute("DELETE FROM citas WHERE id = ?", [
    id,
  ]);

  return resultado.affectedRows > 0;
}

// Busca conflictos de horario, excluyendo la cita que se edita.
async function findByMedicoYFecha(medicoId, fechaHora, excluirId = null) {
  let sql = `
    SELECT * FROM citas
    WHERE medico_id = ?
      AND fecha_hora = ?
      AND estado <> 'cancelada'
  `;

  const valores = [medicoId, fechaParaMySQL(fechaHora)];

  if (excluirId !== null) {
    sql += " AND id <> ?";
    valores.push(excluirId);
  }

  sql += " LIMIT 1";

  const [filas] = await pool.execute(sql, valores);

  return mapearCita(filas[0]);
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  findByMedicoYFecha,
};
