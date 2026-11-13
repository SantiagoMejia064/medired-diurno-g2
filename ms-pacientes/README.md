# ms-pacientes · MediRed IPS

Microservicio REST para la gestión de pacientes de MediRed IPS, desarrollado con **Node.js y Express**, utilizando una arquitectura en capas y una base de datos **MariaDB** para el almacenamiento persistente de la información.

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
DB_PASSWORD=tu_contraseña_local

JWT_SECRET=tu_clave_secreta
```

Los valores de conexión deben coincidir con la configuración local de MariaDB. El archivo `.env` contiene información sensible, por lo que no debe subirse al repositorio.

Antes de iniciar el servicio, se debe verificar que la base de datos `pacientes_db` exista y que se haya seleccionado al ejecutar el script SQL. El proyecto incluye el archivo `db/schema.sql`, que define la estructura de la tabla `pacientes` e inserta registros iniciales.

Para ejecutar el microservicio en modo desarrollo:

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
| Conexión a la base de datos | `src/db.js` | Configura el pool de conexiones con MariaDB mediante `mysql2/promise`. |
| Rutas | `src/routes/pacientes.routes.js` | Define los endpoints y los permisos de acceso. |
| Controlador | `src/controllers/pacientes.controller.js` | Recibe las solicitudes HTTP y devuelve las respuestas correspondientes. |
| Servicio | `src/services/pacientes.service.js` | Aplica las validaciones y las reglas de negocio. |
| Modelo | `src/models/paciente.js` | Define la estructura de los datos y valida la información del paciente. |
| Repositorio | `src/repositories/pacientes.repository.js` | Ejecuta las consultas SQL para gestionar los pacientes en la base de datos. |
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

El token debe ser generado por el microservicio de autenticación de MediRed IPS y contener la información de autorización requerida.

## Endpoints

### Verificación del servicio

| Método | Ruta | Descripción | Respuesta exitosa |
|---|---|---|---|
| GET | `/health` | Verifica el estado del microservicio. | `200 OK` |

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

Todas las rutas de gestión de pacientes requieren autenticación JWT. Las operaciones `POST`, `PUT` y `DELETE` requieren adicionalmente el rol `administrador`.

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

Permite consultar varios pacientes mediante sus identificadores, separados por comas, en una sola solicitud. Los identificadores deben ser enteros positivos. Si el formato no es válido, el servicio responde con `400 Bad Request`.

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

La respuesta también incluye el encabezado `Location`, que indica la dirección del recurso creado, por ejemplo:

`/pacientes/18`

**Nota:** el identificador del ejemplo es ilustrativo. El valor real es generado automáticamente por la base de datos.

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

## Ejemplo de eliminación

**DELETE `/pacientes/18`**

Permite eliminar un paciente mediante su identificador.

Si el registro existe y el usuario tiene permisos de administrador, el servicio responde con `204 No Content`, sin incluir un cuerpo en la respuesta.

Si el paciente no existe, devuelve `404 Not Found`.

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

La información de los pacientes se almacena de manera persistente en una base de datos **MariaDB**, administrada mediante XAMPP. La conexión desde Node.js se realiza utilizando el paquete `mysql2/promise`, mientras que la capa de repositorio se encarga de ejecutar las consultas SQL para listar, buscar, registrar, actualizar y eliminar pacientes.

La tabla `pacientes` contiene los siguientes campos:

| Campo | Tipo de dato | Descripción |
|---|---|---|
| `id` | `INT` | Identificador único autoincremental del paciente y clave primaria. |
| `nombre` | `VARCHAR(100)` | Nombre completo del paciente. |
| `documento` | `VARCHAR(15)` | Número de documento, con restricción de unicidad. |
| `fecha_nacimiento` | `DATE` | Fecha de nacimiento del paciente. |
| `eps` | `VARCHAR(100)` | Entidad promotora de salud. |
| `telefono` | `VARCHAR(10)` | Número de contacto del paciente. |

La persistencia permite conservar los registros después de reiniciar el microservicio. Además, los pacientes pueden ser consultados por otros servicios de MediRed IPS mediante los endpoints REST correspondientes.

## Dependencias principales

- **Express:** framework utilizado para construir el servidor y definir las rutas REST.
- **mysql2:** paquete utilizado para establecer la conexión con MariaDB y ejecutar consultas SQL.
- **JSON Web Token (JWT):** mecanismo de autenticación y verificación de permisos de acceso.

## Estructura del proyecto

```text
ms-pacientes/
│
├── db/
│   └── schema.sql
│
├── src/
│   ├── controllers/
│   │   └── pacientes.controller.js
│   │
│   ├── middlewars/
│   │   └── auth.js
│   │
│   ├── models/
│   │   └── paciente.js
│   │
│   ├── repositories/
│   │   └── pacientes.repository.js
│   │
│   ├── routes/
│   │   └── pacientes.routes.js
│   │
│   ├── services/
│   │   └── pacientes.service.js
│   │
│   ├── utils/
│   │   └── http-error.js
│   │
│   ├── app.js
│   ├── db.js
│   └── index.js
│
├── .env
├── .gitignore
├── package.json
└── package-lock.json
```