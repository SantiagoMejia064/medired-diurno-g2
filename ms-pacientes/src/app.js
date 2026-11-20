
// =====================================================================
// Configuración de la aplicación Express.
// Aquí se registran los middlewares, las rutas y el manejo de errores.
// =====================================================================
const express = require('express');
const pacientesRoutes = require('./routes/pacientes.routes');

const app = express();

// Middleware: convierte el cuerpo JSON en un objeto
app.use(express.json());

// =====================================================================
// REGISTRO DE PETICIONES HTTP
// Muestra método, ruta y código de respuesta.
// =====================================================================
app.use((req, res, next) => {
  res.on('finish', () => {
    const metodo = req.method;
    const ruta = req.originalUrl;
    const estado = res.statusCode;

    let detalle = '';

    // Mostrar el ID del paciente creado mediante POST
    if (
      metodo === 'POST' &&
      req.path === '/pacientes' &&
      estado === 201
    ) {
      const location = res.getHeader('Location');

      if (location) {
        const id = String(location).split('?')[0].split('/').pop();

        if (/^\d+$/.test(id)) {
          detalle = ` | ID creado: ${id}`;
        }
      }
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
