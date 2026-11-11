# ms-citas · MediRed IPS

Microservicio REST para la gestión de citas médicas de MediRed IPS, desarrollado con Node.js, Express y MySQL mediante una arquitectura en capas.

Permite consultar, crear, actualizar y eliminar citas médicas, aplicando validaciones y reglas de disponibilidad de horarios.

**Responsable:** Santiago Mejía Suárez  
**Puerto:** 3004

## Instalación y ejecución

### Requisitos

- Node.js compatible con `--env-file-if-exists` (versión 22 o posterior) y npm.
- MySQL en ejecución, con acceso para crear una base de datos y un usuario.
- Para las relaciones REST: `ms-pacientes` (3002) y `ms-medicos` (3003).
- Para obtener un JWT: `ms-usuarios` (3001).

Desde la carpeta `ms-citas`, instalar las dependencias:

```bash
npm install
```

### Crear la base de datos

Desde MySQL Workbench o la consola, con una cuenta administradora, ejecutar:

```sql
CREATE DATABASE IF NOT EXISTS citas_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'citas_user'@'localhost'
  IDENTIFIED BY 'REEMPLAZAR_CON_CLAVE_SEGURA';

GRANT ALL PRIVILEGES ON citas_db.* TO 'citas_user'@'localhost';
```

La contraseña del ejemplo debe reemplazarse por una clave privada antes de ejecutar el comando. Si el usuario ya existe, no se debe volver a crearlo; se utilizan sus credenciales actuales.

A continuación, desde la carpeta `ms-citas`, iniciar la consola MySQL con el usuario del servicio:

```bash
mysql -u citas_user -p
```

En la consola MySQL, ejecutar:

```sql
SOURCE db/schema.sql;
```

El archivo `db/schema.sql` selecciona `citas_db`, crea la tabla `citas` y carga tres registros iniciales. El usuario de la base de datos y la clave configurados deben coincidir con `DB_USER` y `DB_PASSWORD` del archivo `.env`.

Copiar `.env.example` a `.env` y configurar las variables de entorno necesarias:

| Variable      | Descripción                                     |
| ------------- | ----------------------------------------------- |
| PORT          | Puerto del microservicio (3004).                |
| HOST          | Dirección local del servidor.                   |
| DB_HOST       | Dirección del servidor MySQL.                   |
| DB_PORT       | Puerto de MySQL (3306).                         |
| DB_NAME       | Base de datos `citas_db`.                       |
| DB_USER       | Usuario de MySQL para citas.                    |
| DB_PASSWORD   | Contraseña del usuario de MySQL.                |
| JWT_SECRET    | Clave compartida para verificar los tokens JWT. |
| PACIENTES_URL | Dirección de `ms-pacientes` (puerto 3002).      |
| MEDICOS_URL   | Dirección de `ms-medicos` (puerto 3003).        |

La variable `JWT_SECRET` debe coincidir con la utilizada por `ms-usuarios`. El archivo `.env` contiene información sensible y no debe subirse al repositorio.

Para utilizar las relaciones REST, `ms-pacientes` y `ms-medicos` deben estar ejecutándose en sus respectivos puertos. `ms-usuarios` permite iniciar sesión y obtener el token JWT necesario para acceder a las rutas protegidas.

Iniciar el microservicio:

```bash
npm run dev
```

Disponible en `http://localhost:3004`.

## Arquitectura en capas

| Capa          | Responsabilidad                                      |
| ------------- | ---------------------------------------------------- |
| Rutas         | Define los endpoints REST.                           |
| Controlador   | Recibe peticiones y construye respuestas HTTP.       |
| Servicio      | Aplica las validaciones y reglas de negocio.         |
| Modelo        | Define los atributos y valida los datos de una cita. |
| Repositorio   | Ejecuta las operaciones sobre MySQL.                 |
| Conexión      | Administra las conexiones mediante `src/db.js`.      |
| Clientes HTTP | Consultan otros microservicios mediante REST.        |

## Representación y atributos

Las citas se intercambian como objetos JSON. Un registro contiene los siguientes atributos:

```json
{
  "id": 4,
  "paciente_id": 1,
  "medico_id": 1,
  "fecha_hora": "2027-06-15T09:00",
  "sede": "Cali",
  "estado": "programada"
}
```

| Atributo | Tipo JSON | Obligatorio al crear | Regla |
| --- | --- | --- | --- |
| `id` | Número entero | No; generado por MySQL | Identificador positivo y único. |
| `paciente_id` | Número entero | Sí | Entero positivo; debe existir en `ms-pacientes`. |
| `medico_id` | Número entero | Sí | Entero positivo; debe existir en `ms-medicos`. |
| `fecha_hora` | Cadena de texto | Sí | Formato `AAAA-MM-DDTHH:mm`; fecha y hora válidas y futuras. |
| `sede` | Cadena de texto | Sí | `Cali`, `Bogotá` o `Medellín`. |
| `estado` | Cadena de texto | No | `programada`, `atendida` o `cancelada`; por defecto `programada`. |

En las respuestas GET, POST y PUT se agregan los objetos `paciente` y `medico` con información obtenida de los microservicios relacionados. Si alguno no está disponible durante una consulta, el objeto correspondiente puede ser `null` y se agrega `aviso`.

## Endpoints

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores posibles |
| --- | --- | --- | --- | --- | --- |
| Listar | GET | `/citas` | — | `200` + arreglo de citas | `401` |
| Filtrar por estado | GET | `/citas?estado=programada` | — | `200` + arreglo filtrado | `401` |
| Obtener | GET | `/citas/:id` | — | `200` + objeto de cita | `400`, `401`, `404` |
| Crear | POST | `/citas` | JSON sin `id` | `201` + objeto y cabecera `Location` | `400`, `401`, `403`, `409`, `502`, `503` |
| Actualizar | PUT | `/citas/:id` | JSON completo sin `id` | `200` + objeto actualizado | `400`, `401`, `403`, `404`, `409`, `502`, `503` |
| Eliminar | DELETE | `/citas/:id` | — | `204` sin cuerpo | `400`, `401`, `403`, `404` |

**Comprobación pública:** `GET /health` responde `200 OK` sin token.

## Ejemplo de creación

Solicitud **POST `/citas`**, con JWT de administrador o admisiones:

```json
{
  "paciente_id": 1,
  "medico_id": 1,
  "fecha_hora": "2027-06-15T09:00",
  "sede": "Cali",
  "estado": "programada"
}
```

Respuesta de ejemplo **`201 Created`** (el ID depende de los registros existentes):

```http
Location: /citas/4
```

```json
{
  "id": 4,
  "paciente_id": 1,
  "medico_id": 1,
  "fecha_hora": "2027-06-15T09:00",
  "sede": "Cali",
  "estado": "programada",
  "paciente": {
    "id": 1,
    "nombre": "María Fernanda López",
    "documento": "1001234567",
    "eps": "Sura"
  },
  "medico": {
    "id": 1,
    "nombre": "Carlos Ramírez",
    "especialidad": "Cardiología",
    "sede": "Cali"
  }
}
```

Para actualizar mediante PUT, se envían los atributos completos en el cuerpo JSON y se conserva el identificador indicado en la URL.

## Ejemplo de listado

Solicitud **GET `/citas`**, con JWT válido:

Respuesta de ejemplo **`200 OK`**, con un arreglo de citas:

```json
[
  {
    "id": 4,
    "paciente_id": 1,
    "medico_id": 1,
    "fecha_hora": "2027-06-15T09:00",
    "sede": "Cali",
    "estado": "programada",
    "paciente": {
      "id": 1,
      "nombre": "María Fernanda López",
      "documento": "1001234567",
      "eps": "Sura"
    },
    "medico": {
      "id": 1,
      "nombre": "Carlos Ramírez",
      "especialidad": "Cardiología",
      "sede": "Cali"
    }
  }
]
```

Para filtrar los registros se utiliza, por ejemplo, `GET /citas?estado=programada`.

## Validaciones y reglas de negocio

- `paciente_id` y `medico_id` deben ser enteros positivos.
- `fecha_hora` debe tener el formato `AAAA-MM-DDTHH:mm`, ser válida y corresponder a una fecha futura.
- Las sedes permitidas son Bogotá, Cali y Medellín.
- Los estados permitidos son `programada`, `atendida` y `cancelada`.
- Si no se especifica un estado, se asigna `programada`.
- Un médico no puede tener dos citas activas en la misma fecha y hora.
- Las citas canceladas no bloquean horarios.
- Al actualizar una cita, esta no genera conflictos consigo misma.

**Códigos HTTP:** `200` para consultas y actualizaciones, `201` para creación, `204` para eliminación, `400` para datos inválidos, `404` para recursos inexistentes y `409` para conflictos de horario.

## Seguridad y permisos

El microservicio utiliza autenticación mediante tokens JWT, generados por `ms-usuarios`.

Todas las operaciones sobre `/citas` requieren un token válido, enviado mediante la cabecera `Authorization: Bearer <token>`.

La verificación se realiza con el middleware `verificarToken`, utilizando la clave compartida `JWT_SECRET`.

### Permisos por rol

| Operación         | administrador | admisiones | medico    |
| ----------------- | ------------- | ---------- | --------- |
| GET /citas        | Permitido     | Permitido  | Permitido |
| GET /citas/:id    | Permitido     | Permitido  | Permitido |
| POST /citas       | Permitido     | Permitido  | Denegado  |
| PUT /citas/:id    | Permitido     | Permitido  | Denegado  |
| DELETE /citas/:id | Permitido     | Permitido  | Denegado  |

Las operaciones de escritura utilizan el middleware `requiereRol("administrador", "admisiones")`.

### Respuestas de seguridad

- `401 Unauthorized`: token ausente, inválido o vencido.
- `403 Forbidden`: usuario autenticado sin permisos suficientes.

El endpoint `/health` permanece público para comprobar el estado del microservicio.

## Relaciones entre microservicios

`ms-citas` se relaciona con `ms-pacientes` y `ms-medicos` mediante peticiones HTTP REST, sin acceder directamente a sus bases de datos.

| Atributo    | Microservicio consultado | Validación (POST/PUT) | Composición (GET)      | Datos utilizados               |
| ----------- | ------------------------ | --------------------- | ---------------------- | ------------------------------ |
| paciente_id | ms-pacientes (3002)      | GET /pacientes/:id    | GET /pacientes?ids=... | id, nombre, documento, eps     |
| medico_id   | ms-medicos (3003)        | GET /medicos/:id      | GET /medicos?ids=...   | id, nombre, especialidad, sede |

### Validación de referencias

Al crear o actualizar una cita, se comprueba mediante REST que el paciente y el médico existan.

- Si una referencia no existe, se responde `400 Bad Request`.
- Si el microservicio consultado no está disponible, se responde `503 Service Unavailable`.

### Composición de respuestas

Al consultar citas, se agregan los objetos `paciente` y `medico` mediante consultas por lotes con `?ids=`.

Si un microservicio no está disponible, la consulta continúa con código `200 OK`, el objeto relacionado en `null` y un mensaje en el campo `aviso`.

Las peticiones entre microservicios reenvían el token JWT recibido y utilizan un tiempo máximo de espera de 3 segundos.

Las direcciones de los servicios se configuran mediante `PACIENTES_URL` y `MEDICOS_URL` en el archivo `.env`.

## Almacenamiento y pruebas

Las citas se almacenan en MySQL, dentro de la base de datos `citas_db`. El repositorio utiliza consultas SQL parametrizadas y un pool de conexiones con `mysql2/promise`.

Los datos permanecen almacenados después de reiniciar el microservicio. Se comprobó el funcionamiento del CRUD y las reglas de negocio mediante Postman y MySQL Workbench.

La colección de pruebas se encuentra en `docs/MediRed IPS – ms-citas.postman_collection_2daSemana.json`, organizada en carpetas GET, POST, PUT y DELETE. Incluye las pruebas del CRUD, las validaciones de negocio, la autenticación JWT, los permisos por rol y las relaciones REST con los microservicios de pacientes y médicos.

Los identificadores de pacientes y médicos se almacenan como referencias para la integración REST entre microservicios, sin claves foráneas entre sus bases de datos.
