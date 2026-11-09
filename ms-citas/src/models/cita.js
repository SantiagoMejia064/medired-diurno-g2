
 // =====================================================================
 // CAPA DE MODELO (entidad)
 // Define los atributos de una cita médica y sus validaciones.
 // No sabe nada de HTTP ni de bases de datos.
 // =====================================================================

 const ESTADOS_VALIDOS = ['programada', 'atendida', 'cancelada'];
 const SEDES_VALIDAS = ['Bogotá', 'Cali', 'Medellín'];
 const FORMATO_FECHA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

 // Devuelve una lista de errores de validación
 function validarCita(datos) {
  const errores = [];

  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return ['Se esperaba un objeto JSON con los datos de la cita'];
  }

  // Validar paciente
  if (!Number.isInteger(datos.paciente_id) || datos.paciente_id <= 0) {
    errores.push('paciente_id debe ser un entero positivo');
  }

  // Validar médico
  if (!Number.isInteger(datos.medico_id) || datos.medico_id <= 0) {
   errores.push('medico_id debe ser un entero positivo');
  }

  // Validar fecha y hora
  if (
    typeof datos.fecha_hora !== 'string' ||
    !FORMATO_FECHA_HORA.test(datos.fecha_hora) ||
    Number.isNaN(Date.parse(datos.fecha_hora))
  ) {
    errores.push(
      'fecha_hora debe tener el formato AAAA-MM-DDTHH:mm, por ejemplo 2026-11-03T09:00 (3 de noviembre de 2026 a las 9:00 a. m.)'
    );
  }

   // Validar sede
   if (!SEDES_VALIDAS.includes(datos.sede)) {
     errores.push(`sede debe ser una de: ${SEDES_VALIDAS.join(', ')}`);
   }

   // Validar estado
   if (datos.estado !== undefined && !ESTADOS_VALIDOS.includes(datos.estado)) {
     errores.push(`estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);
   }

   return errores;
 }

 // Construye una cita solo con los atributos permitidos
 function construirCita(datos) {
   return {
     paciente_id: datos.paciente_id,
     medico_id: datos.medico_id,
     fecha_hora: datos.fecha_hora,
     sede: datos.sede,
     estado: datos.estado === undefined ? 'programada' : datos.estado,
   };
 }

 module.exports = { validarCita, construirCita };