const HttpError = require("../utils/http-error");

const PACIENTES_URL = process.env.PACIENTES_URL;

// Realiza una petición HTTP a ms-pacientes.
// Reenvía el token JWT y limita la espera a 3 segundos.
async function pedir(ruta, token) {
  try {
    return await fetch(`${PACIENTES_URL}${ruta}`, {
      headers: {
        Authorization: token,
      },
      signal: AbortSignal.timeout(3000),
    });
  } catch (error) {
    // Si el microservicio no responde, devuelve null.
    return null;
  }
}

// VALIDADCIÓN: comprueba si un paciente existe por su ID.
async function existePaciente(id, token) {
  const respuesta = await pedir(`/pacientes/${id}`, token);

  // El microservicio no está disponible.
  if (!respuesta) {
    throw new HttpError(503, "ms-pacientes no está disponible");
  }

  // El paciente no existe.
  if (respuesta.status === 404) {
    return false;
  }

  // El microservicio respondió con otro error.
  if (!respuesta.ok) {
    throw new HttpError(502, `ms-pacientes respondió ${respuesta.status}`);
  }

  return true;
}

// COMPOSICIÓN: consulta varios pacientes en una sola petición.
// Devuelve un Map para relacionar cada paciente con su ID.
async function pacientesPorIds(ids, token) {
  if (ids.length === 0) {
    return new Map();
  }

  const respuesta = await pedir(`/pacientes?ids=${ids.join(",")}`, token);

  // Permite continuar si ms-pacientes no responde.
  if (!respuesta || !respuesta.ok) {
    return null;
  }

  try {
    const pacientes = await respuesta.json();

    return new Map(
      pacientes.map((paciente) => [
        paciente.id,
        {
          id: paciente.id,
          nombre: paciente.nombre,
          documento: paciente.documento,
          eps: paciente.eps,
        },
      ]),
    );
  } catch (error) {
    // Respuesta inválida del microservicio externo.
    return null;
  }
}

module.exports = {
  existePaciente,
  pacientesPorIds,
};
