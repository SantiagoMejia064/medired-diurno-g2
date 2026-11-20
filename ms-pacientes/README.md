
# ms-pacientes · MediRed IPS

Microservicio REST para la gestión de pacientes de MediRed IPS, desarrollado con **Node.js y Express**, utilizando una arquitectura en capas y una base de datos **MariaDB** para el almacenamiento persistente de la información.

Permite registrar, consultar, actualizar y eliminar pacientes. También ofrece consultas filtradas por EPS y consultas por lotes mediante identificadores. El acceso a los endpoints está protegido mediante autenticación JWT y autorización por roles.

Responsable del microservicio — Valentina Ochoa Hernández.

- [Contrato REST y permisos](#contrato-rest).
- [Seguridad JWT](#autenticación-y-autorización).
- [Regla de documento único](#regla-de-negocio-documento-único).
- [Relaciones y tabla Me consultan](#me-consultan).
- [Colección, entorno y ejecución de Postman](#documentación-y-pruebas).

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

Antes de iniciar el servicio, se debe verificar que la base de datos `pacientes_db` exista y ejecutar el script SQL `db/schema.sql`, que define la estructura de la tabla `pacientes` e inserta registros iniciales.

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
| Repositorio | `src/repositories/pacientes.repository.js` | Ejecuta las consultas SQL para gestionar los pacientes. |
| Middleware | `src/middlewars/auth.js` | Verifica los tokens JWT y los permisos según el rol del usuario. |
| Utilidad | `src/utils/http-error.js` | Permite manejar errores asociados a códigos HTTP. |

## Autenticación y autorización

El microservicio utiliza **JSON Web Token (JWT)** para proteger el acceso a los recursos.

El token es emitido por el microservicio `ms-usuarios` y verificado localmente por `ms-pacientes` mediante el middleware `verificarToken` y la clave compartida `JWT_SECRET`.

Todas las rutas de `/pacientes` requieren autenticación.

Las operaciones de creación, actualización y eliminación están restringidas al rol `administrador`.

### Permisos de acceso

| Recurso | administrador | admisiones | medico |
|---|---|---|---|
| `/pacientes` | GET, POST, PUT, DELETE | GET | GET |

Los usuarios autenticados pueden consultar pacientes, pero únicamente el administrador puede crear, actualizar o eliminar registros.

La protección se realiza en el backend, independientemente de los controles disponibles en el frontend.

Para realizar solicitudes protegidas desde Postman, se debe incluir el encabezado:

```http
Authorization: Bearer <token>
```

El token debe ser generado por `ms-usuarios` y contener la información de autorización requerida.

Si no se proporciona un token válido, el servicio devuelve `401 Unauthorized`.

Si el usuario no tiene los permisos necesarios, devuelve `403 Forbidden`.

## Contrato REST

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

Permite consultar varios pacientes mediante sus identificadores, separados por comas, en una sola solicitud.

Los identificadores deben ser enteros positivos. Si el formato no es válido, el servicio responde con `400 Bad Request`.

También es posible combinar ambos filtros:

```http
GET /pacientes?eps=Sanitas&ids=3,13
```

Los filtros se procesan desde el controlador y se aplican en las consultas SQL del repositorio.

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

El identificador del ejemplo es ilustrativo. El valor real es generado automáticamente por la base de datos.

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

Cada paciente debe tener un número de documento único.

Antes de registrar o actualizar un paciente, la capa de servicio consulta el repositorio mediante `findByDocumento()` para comprobar si el documento ya está asociado a otro registro.

Si el documento pertenece a otro paciente, el servicio responde con `409 Conflict`.

Durante una actualización, se excluye de esta comprobación el identificador del paciente que se está modificando, permitiendo conservar su propio documento.

La base de datos también aplica una restricción `UNIQUE` sobre el campo `documento`, evitando duplicados incluso ante solicitudes simultáneas.

## Relaciones entre microservicios

MediRed IPS utiliza una arquitectura de microservicios en la que cada servicio administra sus propios recursos y responsabilidades.

`ms-pacientes` se relaciona con otros microservicios mediante solicitudes HTTP REST y autenticación JWT.

Su función principal dentro de esta integración es proporcionar información de los pacientes a los servicios que la necesitan, sin compartir directamente su base de datos.

### Relación con ms-usuarios

El microservicio `ms-usuarios` se encarga de autenticar a los usuarios y emitir los tokens JWT.

Cuando un usuario realiza una solicitud a `ms-pacientes`, debe incluir su token en el encabezado `Authorization`.

`ms-pacientes` verifica localmente el token mediante `JWT_SECRET`, sin necesidad de consultar a `ms-usuarios` en cada petición.

El rol contenido en el token determina las operaciones permitidas.

### Me consultan

El microservicio `ms-pacientes` proporciona información a `ms-citas` y `ms-historias`, permitiendo que estos servicios consulten los pacientes relacionados con sus registros.

Ambos utilizan el endpoint `GET /pacientes?ids=` para recuperar los pacientes relacionados por lotes. Las llamadas internas usan `PACIENTES_URL`, configurada en servidor2 como `http://127.0.0.1:3002`, y envían el JWT en `Authorization: Bearer <token>`.

| Microservicio que me consulta | Endpoint utilizado | Finalidad |
|---|---|---|
| `ms-citas` | `GET /pacientes?ids=1,3` | Consultar los pacientes asociados a las citas médicas y obtener su información mediante los identificadores registrados. |
| `ms-historias` | `GET /pacientes?ids=1,3` | Consultar los pacientes asociados a las historias clínicas y obtener sus datos mediante sus identificadores. |

Los identificadores de la tabla son ejemplos. Cada consumidor reúne los IDs de pacientes de su listado y solicita sus datos por lote para componer la respuesta.

### Servicios que consulto

`ms-pacientes` resuelve su CRUD y sus filtros con `pacientes_db`. Verifica localmente el JWT emitido por `ms-usuarios`. Sus operaciones actuales se ejecutan con su propia base de datos y la clave compartida del grupo.

#### Consulta desde ms-citas

`ms-citas` administra las citas médicas y utiliza el campo `paciente_id` para identificar al paciente asociado a cada cita.

Cuando necesita obtener información de varios pacientes, puede realizar una consulta por lotes a `ms-pacientes`.

Ejemplo:

```http
GET /pacientes?ids=18,3
Authorization: Bearer <token>
```

La respuesta contiene un arreglo JSON con los pacientes encontrados.

Esto permite que `ms-citas` consulte la información necesaria sin acceder directamente a la base de datos `pacientes_db`.

#### Consulta desde ms-historias

`ms-historias` administra las historias clínicas y utiliza los identificadores de pacientes para relacionar cada historia con su correspondiente paciente.

Cuando necesita consultar los datos de varios pacientes asociados a historias clínicas, puede utilizar el mismo endpoint de consulta por lotes.

Ejemplo:

```http
GET /pacientes?ids=3,13
Authorization: Bearer <token>
```

El microservicio devuelve los registros encontrados, permitiendo que `ms-historias` utilice la información correspondiente sin duplicar los datos de los pacientes en su propia base de datos.

### Funcionamiento de la consulta por lotes

La consulta por lotes se implementa mediante el parámetro `ids`.

Ejemplo:

```http
GET /pacientes?ids=18,3
```

El funcionamiento se divide en las siguientes etapas:

1. El controlador recibe los identificadores enviados en la URL.
2. Se separan mediante comas y se convierten a números.
3. Se valida que todos sean enteros positivos.
4. El servicio solicita la información al repositorio.
5. El repositorio ejecuta una consulta SQL utilizando `WHERE id IN (...)`.
6. Se devuelve un arreglo JSON con los pacientes encontrados.

Ejemplo de la consulta SQL utilizada:

```sql
SELECT *
FROM pacientes
WHERE id IN (?, ?)
ORDER BY id;
```

Los valores se envían como parámetros, evitando concatenar directamente los identificadores en la consulta.

Si uno de los identificadores no cumple las validaciones, el servicio responde con `400 Bad Request`.

Si algún identificador no existe, simplemente no aparece en el arreglo de resultados.

### Registro de peticiones HTTP

El microservicio registra las solicitudes HTTP recibidas mediante un middleware configurado en `src/app.js`.

Este registro permite identificar el método HTTP, la ruta consultada y el código de respuesta.

Ejemplo:

```text
8:30:36 p. m. GET /pacientes?ids=18,3 → 200
8:31:02 p. m. GET /pacientes/18 → 200
8:31:25 p. m. POST /pacientes → 201
8:32:10 p. m. PUT /pacientes/18 → 200
8:33:05 p. m. DELETE /pacientes/18 → 204
```

Cuando `ms-citas` o `ms-historias` realiza una consulta por lotes, se registra una sola petición GET por cada solicitud recibida, independientemente de la cantidad de identificadores incluidos.

Por ejemplo, al consultar dos pacientes mediante:

```http
GET /pacientes?ids=18,3
```

Se registra una sola petición:

```text
8:30:36 p. m. GET /pacientes?ids=18,3 → 200
```

Este comportamiento permite comprobar que la consulta por lotes funciona correctamente y evita realizar múltiples solicitudes individuales.

Para comprobar la integración en servidor2, abre el registro en una terminal.

```bash
sudo journalctl -u ms-pacientes -f
```

Actualiza una sola vez el listado de Citas con pacientes asociados y comprueba la línea `GET /pacientes?ids=... → 200`. Repite con Historias. Captura el listado y las líneas de su misma ejecución para evidenciar una consulta por lote a Pacientes por cada listado. Los IDs consultados aparecen en el registro del servicio. Sal del seguimiento con Ctrl+C.

### Independencia de las bases de datos

Cada microservicio mantiene su propia base de datos.

`ms-pacientes` administra `pacientes_db`, mientras que `ms-citas` y `ms-historias` gestionan sus propios registros.

La relación entre los servicios se realiza mediante identificadores y solicitudes REST, sin acceder directamente a las tablas de otros microservicios.

Esto permite mantener separadas las responsabilidades y facilita el mantenimiento de cada servicio.

### Resumen de relaciones

| Microservicio | Relación con ms-pacientes | Mecanismo |
|---|---|---|
| `ms-usuarios` | Emite los tokens utilizados para autenticar las solicitudes. | JWT |
| `ms-citas` | Consulta pacientes asociados a las citas médicas. | HTTP REST |
| `ms-historias` | Consulta pacientes asociados a las historias clínicas. | HTTP REST |
| `ms-pacientes` | Administra la información de los pacientes. | MariaDB |

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

La información de los pacientes se almacena de manera persistente en una base de datos **MariaDB**, administrada mediante XAMPP.

La conexión desde Node.js se realiza utilizando el paquete `mysql2/promise`, mientras que la capa de repositorio se encarga de ejecutar las consultas SQL para listar, buscar, registrar, actualizar y eliminar pacientes.

La tabla `pacientes` contiene los siguientes campos:

| Campo | Tipo de dato | Descripción |
|---|---|---|
| `id` | `INT` | Identificador único autoincremental del paciente y clave primaria. |
| `nombre` | `VARCHAR(100)` | Nombre completo del paciente. |
| `documento` | `VARCHAR(15)` | Número de documento, con restricción de unicidad. |
| `fecha_nacimiento` | `DATE` | Fecha de nacimiento del paciente. |
| `eps` | `VARCHAR(100)` | Entidad promotora de salud. |
| `telefono` | `VARCHAR(10)` | Número de contacto del paciente. |

La persistencia permite conservar los registros después de reiniciar el microservicio.

Además, los pacientes pueden ser consultados por otros servicios de MediRed IPS mediante los endpoints REST correspondientes.

## Documentación y pruebas

La carpeta `docs/` contiene la documentación complementaria del microservicio y los recursos necesarios para ejecutar pruebas.

### Contrato REST

El [contrato REST de este README](#contrato-rest) describe los endpoints y filtros. Las secciones de ejemplos, seguridad, validaciones y códigos HTTP completan los cuerpos de solicitud, respuestas y permisos.

### Colección de Postman

Importa la [colección automática de Pacientes](docs/ms-pacientes.postman_collection.json).

La colección permite ejecutar pruebas sobre los endpoints del microservicio, incluyendo:

- Consulta general de pacientes.
- Consulta individual por ID.
- Consulta filtrada por EPS.
- Consulta por lotes mediante `?ids=`.
- Creación de pacientes.
- Actualización de pacientes.
- Eliminación de pacientes.
- Validación de documentos duplicados.
- Consulta de pacientes inexistentes.
- Validación de autenticación JWT y permisos.

Para ejecutarla por el gateway, importa la colección y el entorno
[`MediRed Pacientes Gateway`](docs/MediRed-Pacientes-Gateway.postman_environment.json).
Completa las credenciales locales de Administrador, Admisiones y Médico.
Los logins de la colección obtienen y guardan un JWT por rol durante el run. La
[guía de Postman](docs/README-POSTMAN.md) detalla la ejecución y las capturas del Taller 3.

Ejecuta las 19 solicitudes en orden con una iteración. La colección incluye 38 comprobaciones por corrida completa y verifica los permisos de los tres roles. Genera un documento de prueba, guarda el ID creado y elimina ese paciente al terminar. El entorno exportado contiene campos para las cuentas y los tokens de cada rol. Completa los correos y contraseñas en los valores locales de Postman. Los logins llenan los tokens automáticamente.

## Pruebas realizadas

El funcionamiento del CRUD se comprobó mediante solicitudes HTTP ejecutadas en Postman con un usuario autorizado.

Las pruebas permitieron verificar las operaciones de consulta, creación, actualización y eliminación de pacientes, así como el manejo de documentos duplicados y registros inexistentes.

| Prueba | Resultado esperado |
|---|---|
| GET `/pacientes?ids=3,13` | `200 OK` |
| POST `/pacientes` | `201 Created` |
| GET `/pacientes/18` | `200 OK` |
| POST con documento duplicado | `409 Conflict` |
| PUT `/pacientes/18` | `200 OK` |
| DELETE `/pacientes/18` | `204 No Content` |
| Segunda eliminación del mismo paciente | `404 Not Found` |

Adicionalmente, la consulta por lotes permite que `ms-citas` y `ms-historias` recuperen varios pacientes mediante una sola petición HTTP.

El registro de solicitudes en la terminal permite comprobar la recepción de estas consultas y verificar que no se realizan peticiones individuales innecesarias por cada identificador.

## Dependencias principales

- **Express:** framework utilizado para construir el servidor y definir las rutas REST.
- **mysql2:** paquete utilizado para establecer la conexión con MariaDB y ejecutar consultas SQL.
- **JSON Web Token (JWT):** mecanismo de autenticación y verificación de permisos de acceso.
- **dotenv:** permite cargar las variables de entorno del servicio.

## Estructura del proyecto

```text
ms-pacientes/
│
├── db/
│   └── schema.sql
│
├── docs/
│   ├── README-POSTMAN.md
│   ├── ms-pacientes.postman_collection.json
│   └── MediRed-Pacientes-Gateway.postman_environment.json
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
├── README.md
├── package.json
└── package-lock.json
```
