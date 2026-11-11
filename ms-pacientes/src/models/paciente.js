// =====================================================================
// CAPA DE MODELO (entidad)
// Define qué campos tiene un Paciente y qué reglas deben cumplir.
// No sabe nada de HTTP ni de bases de datos.
//
// Versión del Taller 1: todavía sin contraseña. La contraseña cifrada
// y el inicio de sesión se agregan en la versión completa (Taller 3).
// =====================================================================

// Los roles válidos vienen del archivo .env (cada empresa tiene los suyos)
function rolesValidos() {
  return (process.env.ROLES || 'admisiones')
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r !== '');
}

const DOCUMENTO_VALIDO = /^\d{6,10}$/;
const TELEFONO_VALIDO = /^\d{10}$/;

// Valida el formato AAAA-MM-DD, que la fecha exista
// y que no sea una fecha futura.
function fechaValida(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }

  const [año, mes, dia] = fecha.split('-').map(Number);
  const fechaObjeto = new Date(`${fecha}T00:00:00Z`);
  const hoy = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');

  return (
    fechaObjeto.getUTCFullYear() === año &&
    fechaObjeto.getUTCMonth() + 1 === mes &&
    fechaObjeto.getUTCDate() === dia &&
    fechaObjeto <= hoy
  );
}

// Devuelve una lista de errores de validación.
function validarPaciente(datos) {
  const errores = [];

  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return ['Se esperaba un objeto JSON con los datos del paciente'];
  }

  if (typeof datos.nombre !== 'string' || datos.nombre.trim() === '') {
    errores.push('nombre es obligatorio');
  }

  if (
    typeof datos.documento !== 'string' ||
    !DOCUMENTO_VALIDO.test(datos.documento.trim())
  ) {
    errores.push('documento es obligatorio y debe contener entre 6 y 15 dígitos');
  }

  if (!fechaValida(datos.fecha_nacimiento)) {
    errores.push('fecha_nacimiento debe tener el formato AAAA-MM-DD, ser una fecha válida y no ser futura');
  }

  if (typeof datos.eps !== 'string' || datos.eps.trim() === '') {
    errores.push('eps es obligatoria');
  }

  if (
    typeof datos.telefono !== 'string' ||
    !TELEFONO_VALIDO.test(datos.telefono.trim())
  ) {
    errores.push('telefono es obligatorio y debe contener exactamente 10 dígitos numéricos');
  }

  return errores;
}

// Construye un paciente limpio solo con los campos permitidos.
function construirPaciente(datos) {
  return {
    nombre: datos.nombre.trim(),
    documento: datos.documento.trim(),
    fecha_nacimiento: datos.fecha_nacimiento,
    eps: datos.eps.trim(),
    telefono: datos.telefono.trim(),
  };
}

module.exports = { validarPaciente, construirPaciente };
