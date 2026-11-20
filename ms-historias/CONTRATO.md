# Contrato de ms-historias para Taller 3

Responsable: Steven Camilo Franco Bocanegra. Cada historia representa una atención médica. Este contrato describe la implementación con MySQL, JWT y composición REST; sustituye la propuesta del Taller 1.

## Direcciones y permisos

- Interna en servidor2: `http://127.0.0.1:3005/historias`.
- Gateway del laboratorio: `http://app.medired.com/api/historias`.
- Login: `POST http://app.medired.com/api/usuarios/login`.
- Todas las rutas de Historias requieren `Authorization: Bearer <token>`.
- Lecturas: cualquier token válido. Escrituras: `administrador` o `medico`; `admisiones` solo consulta.
- `GET http://127.0.0.1:3005/health` es público; Apache no publica `/api/health`.

## Datos de entrada

POST y PUT reciben `Content-Type: application/json` y los seis campos completos. PUT no es una actualización parcial.

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | Entero generado | Positivo, único y asignado por MySQL; no se envía al crear. |
| `paciente_id` | Entero | Obligatorio, positivo y existente en Pacientes. |
| `medico_id` | Entero | Obligatorio, positivo y existente en Médicos. |
| `fecha` | Texto | Fecha real `YYYY-MM-DD`, obligatoria y no futura según el reloj del servidor. |
| `motivo_consulta` | Texto | Obligatorio, no vacío después de quitar espacios extremos. |
| `diagnostico` | Texto | Obligatorio, no vacío después de quitar espacios extremos. |
| `tratamiento` | Texto | Obligatorio, no vacío después de quitar espacios extremos. |

Ejemplo ilustrativo: seleccionar IDs existentes y una fecha no futura.

```json
{
  "paciente_id": 1,
  "medico_id": 2,
  "fecha": "2026-10-27",
  "motivo_consulta": "Control de ejemplo",
  "diagnostico": "Diagnóstico ficticio",
  "tratamiento": "Tratamiento ficticio"
}
```

## Operaciones

Las rutas de la tabla son internas; agregar `/api` al usarlas por gateway.

| Método y ruta | Éxito | Comportamiento |
| --- | --- | --- |
| `GET /historias` | 200, arreglo | Lista con relaciones; puede devolver `[]`. |
| `GET /historias?paciente_id=1` | 200, arreglo | Filtro entero positivo; sin coincidencias devuelve `[]`. |
| `GET /historias/:id` | 200, objeto | ID inválido: 400; historia inexistente: 404. |
| `POST /historias` | 201, objeto | Valida referencias y guarda. `Location: /historias/<id>`. |
| `PUT /historias/:id` | 200, objeto | Valida cuerpo y referencias y actualiza una atención existente. |
| `DELETE /historias/:id` | 204, sin cuerpo | Elimina; inexistente: 404. No consulta proveedores. |

`Location` es la ruta generada por el servicio; no asumir que incluye `/api`.

## Respuesta compuesta

POST, PUT y GET individual devuelven un objeto como este; los listados, un arreglo de objetos. Los nombres dependen de los proveedores y son ilustrativos.

```json
{
  "id": 1,
  "paciente_id": 1,
  "medico_id": 2,
  "fecha": "2026-10-27",
  "motivo_consulta": "Control de ejemplo",
  "diagnostico": "Diagnóstico ficticio",
  "tratamiento": "Tratamiento ficticio",
  "paciente": { "id": 1, "nombre": "María Fernanda López" },
  "medico": { "id": 2, "nombre": "Laura Gómez", "especialidad": "Pediatría" }
}
```

MySQL guarda los IDs y datos propios de la atención. Los objetos relacionados se consultan por REST, sin duplicar los nombres en la tabla de Historias.

## Integración y fallos

Antes de POST o PUT se consulta `GET /pacientes/:id` y después `GET /medicos/:id`, reenviando Authorization. Referencia inexistente: 400. Proveedor inaccesible o timeout: 503 antes de guardar. Respuesta HTTP inesperada durante esa validación: 502. Cada petición tiene timeout de tres segundos.

La composición agrupa IDs distintos y consulta en paralelo `GET /pacientes?ids=...` y `GET /medicos?ids=...`: una petición por proveedor si hay IDs. Un listado vacío no necesita esas llamadas. La consulta individual utiliza también esta composición por lote.

Si Médicos falla al leer, Historias mantiene HTTP 200 y los datos propios, con `medico: null` y `aviso: "ms-medicos no está disponible"` en las historias devueltas. Pacientes funciona de forma equivalente con `paciente: null`; si fallan ambos, se unen los avisos. Una referencia ausente del arreglo recibido puede producir `null` sin aviso de indisponibilidad.

| Código | Significado |
| --- | --- |
| 400 | Datos, fecha, ID o filtro inválidos; referencia inexistente. |
| 401 | Token ausente, inválido o vencido. |
| 403 | Rol sin permiso de escritura. |
| 404 | Historia o ruta inexistente. |
| 502 | Respuesta HTTP inesperada del proveedor al validar referencias. |
| 503 JSON | Historias no puede validar la escritura por indisponibilidad de un proveedor. |
| 503 del gateway | Apache no puede contactar Historias; puede devolver HTML. |

## Verificación aportada

Steven ejecutó las pruebas por gateway el 19 de noviembre de 2026: recorrido normal, 73 comprobaciones aprobadas; preparación de caída, 7; Médicos detenido, 7 (lectura 200 parcial y escritura 503); recuperación y limpieza, 5. Son comprobaciones, no cantidades de peticiones. También aportó evidencia del mensaje de indisponibilidad en el navegador, recuperación y llamadas por lote.

La persistencia tras reinicio está respaldada por capturas anteriores. Las carpetas simplificadas de persistencia aún no tienen una nueva captura de ejecución. Procedimiento completo: [README de Postman](docs/README-POSTMAN.md).
