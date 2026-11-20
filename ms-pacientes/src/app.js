
// =====================================================================
// Configuración de la aplicación Express.
// Aquí se registran los middlewares, las rutas y el manejo de errores.
// =====================================================================

const express = require('express');
const pacientesRoutes = require('./routes/pacientes.routes');

const app = express();

// Middleware: convierte el cuerpo JSON de la petición en un objeto
app.use(express.json());

// =====================================================================
// REGISTRO DE PETICIONES HTTP
// Muestra método, ruta, código de respuesta e IDs de pacientes.
// =====================================================================

app.use((req, res, next) => {

  res.on('finish', () => {
    const metodo = req.method;
    const ruta = req.originalUrl;
    const estado = res.statusCode;

    let detalle = '';

    // GET: mostrar los IDs de los pacientes consultados
    if (
      metodo === 'GET' &&
      estado === 200 &&
      Array.isArray(res.locals.idsPacientes)
    ) {
      const ids = res.locals.idsPacientes;

      detalle = ids.length > 0
        ? ` | IDs consultados: ${ids.join(', ')}`
        : ' | Sin pacientes encontrados';
    }

    // POST: mostrar el ID del paciente creado
    if (
      metodo === 'POST' &&
      estado === 201 &&
      res.locals.pacienteId != null
    ) {
      detalle = ` | ID creado: ${res.locals.pacienteId}`;
    }

    // PUT: mostrar el ID del paciente actualizado
    if (
      metodo === 'PUT' &&
      estado === 200 &&
      res.locals.pacienteId != null
    ) {
      detalle = ` | ID actualizado: ${res.locals.pacienteId}`;
    }

    // DELETE: mostrar el ID del paciente eliminado
    if (
      metodo === 'DELETE' &&
      estado === 204 &&
      res.locals.pacienteId != null
    ) {
      detalle = ` | ID eliminado: ${res.locals.pacienteId}`;
    }

    console.log(`${metodo} ${ruta} → ${estado}${detalle}`);
  });

  next();
});

// =====================================================================
// ENDPOINT DE SALUD
// =====================================================================

app.get('/health', (req, res) => {
  res.json({
    servicio: 'ms-pacientes',
    estado: 'ok'
  });
});

// =====================================================================
// RUTAS DE PACIENTES
// =====================================================================

app.use('/pacientes', pacientesRoutes);

// =====================================================================
// RUTA NO ENCONTRADA
// =====================================================================

app.use((req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// =====================================================================
// MANEJO CENTRALIZADO DE ERRORES
// =====================================================================

app.use((err, req, res, next) => {

  // JSON mal formado
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
