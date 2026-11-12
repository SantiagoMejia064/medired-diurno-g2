# ms-pacientes · MediRed IPS

Microservicio REST para la gestión de pacientes de MediRed IPS, desarrollado con **Node.js y Express**, utilizando una arquitectura en capas y una base de datos MySQL para el almacenamiento persistente de la información.

Permite registrar, consultar, actualizar y eliminar pacientes. También ofrece consultas filtradas por EPS y consultas por lotes mediante identificadores. El acceso a los endpoints está protegido mediante autenticación JWT y autorización por roles.

## Instalación y ejecución

Desde la carpeta `ms-pacientes`, instalar las dependencias:

```bash
npm install
```

Crear un archivo `.env` en la raíz del proyecto con la configuración del servicio y la conexión a la base de datos:

```env
PORT=3002
HOST=127.0.0.1

DB_HOST=localhost
DB_PORT=3307
DB_NAME=pacientes_db
DB_USER=pacientes_user
DB_PASSWORD=tu_contraseña

JWT_SECRET=tu_clave_secreta
```

Los valores de conexión deben coincidir con la configuración local de MySQL. El archivo `.env` no debe subirse al repositorio.

Verificar que la base de datos y la tabla `pacientes` estén creadas. El proyecto incluye el script SQL `db/schema.sql` para definir la estructura de la tabla.

Iniciar el microservicio:

```bash
npm run dev
```

El servicio estará disponible en:

`http://localhost:3002`

Para comprobar que está funcionando, ingresar a:

`http://localhost:3002/health`

## Arquitectura en capas

El proyecto está organizado en capas para separar las responsabilidades de cada componente.

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Arranque | `src/index.js` | Carga la configuración e inicia el servidor. |
| Configuración | `src/app.js` | Configura Express, los middlewares, las rutas y el manejo de errores. |
| Rutas | `src/routes/pacientes.routes.js` | Define los endpoints y los permisos de acceso. |
| Controlador | `src/controllers/pacientes.controller.js` | Recibe las solicitudes HTTP y devuelve las respuestas correspondientes. |
| Servicio | `src/services/pacientes.service.js` | Aplica las validaciones y las reglas de negocio. |
| Modelo | `src/models/paciente.js` | Define la estructura de los datos y valida la información del paciente. |
| Repositorio | `src/repositories/pacientes.repository.js` | Ejecuta las consultas SQL para gestionar los pacientes en MySQL. |
| Middleware | `src/middlewars/auth.js` | Verifica los tokens JWT y los permisos según el rol del usuario. |
| Utilidad | `src/utils/http-error.js` | Permite manejar errores asociados a códigos HTTP. |

## Autenticación y autorización

El microservicio utiliza JSON Web Token (JWT) para proteger el acceso a los recursos.

- Todas las rutas de `/pacientes` requieren un token válido.
- Los usuarios autenticados pueden realizar consultas.
- Las operaciones de creación, actualización y eliminación están restringidas al rol `administrador`.
- Si no se proporciona un token válido, se devuelve `401 Unauthorized`.
- Si el usuario no tiene los permisos necesarios, se devuelve `403 Forbidden`.

Para realizar solicitudes protegidas desde Postman, se debe incluir el siguiente encabezado:

```http
Authorization: Bearer <token>
```

## Endpoints

### Verificación del servicio

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Verifica el estado del microservicio. |

### Gestión de pacientes

| Método | Ruta | Descripción | Respuesta exitosa |
|---|---|---|---|
| GET | `/pacientes` | Lista todos los pacientes. | `200 OK` |
| GET | `/pacientes?eps=Sanitas` | Filtra los pacientes por EPS. | `200 OK` |
| GET | `/pacientes?ids=3,13` | Consulta pacientes por varios identificadores. | `200 OK` |
| GET | `/pacientes/:id` | Consulta un paciente por su ID. | `200 OK` |
| POST | `/pacientes` | Registra un nuevo paciente. | `201 Created` |
| PUT | `/pacientes/:id` | Actualiza la información de un paciente. | `200 OK` |
| DELETE | `/pacientes/:id` | Elimina un paciente por su ID. | `204 No Content` |

### Consultas con filtros

**Filtrar por EPS**

```http
GET /pacientes?eps=Sanitas
```

Devuelve los pacientes que pertenecen a la EPS indicada.

**Consultar por lotes**

```http
GET /pacientes?ids=3,13
```

Permite consultar varios pacientes mediante sus identificadores, separados por comas, en una sola solicitud. Si los identificadores no son enteros positivos, el servicio responde con `400 Bad Request`.

Los filtros por EPS y por identificadores se procesan desde el controlador y se aplican en las consultas del repositorio.

## Ejemplo de creación de un paciente

**POST `/pacientes`**

Cuerpo de la petición:

```json
{
  "nombre": "Laura Camila Torres",
  "documento": "1145834901",
  "fecha_nacimiento": "2001-01-18",
  "eps": "Nueva EPS",
  "telefono": "3154567890"
}
```

Si los datos son válidos y el documento no está registrado, el servicio responde con `201 Created` y devuelve el paciente creado con su identificador generado automáticamente.

Ejemplo de respuesta:

```json
{
  "id": 18,
  "nombre": "Laura Camila Torres",
  "documento": "1145834901",
  "fecha_nacimiento": "2001-01-18",
  "eps": "Nueva EPS",
  "telefono": "3154567890"
}
```

La respuesta también incluye el encabezado `Location`, que indica la dirección del recurso creado, por ejemplo: `/pacientes/18`.

## Ejemplo de actualización

**PUT `/pacientes/18`**

Cuerpo de la petición:

```json
{
  "nombre": "Laura Camila Torres",
  "documento": "1145834901",
  "fecha_nacimiento": "2001-01-18",
  "eps": "Sura",
  "telefono": "3154567890"
}
```

Si el paciente existe y los datos cumplen las validaciones, el servicio responde con `200 OK` y devuelve el registro actualizado.

## Validaciones y reglas de negocio

El modelo y la capa de servicio aplican las siguientes validaciones:

- El nombre del paciente es obligatorio y debe ser una cadena de texto no vacía.
- El documento es obligatorio y debe contener entre **6 y 10 dígitos numéricos**.
- La fecha de nacimiento debe tener el formato `AAAA-MM-DD`, corresponder a una fecha real y no ser futura.
- La EPS es obligatoria y debe ser una cadena de texto no vacía.
- El teléfono debe contener exactamente 10 dígitos numéricos.
- El identificador utilizado en las consultas y operaciones debe ser un entero positivo.
- No se permite registrar dos pacientes con el mismo número de documento.
- Al actualizar un paciente, se verifica que el documento no pertenezca a otro registro.

### Regla de negocio: documento único

Cada paciente debe tener un número de documento único. Antes de registrar o actualizar un paciente, la capa de servicio consulta el repositorio mediante `findByDocumento()` para comprobar si el documento ya está asociado a otro registro.

Si el documento pertenece a otro paciente, el servicio responde con `409 Conflict`. Durante una actualización, se excluye de esta comprobación el identificador del paciente que se está modificando, permitiendo conservar su propio documento.

## Códigos de respuesta HTTP

| Código | Descripción |
|---|---|
| `200 OK` | La consulta o actualización se realizó correctamente. |
| `201 Created` | El paciente fue registrado correctamente. |
| `204 No Content` | El paciente fue eliminado correctamente y la respuesta no contiene un cuerpo. |
| `400 Bad Request` | Los datos enviados o los identificadores no cumplen las validaciones. |
| `401 Unauthorized` | No se proporcionó un token válido. |
| `403 Forbidden` | El usuario no tiene permisos para realizar la operación. |
| `404 Not Found` | El paciente solicitado no existe. |
| `409 Conflict` | El documento ya está registrado en otro paciente. |
| `500 Internal Server Error` | Se produjo un error interno durante el procesamiento de la solicitud. |

## Almacenamiento de datos

La información de los pacientes se almacena de manera persistente en una base de datos **MySQL**. La capa de repositorio se encarga de ejecutar las consultas SQL para listar, buscar, registrar, actualizar y eliminar pacientes.

La tabla `pacientes` contiene los siguientes campos:

| Campo | Descripción |
|---|---|
| `id` | Identificador único autoincremental del paciente. |
| `nombre` | Nombre completo del paciente. |
| `documento` | Número de documento, con restricción de unicidad. |
| `fecha_nacimiento` | Fecha de nacimiento del paciente. |
| `eps` | Entidad promotora de salud. |
| `telefono` | Número de contacto del paciente. |

Gracias a la conexión con MySQL, los registros permanecen almacenados después de reiniciar el microservicio y pueden ser consultados por otros servicios de MediRed IPS mediante los endpoints REST.