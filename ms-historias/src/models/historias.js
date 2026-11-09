// =====================================================================
// CAPA DE MODELO (entidad)
// Define qué campos tiene una historia y qué reglas deben cumplir.
// No sabe nada de HTTP ni de bases de datos.
// =====================================================================

// Devuelve una lista de errores de validación (vacía si todo está bien)
function validarHistoria(datos) {
  const errores = [];
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return ['Se esperaba un objeto JSON con los datos de la historia'];
  }
  if (!Number.isInteger(datos.paciente_id) || datos.paciente_id <= 0) {
    errores.push('paciente_id es obligatorio y debe ser un entero positivo');
  }
  if (!Number.isInteger(datos.medico_id) || datos.medico_id <= 0) {
    errores.push('medico_id es obligatorio y debe ser un entero positivo');
  }
  if (typeof datos.fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha)) {
    errores.push('fecha es obligatoria y debe tener el formato YYYY-MM-DD');
  } else {
    const fecha = new Date(`${datos.fecha}T00:00:00.000Z`);
    if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== datos.fecha) {
      errores.push('fecha debe ser una fecha válida');
    }
  }
  for (const campo of ['motivo_consulta', 'diagnostico', 'tratamiento']) {
    if (typeof datos[campo] !== 'string' || datos[campo].trim() === '') {
      errores.push(`${campo} es obligatorio y debe ser un texto no vacío`);
    }
  }
  return errores;
}

// Construye una historia solo con los campos permitidos; el repositorio asigna el id.
function construirHistoria(datos) {
  return {
    paciente_id: datos.paciente_id,
    medico_id: datos.medico_id,
    fecha: datos.fecha,
    motivo_consulta: datos.motivo_consulta.trim(),
    diagnostico: datos.diagnostico.trim(),
    tratamiento: datos.tratamiento.trim(),
  };
}

module.exports = { validarHistoria, construirHistoria };
