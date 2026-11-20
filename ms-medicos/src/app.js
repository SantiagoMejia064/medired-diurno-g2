// =====================================================================
// Configuración de la aplicación Express.
// Aquí se registran los middlewares, las rutas y el manejo de errores.
// =====================================================================
const express = require('express');
const medicosRoutes = require('./routes/medicos.routes');

const app = express();

// Middleware: convierte el cuerpo JSON de la petición en un objeto (req.body)
app.use(express.json());

// Registra la solicitud al finalizar e identifica los medicos involucrados.
app.use((req, res, next) => {
  const inicio = Date.now();
  const jsonOriginal = res.json.bind(res);
  let idsRespuesta = [];

  function obtenerIds(datos) {
    if (Array.isArray(datos)) {
      return datos
        .map((medico) => medico?.id)
        .filter((id) => id !== undefined && id !== null);
    }

    if (datos && typeof datos === 'object' && datos.id !== undefined && datos.id !== null) {
      return [datos.id];
    }

    return [];
  }

  res.json = function (datos) {
    if (req.originalUrl.startsWith('/medicos')) {
      idsRespuesta = obtenerIds(datos);
    }

    return jsonOriginal(datos);
  };

  res.on('finish', () => {
    const duracion = Date.now() - inicio;
    const metodo = req.method;
    const ruta = req.originalUrl;
    const estado = res.statusCode;
    let detalle = '';

    if (metodo === 'GET' && idsRespuesta.length > 0) {
      detalle = ` | IDs: ${idsRespuesta.join(', ')}`;
    }

    if (metodo === 'POST' && estado === 201) {
      const id = idsRespuesta[0];
      if (id !== undefined) detalle = ` | ID creado: ${id}`;
    }

    if (metodo === 'PUT') {
      const id = req.originalUrl.match(/^\/medicos\/(\d+)$/)?.[1];
      if (id) detalle = ` | ID actualizado: ${id}`;
    }

    if (metodo === 'DELETE') {
      const id = req.originalUrl.match(/^\/medicos\/(\d+)$/)?.[1];
      if (id) detalle = ` | ID eliminado: ${id}`;
    }

    console.log(`[ms-medicos] ${metodo} ${ruta} - HTTP ${estado}${detalle} - ${duracion}ms`);
  });

  next();
});

// Endpoint de salud: permite verificar que el microservicio está vivo
app.get('/health', (req, res) => {
  res.json({ servicio: 'ms-medicos', estado: 'ok' });
});

// Rutas del recurso. Todas las URIs de este microservicio empiezan por /medicos
app.use('/medicos', medicosRoutes);

// Cualquier otra ruta: 404 Not Found
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Manejo centralizado de errores (los lanza la capa de servicio)
app.use((err, req, res, next) => {
  // JSON mal formado en el cuerpo de la petición
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: err.message, detalles: err.detalles });
});

module.exports = app;
