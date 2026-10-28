# ms-historias — MediRed IPS

Microservicio encargado de registrar y consultar las atenciones que forman parte de la historia clínica.

- **Empresa:** MediRed IPS.
- **Jornada:** Diurna.
- **Grupo:** 2.
- **Responsable:** Steven Camilo Franco.
- **GitHub:** StevenNorduss.
- **Puerto:** 3005.
- **Tecnologías:** Node.js y Express.

## Alcance del Taller 1

El microservicio permite:

- Comprobar su estado mediante `/health`.
- Consultar el listado de historias.
- Consultar una historia por su identificador.
- Crear una historia.
- Validar los datos recibidos y responder con mensajes de error.

Los datos se almacenan en memoria. Al iniciar el servicio se cargan tres registros ficticios. Los registros creados durante la ejecución se pierden al reiniciarlo.

## Estructura

```text
ms-historias/
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
│   └── index.js
├── .env.example
├── .gitignore
├── CONTRATO.md
├── package.json
├── package-lock.json
└── README.md
```

## Organización en capas

| Parte | Responsabilidad |
|---|---|
| Rutas | Asociar cada método y ruta con una función del controlador. |
| Controlador | Leer la petición, llamar al servicio y devolver la respuesta HTTP. |
| Servicio | Coordinar las validaciones y las operaciones sobre las historias. |
| Modelo | Validar los campos y construir el registro con los datos permitidos. |
| Repositorio | Consultar y guardar los registros en memoria, asignando sus identificadores. |

`index.js` inicia el servidor. `app.js` configura Express, la lectura de JSON, las rutas y el manejo de errores.

## Requisitos

- Node.js y npm.
- Postman para realizar las pruebas manuales.

Versiones utilizadas durante el desarrollo:

- Node.js: 24.11.0.
- npm: 11.6.1.

## Instalación y ejecución

Desde la raíz del repositorio, ingresar a la carpeta:

```powershell
cd ms-historias
```

La primera vez, instalar las dependencias, crear la configuración local e iniciar el servicio:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

El archivo `.env` utiliza esta configuración:

```dotenv
PORT=3005
HOST=127.0.0.1
```

La terminal debe mostrar:

```text
ms-historias escuchando en http://127.0.0.1:3005
```

En ejecuciones posteriores, si las dependencias y la configuración ya están preparadas, basta con:

```powershell
npm run dev
```

Mantener la terminal abierta mientras se utiliza el microservicio. Para detenerlo, presionar `Ctrl+C`.

Los archivos `.env` y la carpeta `node_modules` están excluidos del repositorio mediante `.gitignore`.

## Direcciones y operaciones

**Dirección base:** `http://127.0.0.1:3005`

| Método | Ruta | Función | Respuesta exitosa |
|---|---|---|---|
| GET | `/health` | Consultar el estado del servicio. | 200 |
| GET | `/historias` | Listar las historias. | 200 |
| GET | `/historias/:id` | Consultar una historia por su id. | 200 |
| POST | `/historias` | Crear una historia. | 201 |

En `/historias/:id`, se reemplaza `:id` por un identificador concreto, por ejemplo `/historias/1`.

## Datos de una historia

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Entero | Identificador generado por el servicio. |
| `paciente_id` | Entero | Referencia al paciente atendido. |
| `medico_id` | Entero | Referencia al médico que realizó la atención. |
| `fecha` | Texto | Fecha de atención en formato `YYYY-MM-DD`. |
| `motivo_consulta` | Texto | Motivo de la atención. |
| `diagnostico` | Texto | Diagnóstico registrado. |
| `tratamiento` | Texto | Tratamiento registrado. |

## Ejemplo de creación

En Postman:

- Seleccionar el método **POST**.
- Utilizar `http://127.0.0.1:3005/historias`.
- Seleccionar **Body → raw → JSON**.
- Enviar el siguiente cuerpo:

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

La respuesta es `201 Created` e incluye los datos enviados junto con el nuevo `id`. El identificador no necesita enviarse en la petición.

## Validaciones y errores

- `paciente_id` y `medico_id` deben ser enteros positivos.
- `fecha` debe representar una fecha válida con formato `YYYY-MM-DD`.
- `motivo_consulta`, `diagnostico` y `tratamiento` son obligatorios y no pueden estar vacíos.
- Los textos se guardan sin espacios al inicio ni al final.
- Los campos adicionales al modelo se descartan.

Si faltan datos obligatorios, el servicio responde `400 Bad Request`. Por ejemplo, al omitir `diagnostico`:

```json
{
  "error": "Datos inválidos",
  "detalles": [
    "diagnostico es obligatorio y debe ser un texto no vacío"
  ]
}
```

Al consultar una historia inexistente, responde `404 Not Found`:

```json
{
  "error": "No existe la historia con id 999"
}
```

Un identificador de consulta que no sea un entero positivo produce una respuesta `400 Bad Request`.

## Relaciones con otros microservicios

| Microservicio relacionado | Referencia guardada |
|---|---|
| `ms-pacientes` | `paciente_id` |
| `ms-medicos` | `medico_id` |

En el Taller 1 se valida el formato de los identificadores y el servicio puede probarse de manera independiente.
