const HttpError = require("../utils/http-error");

const MEDICOS_URL = process.env.MEDICOS_URL;

// Realiza peticiones HTTP a ms-medicos.
// Reenvía el JWT y establece un tiempo máximo de 3 segundos.
async function pedir(ruta, token) {
  try {
    return await fetch(`${MEDICOS_URL}${ruta}`, {
      headers: {
        Authorization: token,
      },
      signal: AbortSignal.timeout(3000),
    });
  } catch (error) {
    // El microservicio no respondió o se agotó el tiempo.
    return null;
  }
}

// VALIDACIÓN: comprueba si un médico existe por su ID.
async function existeMedico(id, token) {
  const respuesta = await pedir(`/medicos/${id}`, token);

  // El microservicio no está disponible.
  if (!respuesta) {
    throw new HttpError(503, "ms-medicos no está disponible");
  }

  // El médico no existe.
  if (respuesta.status === 404) {
    return false;
  }

  // El microservicio respondió con otro error.
  if (!respuesta.ok) {
    throw new HttpError(502, `ms-medicos respondió ${respuesta.status}`);
  }

  return true;
}

// COMPOSICIÓN: consulta varios médicos en una sola petición.
// Devuelve un Map que relaciona cada médico con su ID.
async function medicosPorIds(ids, token) {
  if (ids.length === 0) {
    return new Map();
  }

  const respuesta = await pedir(`/medicos?ids=${ids.join(",")}`, token);

  // Permite continuar si ms-medicos no responde.
  if (!respuesta || !respuesta.ok) {
    return null;
  }

  try {
    const medicos = await respuesta.json();

    return new Map(
      medicos.map((medico) => [
        medico.id,
        {
          id: medico.id,
          nombre: medico.nombre,
          especialidad: medico.especialidad,
          sede: medico.sede,
        },
      ]),
    );
  } catch (error) {
    // Respuesta inválida del microservicio externo.
    return null;
  }
}

module.exports = {
  existeMedico,
  medicosPorIds,
};
