
# ms-medicos · Contrato de la API

Microservicio encargado de la gestión de médicos de **MediRed IPS**.

- **Responsable:** Jean Carlo Caicedo Chantre
- **Puerto:** 3003
- **Tecnologías:** Node.js, Express, MySQL/MariaDB y JWT
- **Arquitectura:** API REST organizada en capas

## 1. Cómo ejecutarlo

### Requisitos

- Node.js y npm
- MySQL o MariaDB
- Postman para realizar las pruebas
- `ms-usuarios` configurado para obtener tokens JWT

### Configuración de la base de datos

Crear la base de datos y su usuario desde MySQL/MariaDB, utilizando una cuenta administradora:

```sql
CREATE DATABASE medicos_db;

CREATE USER 'medicos_user'@'localhost'
IDENTIFIED BY 'una-clave-segura';

GRANT ALL PRIVILEGES ON medicos_db.*
TO 'medicos_user'@'localhost';
```

La contraseña anterior es un ejemplo y debe sustituirse por una contraseña local segura.

Posteriormente, ingresar a la base de datos y ejecutar el archivo `db/schema.sql`:

```sql
SOURCE db/schema.sql;
```

El archivo contiene la estructura de la tabla `medicos` y los registros iniciales.

### Instalación de dependencias

Desde la carpeta `ms-medicos`:

```bash
npm install
```

### Variables de entorno

Copiar `.env.example` como `.env` y configurar las variables correspondientes:

```env
PORT=3003
HOST=127.0.0.1

DB_HOST=localhost
DB_PORT=3309
DB_NAME=medicos_db
DB_USER=medicos_user
DB_PASSWORD=TU_CONTRASEÑA_LOCAL

JWT_SECRET=CLAVE_COMPARTIDA_DEL_GRUPO
```

**Importante:**

- El puerto `3309` corresponde al entorno local utilizado durante las pruebas. Debe ajustarse según la configuración de MySQL.
- `JWT_SECRET` debe tener exactamente el mismo valor que en `ms-usuarios` y los demás microservicios del grupo.
- El archivo `.env` contiene información privada y no debe subirse al repositorio.
- El archivo `.env.example` documenta las variables requeridas sin incluir contraseñas reales.

### Iniciar el microservicio

```bash
npm run dev
```

El microservicio estará disponible en:

```text
http://localhost:3003
```

Para verificar su funcionamiento:

```http
GET http://localhost:3003/health
```

Respuesta esperada:

```json
{
  "servicio": "ms-medicos",
  "estado": "ok"
}
```

## 2. Representación del recurso

Un médico se representa mediante un objeto JSON con la siguiente estructura:

```json
{
  "id": 1,
  "nombre": "Carlos Ramírez",
  "registro_medico": "RM-001",
  "especialidad": "Cardiología",
  "sede": "Cali"
}
```

### Atributos

| Atributo | Tipo | ¿Obligatorio al crear? | Reglas |
|---|---|---|---|
| `id` | Entero | No | Positivo, único y asignado por MySQL |
| `nombre` | Texto | Sí | No puede estar vacío |
| `registro_medico` | Texto | Sí | Debe ser único |
| `especialidad` | Texto | Sí | No puede estar vacía |
| `sede` | Texto | Sí | Cali, Bogotá o Medellín |

### Regla de negocio

El microservicio impide registrar dos médicos con el mismo `registro_medico`.

Este atributo identifica de manera única el registro profesional de cada médico dentro del sistema. Si se intenta crear o actualizar un médico utilizando un registro ya existente, la API responde con el código **409 Conflict**.

Adicionalmente, se valida que la sede corresponda a una de las ciudades autorizadas: Cali, Bogotá o Medellín. Los valores inválidos generan una respuesta **400 Bad Request**.

## 3. Endpoints REST

Todas las rutas del recurso comienzan por `/medicos`.

| Operación | Método | URI | Respuesta exitosa | Errores posibles |
|---|---|---|---|---|
| Listar | GET | `/medicos` | 200 + arreglo | 401 |
| Filtrar | GET | `/medicos?especialidad=Cardiología` | 200 + arreglo filtrado | 401 |
| Consultar por lotes | GET | `/medicos?ids=1,3` | 200 + arreglo | 400, 401 |
| Obtener | GET | `/medicos/:id` | 200 + objeto | 400, 401, 404 |
| Crear | POST | `/medicos` | 201 + objeto + Location | 400, 401, 403, 409 |
| Actualizar | PUT | `/medicos/:id` | 200 + objeto | 400, 401, 403, 404, 409 |
| Eliminar | DELETE | `/medicos/:id` | 204 sin cuerpo | 400, 401, 403, 404 |

### Ejemplo: crear un médico

**Petición:**

```http
POST http://localhost:3003/medicos
Authorization: Bearer <TOKEN_ADMINISTRADOR>
Content-Type: application/json
```

Cuerpo JSON:

```json
{
  "nombre": "Coutinho Dos Santos",
  "registro_medico": "RM-004",
  "especialidad": "Neurología",
  "sede": "Medellín"
}
```

**Respuesta esperada: 201 Created**

```json
{
  "id": 4,
  "nombre": "Coutinho Dos Santos",
  "registro_medico": "RM-004",
  "especialidad": "Neurología",
  "sede": "Medellín"
}
```

El valor de `id` depende de los registros existentes en MySQL.

### Ejemplo: listar médicos

**Petición:**

```http
GET http://localhost:3003/medicos
Authorization: Bearer <TOKEN_VALIDO>
```

**Respuesta esperada: 200 OK**

```json
[
  {
    "id": 1,
    "nombre": "Carlos Ramírez",
    "registro_medico": "RM-001",
    "especialidad": "Cardiología",
    "sede": "Cali"
  }
]
```

### Consulta por lotes

El endpoint `GET /medicos?ids=` permite consultar varios médicos mediante una sola petición HTTP.

Ejemplo:

```http
GET http://localhost:3003/medicos?ids=1,3
Authorization: Bearer <TOKEN_VALIDO>
```

La respuesta contiene los médicos existentes cuyos identificadores coinciden con los solicitados.

Este endpoint es utilizado por `ms-citas` para obtener información de varios médicos sin realizar una petición individual por cada uno.

### Formato de errores

Los errores se devuelven en formato JSON:

```json
{
  "error": "Mensaje descriptivo del error"
}
```

Cuando corresponde, pueden incluir información adicional en el atributo `detalles`.

## 4. Seguridad con JWT

Todos los endpoints de `/medicos` están protegidos mediante autenticación JWT.

El microservicio utiliza el middleware `verificarToken`, basado en el proporcionado por la docente en `ms-usuarios`.

El token debe enviarse en cada petición mediante la cabecera:

```http
Authorization: Bearer <TOKEN>
```

### Obtención del token

El usuario debe iniciar sesión en `ms-usuarios`:

```http
POST http://localhost:3001/usuarios/login
Content-Type: application/json
```

Ejemplo del cuerpo:

```json
{
  "email": "admin@empresa.com",
  "password": "Admin2026*"
}
```

El servicio devuelve un token JWT firmado que incluye información del usuario y su rol.

### Permisos por rol

| Operación | Administrador | Admisiones | Médico |
|---|---|---|---|
| GET /medicos | Permitido | Permitido | Permitido |
| GET /medicos/:id | Permitido | Permitido | Permitido |
| POST /medicos | Permitido | Denegado | Denegado |
| PUT /medicos/:id | Permitido | Denegado | Denegado |
| DELETE /medicos/:id | Permitido | Denegado | Denegado |

Las consultas están disponibles para todos los usuarios autenticados, mientras que la creación, actualización y eliminación están restringidas al rol `administrador`.

### Respuestas de seguridad

| Situación | Código HTTP |
|---|---|
| Petición sin token | 401 Unauthorized |
| Token inválido o vencido | 401 Unauthorized |
| Usuario autenticado sin permisos | 403 Forbidden |
| Usuario autenticado con permisos | Código de éxito correspondiente |

La verificación del token se realiza localmente utilizando `JWT_SECRET`, sin consultar a `ms-usuarios` por cada solicitud.

## 5. Relaciones con otros microservicios

### Microservicios consultados

`ms-medicos` no necesita consultar otros microservicios para administrar sus registros.

Su información se almacena exclusivamente en la base de datos `medicos_db`.

### Microservicios que consultan a ms-medicos

`ms-citas` consulta a `ms-medicos` mediante HTTP REST para validar referencias y componer las respuestas de las citas.

| Me consulta | Peticiones que realiza | Campos que debo mantener |
|---|---|---|
| `ms-citas` | `GET /medicos/:id` y `GET /medicos?ids=...` | `id`, `nombre`, `especialidad`, `sede` |

El atributo `registro_medico` forma parte del contrato general de médicos, aunque el cliente HTTP de `ms-citas` utiliza principalmente los campos indicados en la tabla.

### Validación de referencias

Cuando `ms-citas` crea o actualiza una cita, consulta:

```http
GET /medicos/:id
```

Esta petición permite comprobar que el médico asociado existe.

- Si existe, `ms-medicos` responde `200 OK`.
- Si no existe, `ms-medicos` responde `404 Not Found`.
- `ms-citas` interpreta la respuesta y determina si puede continuar con la operación.

### Composición de respuestas

Cuando `ms-citas` consulta sus citas, utiliza:

```http
GET /medicos?ids=1,2,3
```

De esta manera obtiene la información de varios médicos mediante una sola petición HTTP.

El cliente HTTP de `ms-citas` utiliza los siguientes atributos:

- `id`
- `nombre`
- `especialidad`
- `sede`

### Autenticación entre microservicios

`ms-citas` reenvía el token JWT recibido en la petición original cuando consulta a `ms-medicos`.

Por esta razón, ambos microservicios deben compartir la misma `JWT_SECRET`.

### Prueba de integración

Durante el desarrollo del Taller 2 se comprobó la comunicación entre ambos microservicios.

Se ejecutó desde Postman:

```http
GET http://localhost:3004/citas
```

La petición obtuvo `200 OK` y `ms-medicos` recibió una consulta por lotes:

```http
GET /medicos?ids=2,1,3
```

Esta prueba permitió verificar que `ms-citas` consume el endpoint REST de `ms-medicos` para recuperar información de los médicos asociados a las citas.

## 6. Pruebas en Postman

Las pruebas se realizaron mediante Postman para verificar el comportamiento de la API REST, las reglas de negocio y la seguridad JWT.

### Pruebas del CRUD

Se contemplan los siguientes casos:

1. Listar todos los médicos.
2. Filtrar por especialidad.
3. Consultar médicos por lotes mediante `?ids=`.
4. Obtener un médico existente.
5. Consultar un ID inexistente.
6. Consultar un ID no numérico.
7. Crear un médico válido.
8. Crear sin un atributo obligatorio.
9. Crear violando la regla de unicidad.
10. Actualizar un médico existente.
11. Actualizar un ID inexistente.
12. Eliminar un médico existente.
13. Eliminar nuevamente el mismo registro.

### Pruebas de seguridad

| Caso | Descripción | Código esperado | Resultado |
|---|---|---|---|
| 14 | Petición sin token | 401 | Correcto |
| 15 | Petición con token inventado | 401 | Correcto |
| 16 | GET con rol admisiones | 200 | Correcto |
| 17 | POST con rol admisiones | 403 | Correcto |
| 18 | POST con rol administrador | 201 | Correcto |

### Prueba de relaciones

Se verificó que `ms-citas` realiza consultas HTTP hacia `ms-medicos` para recuperar la información de los médicos.

La evidencia de esta integración corresponde a:

- Respuesta exitosa de `GET /medicos?ids=...` en Postman.
- Registro en la terminal de `ms-medicos` de las peticiones recibidas desde `ms-citas`.

La implementación de las validaciones y la composición de citas corresponde al microservicio `ms-citas`, que almacena las referencias a médicos.

### Colección Postman

La colección inicial del CRUD se encuentra en:

```text
docs/ms-medicos.postman_collection.json
```

Las pruebas de seguridad JWT se incorporaron durante la segunda semana del taller.

## 7. Estructura del microservicio

El proyecto está organizado mediante una arquitectura en capas:

- **Rutas:** definen los endpoints y aplican los middlewares de seguridad.
- **Controladores:** reciben las peticiones HTTP y construyen las respuestas.
- **Servicios:** implementan las reglas de negocio y las validaciones.
- **Repositorios:** realizan las operaciones SQL sobre MySQL.
- **Modelo:** define las validaciones y la representación de la entidad.
- **Middlewares:** verifican los tokens JWT y los permisos por rol.
- **Base de datos:** `medicos_db`, independiente de las bases de los demás microservicios.

Esta separación permite mantener las responsabilidades organizadas y facilita la integración con otros componentes de MediRed IPS.
