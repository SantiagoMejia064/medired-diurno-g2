  // =====================================================================
 // CAPA DE MODELO (entidad)
 // Define los atributos de un médico y sus validaciones.
 // No conoce HTTP ni la base de datos.
 // =====================================================================

const SEDES_VALIDAS = ['Bogotá', 'Cali', 'Medellín'];

// Valida los datos recibidos para registrar un médico
function validarMedico(datos) {
  const errores = [];

  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return ['Se esperaba un objeto JSON con los datos del médico'];
  }

  if (typeof datos.nombre !== 'string' || datos.nombre.trim() === '') {
    errores.push('nombre es obligatorio');
  }

  if (typeof datos.registro_medico !== 'string' ||
      datos.registro_medico.trim() === '') {
    errores.push('registro_medico es obligatorio');
  }

  if (typeof datos.especialidad !== 'string' ||
      datos.especialidad.trim() === '') {
    errores.push('especialidad es obligatoria');
  }

  if (!SEDES_VALIDAS.includes(datos.sede)) {
    errores.push(`sede debe ser una de: ${SEDES_VALIDAS.join(', ')}`);
  }

  return errores;
}

// Construye un médico solo con los campos permitidos
function construirMedico(datos) {
  return {
    nombre: datos.nombre.trim(),
    registro_medico: datos.registro_medico.trim(),
    especialidad: datos.especialidad.trim(),
    sede: datos.sede
  };
}

module.exports = { validarMedico, construirMedico };
