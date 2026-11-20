# Pacientes en Postman

1. Importa la [colección](ms-pacientes.postman_collection.json) y el [entorno](MediRed-Pacientes-Gateway.postman_environment.json) con **Import**.
2. Selecciona **MediRed Pacientes Gateway**. Conserva `baseUrl` en `http://app.medired.com/api` y completa los valores locales de las tres cuentas del laboratorio.
3. Abre **MediRed IPS - ms-pacientes - Taller 3 → Run collection**. Ejecuta las 19 solicitudes en el orden original con una iteración. Cada login comprueba el rol y guarda su JWT en el entorno. Activa **Keep variable values** si quieres conservar los JWT en el entorno local después del run.

| Rol | Correo | Contraseña | JWT que llena el login |
|---|---|---|---|
| Administrador | `admin_email` | `admin_password` | `token_administrador` |
| Admisiones | `admisiones_email` | `admisiones_password` | `token_admisiones` |
| Médico | `medico_email` | `medico_password` | `token_medico` |

Deja los JWT vacíos al importar. Cada run obtiene tokens nuevos. Usa los valores locales de Postman para las contraseñas y los tokens. El administrador crea, actualiza y elimina un paciente sintético. Admisiones y Médico pueden listar pacientes (`200`) y reciben `403` cuando intentan crear uno.

Si el run se interrumpe después de un `201`, conserva el ID y el documento de esa respuesta. Verifica que pertenezcan al registro sintético antes de eliminarlo con el administrador. Si el login devuelve `401`, revisa las credenciales. Si el login devuelve `200` pero Pacientes rechaza el JWT, comprueba que ambos servicios del laboratorio usan el mismo `JWT_SECRET`. Si una solicitud figura como omitida, revisa primero el login o la creación que debía preparar sus variables.

## Evidencias del Taller 3

| Evidencia | Qué capturar |
|---|---|
| Postman y API Gateway | El **Run Summary** completo, con todos los casos aprobados y cero omitidos. Los `400`, `401`, `403`, `404` y `409` son respuestas esperadas de casos negativos. |
| Apache en servidor2 | Al terminar el run, ejecuta `sudo tail -n 60 /var/log/apache2/app_access.log` y captura las solicitudes `/api/pacientes` con sus códigos HTTP. |
| Prueba integral de autenticación | Captura **02 - Listar sin token** con `401` y **05 - Intentar crear paciente como admisiones** y **08 - Intentar crear paciente como medico** con `403`. Oculta credenciales, tokens y datos de pacientes reales antes de compartir imágenes. |
| Consulta desde otro microservicio | En servidor2, abre `sudo journalctl -u ms-pacientes -f`. Lista citas o historias desde el frontend con referencias a pacientes y captura los datos relacionados junto con la única consulta por lote `GET /pacientes?ids=...` de ese listado. |
| Indisponibilidad | Durante la prueba coordinada de caída, captura el código que devuelve el gateway con Pacientes detenido. Registra el código observado y vuelve a levantar el servicio al terminar. |

El 20 de noviembre de 2026, desde Windows, `nslookup app.medired.com` devolvió `172.16.2.43`. La consulta `GET http://app.medired.com/api/pacientes` sin token devolvió HTTP 401 de Apache con el mensaje de Pacientes «Falta el token de acceso». La captura del Runner autenticado y los logs deben corresponder a la corrida en el laboratorio.
