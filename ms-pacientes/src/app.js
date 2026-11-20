
const express = require('express');
const pacientesRoutes = require('./routes/pacientes.routes');

const app = express();

app.use(express.json());

// =====================================================
// REGISTRO DE PETICIONES Y RESPUESTAS
// =====================================================
app.use((req, res, next) => {

  const jsonOriginal = res.json.bind(res);
  let idsRespuesta = [];

  // Extraer IDs de pacientes de una respuesta
  function obtenerIds(datos) {
    if (Array.isArray(datos)) {
      return datos
        .map(p => p?.id)
        .filter(id => id !== undefined && id !== null);
    }

    if (datos && typeof datos === 'object') {

      if (datos.id !== undefined && datos.id !== null) {
        return [datos.id];
      }

      // Respuestas que envuelven el listado en una propiedad
      for (const campo of ['pacientes', 'data', 'resultados']) {
        if (Array.isArray(datos[campo])) {
          return obtenerIds(datos[campo]);
        }
      }
    }

    return [];
  }

  // Interceptar la respuesta JSON
  res.json = function (datos) {

    if (req.path.startsWith('/pacientes')) {
      idsRespuesta = obtenerIds(datos);
    }

    return jsonOriginal(datos);
  };

  // Imprimir cuando termine la petición
  res.on('finish', () => {

    const metodo = req.method;
    const ruta = req.originalUrl;
    const estado = res.statusCode;

    let detalle = '';

    // GET listado o consulta por ID
    if (metodo === 'GET' && idsRespuesta.length > 0) {
      detalle = ` | IDs: ${idsRespuesta.join(', ')}`;
    }

    // POST: paciente creado
    if (metodo === 'POST' && estado === 201) {
      let id = idsRespuesta[0];

      // Alternativa: obtener ID desde Location
      if (id === undefined) {
        const location = res.getHeader('Location');

        if (location) {
          const encontrado = String(location).match(/\/(\d+)(?:\?.*)?$/);
          if (encontrado) id = encontrado[1];
        }
      }

      if (id !== undefined) {
        detalle = ` | ID creado: ${id}`;
      }
    }

    // PUT: paciente actualizado
    if (metodo === 'PUT') {
      const id = req.path.match(/^\/pacientes\/(\d+)$/)?.[1];

      if (id) {
        detalle = ` | ID actualizado: ${id}`;
      }
    }

    // DELETE: paciente eliminado
    if (metodo === 'DELETE') {
      const id = req.path.match(/^\/pacientes\/(\d+)$/)?.[1];

      if (id) {
        detalle = ` | ID eliminado: ${id}`;
      }
    }

    console.log(`${metodo} ${ruta} → ${estado}${detalle}`);
  });

  next();
});

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({
    servicio: 'ms-pacientes',
    estado: 'ok'
  });
});

// Rutas de pacientes
app.use('/pacientes', pacientesRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Manejo centralizado de errores
app.use((err, req, res, next) => {

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'El cuerpo de la petición no es un JSON válido'
    });
  }

  const status = err.status || 500;

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({
    error: err.message,
    detalles: err.detalles
  });
});

module.exports = app;
