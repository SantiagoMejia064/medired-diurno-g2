const HttpError = require('../utils/http-error');
const PACIENTES_URL = process.env.PACIENTES_URL;

async function pedir(ruta, token) {
  try {
    console.log(`[Historias → Pacientes] GET ${ruta}`);
    
    return await fetch(`${PACIENTES_URL}${ruta}`, {
      headers: { Authorization: token },
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    return null;
  }
}

async function existePaciente(id, token) {
  const respuesta = await pedir(`/pacientes/${id}`, token);

  if (!respuesta) {
    throw new HttpError(503, 'ms-pacientes no está disponible');
  }

  if (respuesta.status === 404) {
    return false;
  }

  if (!respuesta.ok) {
    throw new HttpError(502, `ms-pacientes respondió ${respuesta.status}`);
  }

  return true;
}

async function pacientesPorIds(ids, token) {
  if (ids.length === 0) return new Map();

  const respuesta = await pedir(`/pacientes?ids=${ids.join(',')}`, token);
  if (!respuesta || !respuesta.ok) return null;

  try {
    const pacientes = await respuesta.json();
    if (!Array.isArray(pacientes)) return null;

    return new Map(
      pacientes.map(({ id, nombre }) => [id, { id, nombre }])
    );
  } catch {
    return null;
  }
}

module.exports = { existePaciente, pacientesPorIds };