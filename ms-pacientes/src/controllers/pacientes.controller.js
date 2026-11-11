
// =====================================================================
// CAPA DE PRESENTACIÓN (controlador)
// Traduce HTTP <-> servicio.
// Lee los datos de la petición y construye las respuestas HTTP.
// =====================================================================

const service = require('../services/pacientes.service');
const HttpError = require('../utils/http-error');

// =====================================================================
// VALIDAR ID
// =====================================================================

function leerId(req) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'El id debe ser un entero positivo');
  }

  return id;
}

// =====================================================================
// LISTAR PACIENTES
// GET /pacientes
// GET /pacientes?eps=Sanitas
// GET /pacientes?ids=1,3
// =====================================================================

async function listar(req, res) {
  const filtros = {
    eps: req.query.eps
  };

  if (req.query.ids) {
    filtros.ids = String(req.query.ids).split(',').map(Number);

    if (
      filtros.ids.some(
        (id) => !Number.isInteger(id) || id <= 0
      )
    ) {
      throw new HttpError(
        400,
        'ids debe ser una lista de enteros positivos separados por comas'
      );
    }
  }

  const pacientes = await service.listar(filtros);

  return res.status(200).json(pacientes);
}

// =====================================================================
// OBTENER PACIENTE POR ID
// GET /pacientes/:id
// =====================================================================

async function obtener(req, res) {
  const paciente = await service.obtener(leerId(req));

  return res.status(200).json(paciente);
}

// =====================================================================
// CREAR PACIENTE
// POST /pacientes
// =====================================================================

async function crear(req, res) {
  const nuevo = await service.crear(req.body);

  return res
    .status(201)
    .location(`${req.baseUrl}/${nuevo.id}`)
    .json(nuevo);
}

// =====================================================================
// ACTUALIZAR PACIENTE
// PUT /pacientes/:id
// =====================================================================

async function actualizar(req, res) {
  const actualizado = await service.actualizar(
    leerId(req),
    req.body
  );

  return res.status(200).json(actualizado);
}

// =====================================================================
// ELIMINAR PACIENTE
// DELETE /pacientes/:id
// =====================================================================

async function eliminar(req, res) {
  await service.eliminar(leerId(req));

  return res.status(204).end();
}

// =====================================================================
// MANEJAR ERRORES ASÍNCRONOS
// Compatible con Express 4 y Express 5.
// =====================================================================

function manejarAsync(funcion) {
  return (req, res, next) => {
    Promise.resolve(funcion(req, res, next)).catch(next);
  };
}

// =====================================================================
// EXPORTAR CONTROLADORES
// =====================================================================

module.exports = {
  listar: manejarAsync(listar),
  obtener: manejarAsync(obtener),
  crear: manejarAsync(crear),
  actualizar: manejarAsync(actualizar),
  eliminar: manejarAsync(eliminar)
};
