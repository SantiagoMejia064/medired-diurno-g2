// =====================================================================
// CAPA DE MODELO (entidad)
// Define los atributos de una cita médica y sus validaciones.
// No sabe nada de HTTP ni de bases de datos.
// =====================================================================

const ESTADOS_VALIDOS = ["programada", "atendida", "cancelada"];
const SEDES_VALIDAS = ["Bogotá", "Cali", "Medellín"];
const FORMATO_FECHA_HORA = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

// Convierte una fecha válida del contrato a un objeto Date.
// Devuelve null si el formato o la fecha son incorrectos.
function interpretarFechaHora(valor) {
  if (typeof valor !== "string") return null;

  const partes = FORMATO_FECHA_HORA.exec(valor);
  if (!partes) return null;

  const [anio, mes, dia, hora, minuto] = partes.slice(1).map(Number);

  const fecha = new Date(anio, mes - 1, dia, hora, minuto);

  // Evitar que JavaScript normalice fechas inexistentes.
  if (
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia ||
    fecha.getHours() !== hora ||
    fecha.getMinutes() !== minuto
  ) {
    return null;
  }

  return fecha;
}

// Devuelve una lista de errores de validación.
function validarCita(datos) {
  const errores = [];

  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return ["Se esperaba un objeto JSON con los datos de la cita"];
  }

  // Validar paciente
  if (!Number.isInteger(datos.paciente_id) || datos.paciente_id <= 0) {
    errores.push("paciente_id debe ser un entero positivo");
  }

  // Validar médico
  if (!Number.isInteger(datos.medico_id) || datos.medico_id <= 0) {
    errores.push("medico_id debe ser un entero positivo");
  }

  // Validar fecha y hora
  const fecha = interpretarFechaHora(datos.fecha_hora);

  if (!fecha) {
    errores.push(
      "fecha_hora debe tener el formato AAAA-MM-DDTHH:mm y ser una fecha válida",
    );
  } else if (fecha.getTime() <= Date.now()) {
    errores.push("fecha_hora debe ser una fecha y hora futura");
  }

  // Validar sede
  if (!SEDES_VALIDAS.includes(datos.sede)) {
    errores.push(`sede debe ser una de: ${SEDES_VALIDAS.join(", ")}`);
  }

  // Validar estado
  if (datos.estado !== undefined && !ESTADOS_VALIDOS.includes(datos.estado)) {
    errores.push(`estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`);
  }

  return errores;
}

// Construye una cita solo con los atributos permitidos.
function construirCita(datos) {
  return {
    paciente_id: datos.paciente_id,
    medico_id: datos.medico_id,
    fecha_hora: datos.fecha_hora,
    sede: datos.sede,
    estado: datos.estado === undefined ? "programada" : datos.estado,
  };
}

module.exports = { validarCita, construirCita };
