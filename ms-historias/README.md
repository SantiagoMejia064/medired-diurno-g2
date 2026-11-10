# ms-historias — MediRed IPS

Microservicio encargado de gestionar los registros de atención que forman parte de la historia clínica de los pacientes.

Cada historia representa una atención realizada por un médico a un paciente e incluye su fecha, motivo de consulta, diagnóstico y tratamiento.

- **Empresa:** MediRed IPS.
- **Jornada:** Diurna.
- **Grupo:** 2.
- **Responsable:** Steven Camilo Franco.
- **GitHub:** StevenNorduss.
- **Puerto:** `3005`.
- **Tecnologías:** Node.js, Express, MySQL y mysql2.

## Taller 1 — Arquitectura en capas y dominio

### Trabajo realizado

Se adaptó la plantilla entregada por la docente al dominio de historias clínicas. Se cambiaron los nombres de los archivos, las rutas, los mensajes y la lógica para trabajar con los atributos de una historia.

Se implementaron las siguientes funcionalidades:

- Comprobar el estado del microservicio mediante `/health`.
- Consultar el listado de historias.
- Consultar una historia por su identificador.
- Crear una historia.
- Validar los datos recibidos y responder con mensajes de error.

Durante el Taller 1, los datos se almacenaban en memoria. Al iniciar el servicio se cargaban tres registros ficticios y los cambios se perdían al reiniciar Node.js. En la primera parte del Taller 2, este almacenamiento se reemplazó por MySQL.

### Organización en capas

| Parte | Responsabilidad |
|---|---|
| Rutas | Asociar cada método HTTP y ruta con una función del controlador. |
| Controlador | Leer la petición, llamar al servicio y devolver la respuesta HTTP. |
| Servicio | Coordinar las validaciones y aplicar las reglas de negocio. |
| Modelo | Validar los campos y construir la historia con los datos permitidos. |
| Repositorio | Consultar y modificar los registros utilizando el mecanismo de almacenamiento correspondiente. |

`index.js` inicia el servidor. `app.js` configura Express, la lectura de JSON, las rutas y el manejo de errores.

El recorrido de una petición es:

```text
Cliente → Rutas → Controlador → Servicio → Repositorio
                                  ↓
                                Modelo
```

El servicio utiliza el modelo para validar y construir los datos antes de solicitar su almacenamiento.

### Datos de una historia

| Campo | Tipo en JSON | Descripción |
|---|---|---|
| `id` | Entero | Identificador de la historia. |
| `paciente_id` | Entero | Referencia al paciente atendido. |
| `medico_id` | Entero | Referencia al médico que realizó la atención. |
| `fecha` | Texto | Fecha de atención en formato `YYYY-MM-DD`. |
| `motivo_consulta` | Texto | Motivo de la atención. |
| `diagnostico` | Texto | Diagnóstico registrado. |
| `tratamiento` | Texto | Tratamiento registrado. |

### Validaciones iniciales

- `paciente_id` y `medico_id` deben ser enteros positivos.
- `fecha` debe representar una fecha válida en formato `YYYY-MM-DD`.
- `motivo_consulta`, `diagnostico` y `tratamiento` son obligatorios y no pueden estar vacíos.
- Los textos se guardan sin espacios al inicio ni al final.
- Los campos adicionales se descartan.
- El identificador se genera al guardar el registro.

### Relaciones

| Microservicio relacionado | Referencia guardada |
|---|---|
| `ms-pacientes` | `paciente_id` |
| `ms-medicos` | `medico_id` |

Estas referencias permiten identificar al paciente y al médico relacionados con cada atención. Durante esta etapa se validó el formato de sus identificadores.

## Taller 2 — Primera parte

### Actualización de historias

Se implementó `PUT /historias/:id` para modificar una historia existente.

La petición recibe los seis campos obligatorios de la historia, sin incluir el `id`. El servicio valida los datos y el repositorio actualiza el registro conservando su identificador.

Si la operación es exitosa, devuelve `200 OK` con la historia actualizada. Si el registro no existe, devuelve `404 Not Found`.

### Eliminación de historias

Se implementó `DELETE /historias/:id` para eliminar una historia.

Una eliminación exitosa devuelve `204 No Content`, sin cuerpo. Si el identificador no corresponde a una historia existente, devuelve `404 Not Found`.

Repetir la eliminación del mismo registro también devuelve `404`, porque la historia ya fue eliminada.

### Filtro por paciente

Se agregó la consulta:

```http
GET /historias?paciente_id=1
```

Devuelve las historias cuyo `paciente_id` coincide con el valor indicado.

El filtro debe ser un entero positivo. Si es inválido, devuelve `400 Bad Request`. Si no encuentra coincidencias, devuelve `200 OK` con un arreglo vacío:

```json
[]
```

### Regla de negocio: fecha no futura

Se incorporó en la capa de servicio la validación que impide registrar una atención con fecha posterior al día actual.

Esta regla se aplica tanto al crear como al actualizar una historia, antes de guardar los datos.

Si se incumple, devuelve `400 Bad Request`:

```json
{
  "error": "La fecha de la atención no puede ser futura"
}
```

La comparación utiliza la fecha local del equipo donde se ejecuta Node.js.

### Persistencia en MySQL

Se reemplazó el arreglo en memoria por almacenamiento en MySQL.

- **Base de datos:** `historias_db`.
- **Tabla:** `historias`.
- **Cuenta de conexión:** `historias_user`.
- **Script de preparación:** `db/schema.sql`.
- **Archivo de conexión:** `src/db.js`.

Se instaló la dependencia `mysql2` y se configuró un pool de conexiones.

El repositorio conserva las funciones `findAll`, `findById`, `create`, `update` y `remove`, pero ahora ejecuta consultas SQL con parámetros `?`.

MySQL genera los identificadores mediante `AUTO_INCREMENT`. Los registros permanecen después de detener y volver a iniciar el microservicio.

### Verificaciones realizadas

Se realizaron pruebas manuales en Postman para comprobar:

- La actualización de una historia y la consulta de sus cambios.
- La eliminación y el intento de eliminar nuevamente el mismo registro.
- El filtro por paciente.
- El rechazo de fechas futuras al crear y actualizar.
- La creación de un registro y su permanencia después de reiniciar Node.js.

En MySQL Workbench se consultaron los registros para verificar los datos almacenados, actualizados y eliminados.

## Operaciones al cierre de la primera parte

**Dirección base:** `http://127.0.0.1:3005`

| Operación | Método | Ruta | Cuerpo | Respuesta exitosa | Errores previstos |
|---|---|---|---|---|---|
| Estado | GET | `/health` | Sin cuerpo | `200` + estado | — |
| Listar | GET | `/historias` | Sin cuerpo | `200` + arreglo | — |
| Filtrar por paciente | GET | `/historias?paciente_id=1` | Sin cuerpo | `200` + arreglo filtrado | `400` |
| Obtener | GET | `/historias/:id` | Sin cuerpo | `200` + historia | `400`, `404` |
| Crear | POST | `/historias` | JSON completo sin id | `201` + historia y cabecera `Location` | `400` |
| Actualizar | PUT | `/historias/:id` | JSON completo sin id | `200` + historia actualizada | `400`, `404` |
| Eliminar | DELETE | `/historias/:id` | Sin cuerpo | `204` sin contenido | `400`, `404` |

`:id` se reemplaza por un identificador concreto, por ejemplo `/historias/1`.

Los errores internos o de acceso a la base de datos pueden producir una respuesta `500`.

### Ejemplo de creación

```http
POST http://127.0.0.1:3005/historias
Content-Type: application/json
```

En Postman, seleccionar **Body → raw → JSON** y enviar:

```json
{
  "paciente_id": 1,
  "medico_id": 2,
  "fecha": "2026-10-27",
  "motivo_consulta": "Motivo de consulta de ejemplo",
  "diagnostico": "Diagnóstico de ejemplo",
  "tratamiento": "Tratamiento de ejemplo"
}
```

Ejemplo de respuesta `201 Created`:

```json
{
  "id": 4,
  "paciente_id": 1,
  "medico_id": 2,
  "fecha": "2026-10-27",
  "motivo_consulta": "Motivo de consulta de ejemplo",
  "diagnostico": "Diagnóstico de ejemplo",
  "tratamiento": "Tratamiento de ejemplo"
}
```

La respuesta incluye la cabecera `Location`, por ejemplo `/historias/4`. El identificador depende del valor asignado por MySQL.

Para actualizar una historia se envía el mismo formato de cuerpo mediante PUT a `/historias/:id`.

### Ejemplo de listado

```http
GET http://127.0.0.1:3005/historias
```

Ejemplo de respuesta `200 OK`:

```json
[
  {
    "id": 1,
    "paciente_id": 1,
    "medico_id": 2,
    "fecha": "2026-10-27",
    "motivo_consulta": "Motivo de consulta de ejemplo",
    "diagnostico": "Diagnóstico de ejemplo",
    "tratamiento": "Tratamiento de ejemplo"
  }
]
```

El listado se devuelve ordenado por `id`. Su contenido depende de los registros existentes.

### Ejemplos de errores

Al omitir un campo obligatorio, responde `400 Bad Request`:

```json
{
  "error": "Datos inválidos",
  "detalles": [
    "diagnostico es obligatorio y debe ser un texto no vacío"
  ]
}
```

Al consultar, actualizar o eliminar una historia inexistente, responde `404 Not Found`:

```json
{
  "error": "No existe la historia con id 999"
}
```

Los identificadores inválidos, filtros inválidos y cuerpos JSON mal formados producen una respuesta `400 Bad Request`.

## Estructura al cierre de la primera parte

```text
ms-historias/
├── db/
│   └── schema.sql
├── src/
│   ├── controllers/
│   │   └── historias.controller.js
│   ├── models/
│   │   └── historias.js
│   ├── repositories/
│   │   └── historias.repository.js
│   ├── routes/
│   │   └── historias.routes.js
│   ├── services/
│   │   └── historias.service.js
│   ├── utils/
│   │   └── http-error.js
│   ├── app.js
│   ├── db.js
│   └── index.js
├── .env.example
├── .gitignore
├── CONTRATO.md
├── package.json
├── package-lock.json
└── README.md
```

## Instalación y ejecución

### Requisitos

- Node.js y npm.
- MySQL Server instalado y en ejecución.
- MySQL Workbench o consola de MySQL.
- Postman para las pruebas manuales.

Versiones utilizadas: Node.js `24.11.0`, npm `11.6.1` y MySQL Server `8.4.13`.

### 1. Preparar la base de datos

Para una instalación inicial, conectarse con una cuenta administradora de MySQL y ejecutar:

```sql
CREATE DATABASE historias_db;

CREATE USER 'historias_user'@'localhost'
IDENTIFIED BY 'CAMBIA_ESTA_CLAVE';

GRANT ALL PRIVILEGES ON historias_db.*
TO 'historias_user'@'localhost';
```

Reemplazar `CAMBIA_ESTA_CLAVE` por una contraseña local.

Crear una conexión en Workbench con estos datos:

| Campo | Valor |
|---|---|
| Host | `127.0.0.1` |
| Puerto | `3306` |
| Cuenta | `historias_user` |
| Contraseña | La definida anteriormente |
| Esquema predeterminado | `historias_db` |

Desde esa conexión, abrir y ejecutar `db/schema.sql`.

El script crea la tabla e inserta tres registros ficticios. Se ejecuta durante la preparación inicial, no cada vez que se inicia el servicio.

### 2. Instalar las dependencias

Desde la raíz del repositorio:

```powershell
cd ms-historias
npm install
```

### 3. Configurar el entorno

La primera vez, crear la configuración local:

```powershell
Copy-Item .env.example .env
```

Completar el archivo `.env`:

```dotenv
PORT=3005
HOST=127.0.0.1

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=historias_db
DB_USER=historias_user
DB_PASSWORD=
```

Escribir en `DB_PASSWORD` la contraseña asignada a la cuenta.

`HOST` y `PORT` corresponden al servidor HTTP. Las variables `DB_` corresponden a la conexión con MySQL.

La contraseña real permanece en `.env`. Los archivos `.env` y la carpeta `node_modules` están excluidos del repositorio mediante `.gitignore`.

### 4. Iniciar el microservicio

Con MySQL en ejecución:

```powershell
npm run dev
```

La terminal debe mostrar:

```text
ms-historias escuchando en http://127.0.0.1:3005
```

Mantener la terminal abierta mientras se utiliza el servicio. Para detenerlo, presionar `Ctrl+C`.

En ejecuciones posteriores, con las dependencias, la base de datos y la configuración preparadas, basta con ejecutar `npm run dev`.

`GET /health` comprueba que la aplicación responde. `GET /historias` comprueba también el acceso a la base de datos.


## Taller 2 — Segunda parte

En esta etapa se protegieron las rutas de Historias con JWT y se integraron los microservicios de Pacientes y Médicos. Al crear o actualizar una historia se comprueba que ambos registros existan. Al responder, se agregan los datos del paciente y del médico a la información de la atención.

### Autenticación y permisos

El token se obtiene al iniciar sesión mediante `POST /usuarios/login` en `ms-usuarios` (`http://127.0.0.1:3001`). Las peticiones a `/historias` deben enviarlo en la cabecera `Authorization: Bearer <token>`.

| Operación | Acceso |
|---|---|
| `GET /health` | Público. |
| Listar, filtrar y consultar historias | Cualquier cuenta con un token válido. |
| Crear, actualizar y eliminar historias | Roles `administrador` y `medico`. |

Un token ausente, inválido o vencido devuelve `401 Unauthorized`. Si el token es válido pero el rol carece de permiso para la operación, se devuelve `403 Forbidden`.

### Configuración local

Además de la configuración de MySQL, completa estas variables en el `.env` de Historias:

```dotenv
JWT_SECRET=
PACIENTES_URL=http://127.0.0.1:3002
MEDICOS_URL=http://127.0.0.1:3003
```

En `JWT_SECRET`, usa la misma clave que tiene configurada `ms-usuarios`. Mantén esa clave en tu `.env` local. Para probar el flujo completo, inicia Usuarios, Pacientes, Médicos e Historias en terminales separadas.

### Validación de referencias y composición

- **Al crear o actualizar**, Historias consulta `GET /pacientes/:id` y `GET /medicos/:id` antes de guardar. Si una referencia no existe, devuelve `400 Bad Request`. Si uno de los servicios no responde durante esa validación, devuelve `503 Service Unavailable` y la operación se detiene antes de guardar.
- **Al listar**, Historias agrupa los identificadores únicos y hace una consulta por lote a cada servicio mediante `GET /pacientes?ids=…` y `GET /medicos?ids=…`. Los clientes HTTP reenvían la cabecera de autorización recibida.
- **Al consultar, crear o actualizar**, la respuesta incluye los campos `paciente` y `medico`. Por ejemplo, una consulta a `GET /historias/1` puede devolver `200 OK` con este cuerpo:

```json
{
  "id": 1,
  "paciente_id": 1,
  "medico_id": 2,
  "fecha": "2026-10-27",
  "motivo_consulta": "Motivo de consulta de ejemplo",
  "diagnostico": "Diagnóstico de ejemplo",
  "tratamiento": "Tratamiento de ejemplo",
  "paciente": {
    "id": 1,
    "nombre": "María Fernanda López"
  },
  "medico": {
    "id": 2,
    "nombre": "Laura Gómez",
    "especialidad": "Pediatría"
  }
}
```

Si Médicos está detenido al consultar, Historias devuelve `200 OK` con los datos disponibles, `medico: null` y `aviso: "ms-medicos no está disponible"`. Si falla Pacientes, el campo `paciente` queda en `null` y el aviso identifica a ese servicio. MySQL guarda los identificadores de referencia. Los datos relacionados se agregan al construir la respuesta.