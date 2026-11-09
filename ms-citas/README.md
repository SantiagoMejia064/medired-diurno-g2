# ms-citas · MediRed IPS

Microservicio REST para la gestión de citas médicas de MediRed IPS, desarrollado con Node.js y Express mediante una arquitectura en capas.

## Instalación y ejecución

Desde la carpeta `ms-citas`:

```bash
npm install
```

Copiar `.env.example` a `.env` con la siguiente configuración:

```env
PORT=3004
HOST=127.0.0.1
```

Iniciar el servicio:

```bash
npm run dev
```

Disponible en `http://localhost:3004`.

## Arquitectura en capas

| Capa        | Responsabilidad                                       |
| ----------- | ----------------------------------------------------- |
| Rutas       | Define los endpoints del servicio                     |
| Controlador | Recibe las peticiones y construye las respuestas HTTP |
| Servicio    | Aplica las validaciones y reglas de negocio           |
| Modelo      | Define los atributos de una cita                      |
| Repositorio | Almacena y consulta las citas en memoria              |

## Endpoints

| Método | Ruta         | Descripción                      |
| ------ | ------------ | -------------------------------- |
| GET    | `/health`    | Verificar el estado del servicio |
| GET    | `/citas`     | Listar las citas                 |
| GET    | `/citas/:id` | Consultar una cita por ID        |
| POST   | `/citas`     | Registrar una nueva cita         |

## Ejemplo de creación

**POST `/citas`**

```json
{
  "paciente_id": 2,
  "medico_id": 2,
  "fecha_hora": "2026-11-05T11:00",
  "sede": "Cali",
  "estado": "programada"
}
```

El identificador `id` se genera automáticamente.

## Validaciones y reglas de negocio

- Los identificadores del paciente y del médico deben ser enteros positivos.
- La fecha y hora deben cumplir el formato `AAAA-MM-DDTHH:mm`.
- Las sedes permitidas son Bogotá, Cali y Medellín.
- Los estados permitidos son `programada`, `atendida` y `cancelada`.
- Si no se especifica un estado, se asigna `programada`.
- Un mismo médico no puede tener dos citas programadas o atendidas en la misma fecha y hora. Si existe un conflicto, el servicio responde con `409 Conflict`.
- Las citas canceladas no bloquean horarios.

## Almacenamiento

En esta primera versión, las citas se almacenan temporalmente en memoria, con tres registros iniciales. Los nuevos registros se pierden al reiniciar el servicio.

En una próxima etapa se incorporará persistencia mediante MySQL y comunicación REST con los microservicios de pacientes y médicos.
