# ms-citas · MediRed IPS

Microservicio REST para la gestión de citas médicas de MediRed IPS, desarrollado con Node.js, Express y MySQL mediante una arquitectura en capas.

Permite consultar, crear, actualizar y eliminar citas médicas, aplicando validaciones y reglas de disponibilidad de horarios.

**Puerto:** 3004

## Instalación y ejecución

Desde la carpeta `ms-citas`, instalar las dependencias:

```bash
npm install
```

Crear la base de datos `citas_db` en MySQL y ejecutar `db/schema.sql` para generar la tabla y sus tres registros iniciales.

Copiar `.env.example` a `.env` y configurar las credenciales de MySQL mediante las variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`.

Iniciar el microservicio:

```bash
npm run dev
```

Disponible en `http://localhost:3004`.

## Arquitectura en capas

| Capa        | Responsabilidad                                      |
| ----------- | ---------------------------------------------------- |
| Rutas       | Define los endpoints REST.                           |
| Controlador | Recibe peticiones y construye respuestas HTTP.       |
| Servicio    | Aplica las validaciones y reglas de negocio.         |
| Modelo      | Define los atributos y valida los datos de una cita. |
| Repositorio | Ejecuta las operaciones sobre MySQL.                 |
| Conexión    | Administra las conexiones mediante `src/db.js`.      |

## Endpoints

| Método | Ruta                       | Descripción                       |
| ------ | -------------------------- | --------------------------------- |
| GET    | `/health`                  | Verificar el estado del servicio. |
| GET    | `/citas`                   | Listar todas las citas.           |
| GET    | `/citas?estado=programada` | Filtrar citas por estado.         |
| GET    | `/citas/:id`               | Consultar una cita por ID.        |
| POST   | `/citas`                   | Registrar una nueva cita.         |
| PUT    | `/citas/:id`               | Actualizar una cita existente.    |
| DELETE | `/citas/:id`               | Eliminar una cita.                |

## Ejemplo de creación

**POST `/citas`**

```json
{
  "paciente_id": 1,
  "medico_id": 2,
  "fecha_hora": "2027-06-15T09:00",
  "sede": "Cali",
  "estado": "programada"
}
```

El identificador `id` se genera automáticamente. Para actualizar una cita mediante PUT se envían sus atributos completos, conservando el ID indicado en la URL.

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

## Almacenamiento y pruebas

Las citas se almacenan en MySQL, dentro de la base de datos `citas_db`. El repositorio utiliza consultas SQL parametrizadas y un pool de conexiones con `mysql2/promise`.

Los datos permanecen almacenados después de reiniciar el microservicio. Se comprobó el funcionamiento del CRUD y las reglas de negocio mediante Postman y MySQL Workbench.

La colección de pruebas se encuentra en `docs/ms-citas.postman_collection.json`, organizada en carpetas GET, POST, PUT y DELETE.

Los identificadores de pacientes y médicos se almacenan como referencias para la integración REST entre microservicios, sin claves foráneas entre sus bases de datos.
