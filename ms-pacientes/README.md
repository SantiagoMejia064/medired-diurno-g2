# ms-pacientes · MediRed IPS

Microservicio REST para la gestión de pacientes de MediRed IPS, desarrollado con Node.js y Express mediante una arquitectura en capas.

## Instalación y ejecución

Desde la carpeta `ms-pacientes`, instalar las dependencias:

```bash
npm install
```

Copiar el archivo `.env.example` y crear uno llamado `.env` con la siguiente configuración:

```env
PORT=3002
HOST=127.0.0.1
```

Iniciar el servicio:

```bash
npm run dev
```

El microservicio estará disponible en `http://localhost:3002`.

Para comprobar que está funcionando, ingresar a:

`http://localhost:3002/health`

## Arquitectura en capas

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Arranque | `src/index.js` | Configura el puerto y pone el servidor en funcionamiento. |
| Configuración | `src/app.js` | Configura Express, las rutas y el manejo de errores. |
| Rutas | `src/routes/pacientes.routes.js` | Define las rutas disponibles para las peticiones. |
| Controlador | `src/controllers/pacientes.controller.js` | Recibe las peticiones y devuelve las respuestas HTTP. |
| Servicio | `src/services/pacientes.service.js` | Realiza las validaciones y aplica las reglas de negocio. |
| Modelo | `src/models/paciente.js` | Define los datos del paciente y sus validaciones. |
| Repositorio | `src/repositories/pacientes.repository.js` | Almacena y consulta los pacientes en memoria. |
| Utilidad | `src/utils/http-error.js` | Permite manejar errores con sus respectivos códigos HTTP. |

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Verificar el estado del microservicio. |
| GET | `/pacientes` | Listar todos los pacientes. |
| GET | `/pacientes/:id` | Consultar un paciente por su ID. |
| POST | `/pacientes` | Registrar un nuevo paciente. |

## Ejemplo de creación de un paciente

**POST `/pacientes`**

Cuerpo de la petición:

```json
{
  "nombre": "María Fernanda López",
  "documento": "1001234567",
  "fecha_nacimiento": "1995-04-12",
  "eps": "Sura",
  "telefono": "3001234567"
}
```

Si los datos son correctos, el servicio responde con el código `201 Created` y devuelve el paciente creado junto con su ID, que se genera automáticamente.

## Validaciones y reglas de negocio

- El nombre del paciente es obligatorio y no puede estar vacío.
- El documento debe contener entre 6 y 15 dígitos numéricos.
- La fecha de nacimiento debe tener el formato `AAAA-MM-DD`, ser una fecha válida y no puede ser futura.
- La EPS es obligatoria y no puede estar vacía.
- El teléfono debe contener exactamente 10 dígitos numéricos.
- No se permite registrar dos pacientes con el mismo número de documento. Si ya existe, el servicio responde con `409 Conflict`.
- El ID utilizado para consultar un paciente debe ser un entero positivo.
- Si el paciente no existe, el servicio responde con `404 Not Found`.
- Si los datos enviados no cumplen las validaciones, responde con `400 Bad Request`.

## Almacenamiento

En esta primera versión, los pacientes se almacenan temporalmente en memoria y el repositorio cuenta con cinco registros ficticios para realizar pruebas.

Los nuevos pacientes se agregan a esta lista, pero la información se pierde cuando se reinicia el servicio.

En los siguientes talleres se trabajará en la conexión con MySQL para guardar la información de forma permanente y ampliar las operaciones disponibles sobre los pacientes.