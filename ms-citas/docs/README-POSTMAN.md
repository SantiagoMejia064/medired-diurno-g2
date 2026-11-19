# Pruebas reproducibles de ms-citas

Esta guía acompaña la colección canónica
[MediRed-IPS-ms-citas.postman_collection.json](MediRed-IPS-ms-citas.postman_collection.json),
en formato Postman Collection v2.1. Santiago Mejía Suárez es responsable de ms-citas.
Las dos colecciones anteriores se conservan como antecedentes.

## Preparar otro computador

1. Instalar una versión actual de Postman Desktop que admita
   `pm.execution.skipRequest()`. Con Postman Web, utilizar el Desktop Agent para
   acceder a servicios locales.
2. Disponer de ms-usuarios, ms-citas, ms-pacientes y ms-medicos, sus bases de datos
   de pruebas y un `JWT_SECRET` compartido. Seguir las instrucciones de instalación
   existentes en cada servicio.
3. Preparar dos cuentas activas de prueba en ms-usuarios, una con rol
   `administrador` y otra con rol `medico`. Obtener sus credenciales de la persona
   responsable del entorno. La colección utiliza cuentas existentes.
4. Tener al menos un paciente y un médico registrados. La preparación consulta
   sus listados, selecciona una referencia de cada uno y calcula un paciente
   inexistente a partir del máximo ID. No exige IDs específicos.
5. En cada entorno, configurar `ROLES=administrador,admisiones,medico` en el
   `.env` privado de ms-usuarios, según su `.env.example`.
6. En Postman, seleccionar **Import** y abrir el JSON canónico.

Los POST, PUT y DELETE deben ejecutarse sobre una base de datos de pruebas o
contar con autorización explícita del responsable. El recorrido completo está
pensado para un laboratorio aislado. No ejecutar escrituras ni detener
proveedores en producción. La colección exportada trae
`permitirEscritura=false`.

## Variables y credenciales

Crear y seleccionar un entorno de Postman. Introducir las credenciales como
valores locales, marcando las contraseñas como sensibles. Mantener vacíos los
valores compartidos y evitar exportar el entorno con secretos.

| Variable configurable | Valor o finalidad |
| --- | --- |
| `baseUrl` | Origen de ms-citas o prefijo del Gateway, sin barra final. |
| `loginUrl` | URL completa de `POST /usuarios/login`. |
| `pacientesUrl` | Origen de ms-pacientes o prefijo del Gateway, sin `/pacientes`. |
| `medicosUrl` | Origen de ms-medicos o prefijo del Gateway, sin `/medicos`. |
| `healthUrl` | URL completa y accesible de `GET /health` de ms-citas. |
| `adminEmail`, `adminPassword` | Credenciales locales de la cuenta administradora de prueba. |
| `medicoEmail`, `medicoPassword` | Credenciales locales de la cuenta médica de prueba. |
| `permitirEscritura` | `true` para autorizar las pruebas POST/PUT/DELETE. El login siempre está habilitado. |
| `modoLimpieza` | `false` normalmente. `true` solo para limpiar una ejecución interrumpida. |
| `modoFalloPacientes` | Vacío normalmente. Admite `preparar`, `detenido` o `limpiar` durante la comprobación manual. |

Los scripts generan las siguientes variables de colección. Mantenerlas vacías
al importar y dejar que los scripts las administren. No introducir IDs de
registros existentes para utilizarlos como citas de prueba.

| Variables generadas | Uso |
| --- | --- |
| `tokenAdmin`, `tokenMedico` | JWT obtenidos mediante login. |
| `pacienteId`, `medicoId` | Referencias seleccionadas en los listados de proveedores. |
| `pacienteInexistenteId`, `citaInexistenteId` | IDs calculados para los casos negativos. |
| `fechaPrueba`, `fechaAuxiliar` | Dos horarios futuros libres para el mismo médico. |
| `citaId` | Cita principal creada por el caso 06. |
| `citaAuxId` | Cita creada por el caso 19 para probar conflictos en PUT. |
| `citaReferenciasId` | Cita cancelada del caso 20, que no bloquea el horario. |
| `citaManualId` | Cita cancelada para la prueba manual de degradación. |

Los scripts trasladan estas variables generadas al ámbito local de cada
petición para evitar que un valor antiguo del entorno o de un archivo de datos
reemplace el ID o token recién obtenido.

### Entorno local

| Variable | Valor |
| --- | --- |
| `baseUrl` | `http://localhost:3004` |
| `loginUrl` | `http://localhost:3001/usuarios/login` |
| `pacientesUrl` | `http://localhost:3002` |
| `medicosUrl` | `http://localhost:3003` |
| `healthUrl` | `http://localhost:3004/health` |

### Entorno por Gateway Apache

| Variable | Valor |
| --- | --- |
| `baseUrl` | `http://app.medired.com/api` |
| `loginUrl` | `http://app.medired.com/api/usuarios/login` |
| `pacientesUrl` | `http://app.medired.com/api` |
| `medicosUrl` | `http://app.medired.com/api` |

El computador debe resolver `app.medired.com` según la configuración DNS del
despliegue. Las peticiones añaden sus rutas, por ejemplo `{{baseUrl}}/citas`.
Usar las direcciones equivalentes de un despliegue de pruebas para ejecutar
el recorrido completo por Gateway.

La configuración actual de Apache publica los recursos `/api/usuarios`,
`/api/pacientes`, `/api/medicos`, `/api/citas` y `/api/historias`.
No publica `/api/health`. Por eso `healthUrl` es independiente.
Configurar una dirección de salud accesible desde el equipo que ejecuta Postman,
por ejemplo mediante un túnel autorizado al puerto local del servicio.
Si no existe ese acceso, desmarcar **Health público** en el Runner y comprobar
`GET /health` desde el servidor de aplicaciones. Registrar esa omisión en el
resultado.

## Ejecución normal

1. Verificar el entorno seleccionado, las URLs, las credenciales locales y la
   autorización para utilizar la base de pruebas.
2. Establecer `permitirEscritura=true`, `modoLimpieza=false` y
   `modoFalloPacientes` vacío.
3. Abrir **Run collection**, seleccionar únicamente las carpetas **00 -
   Autenticación**, **01 - Preparación de datos** y **02 - Pruebas normales**,
   mantener el orden y ejecutar una iteración. Activar la opción del Runner
   para conservar los valores de variables al terminar.
4. Revisar los resultados por petición y la pestaña **Test Results**. Al
   finalizar correctamente, las tres citas creadas quedan eliminadas.
5. Para repetir, ejecutar de nuevo las tres carpetas. La preparación obtiene
   referencias, IDs y fechas nuevas.
6. Al terminar, devolver `permitirEscritura=false` y vaciar los tokens antes de
   compartir o exportar la colección. Revisar también el historial y los reportes
   antes de compartirlos, porque el login devuelve tokens.

Las primeras solicitudes envían `email` y `password` a
`POST {{loginUrl}}`. Cada login verifica código 200, propiedad `token` con
formato JWT y `usuario.rol`. Solo entonces guarda el token de colección.
Un login fallido limpia su token y detiene el Runner.

Las peticiones heredan Bearer `{{tokenAdmin}}`, salvo los casos de médico,
token inválido y acceso público. Los casos sin token utilizan explícitamente
**No Auth**, evitando la autenticación heredada.

La preparación calcula horarios aproximadamente 90 días en el futuro y evita
los ya ocupados por el médico, excluyendo citas canceladas. Las fechas se
envían con precisión de minutos, en el formato local del contrato.
Ejecutar sin otros procesos que creen citas o referencias simultáneamente
durante el laboratorio para mantener válidos los casos de ID inexistente y
horario libre.

### Cobertura y orden

La numeración de los casos originales se conserva para facilitar la revisión,
pero el orden del Runner prepara primero los registros que necesitan otros
casos.

| Casos | Resultado esperado |
| --- | --- |
| Health | 200 público y objeto con servicio `ms-citas` y estado `ok`. |
| 01–05 | Listado, consulta propia, inexistente 404, filtro por estado e ID inválido 400. |
| 06–08 | Creación 201 con Location, datos inválidos 400 y horario ocupado 409. |
| 09–12 | Actualización 200, inexistente 404, conflicto 409 y conservación del horario 200. |
| 13–14 | Eliminación propia 204 sin cuerpo y repetición 404. |
| 15–18 | Sin token 401, token inválido 401, consulta médica 200 y POST médico 403. |
| 19–21 | POST administrador 201, referencias válidas 201 y paciente inexistente 400. |
| 22–23 | Composición con paciente y médico relacionados con sus IDs. |
| Consultas por lotes | GET a pacientes y médicos con `?ids=` y referencia capturada. |
| Limpieza final | DELETE de las citas auxiliar y de referencias con 204. |
| 24–25, manuales | Listado degradado 200 y creación rechazada con 503. |

La comprobación de composición valida los campos de los objetos relacionados.
Las consultas directas con `?ids=` comprueban el contrato de lotes de los
proveedores usando los IDs descubiertos. La cantidad y URL de las solicitudes
internas de ms-citas requieren observar el tráfico o los registros HTTP del
laboratorio. Una respuesta compuesta por sí sola no demuestra cuántas llamadas
internas se hicieron.

### Si se interrumpe la ejecución

Los IDs propios se guardan inmediatamente después de una creación 201, antes
de comprobar el resto de la respuesta. Una nueva creación se omite si su
variable ya contiene un ID pendiente.

Conservar las variables, establecer `modoLimpieza=true` y
`permitirEscritura=true`. En **03 - Limpieza de una ejecución interrumpida**,
seleccionar solo las peticiones cuyos IDs sigan pendientes.
La limpieza elimina esos registros y vacía sus variables. Si recibe 404, vacía
la referencia local y señala que el 204 esperado no se obtuvo.
Después devolver `modoLimpieza=false` y repetir el recorrido normal.
La cita manual se limpia mediante la carpeta 92.

Los IDs generados deben permanecer asociados al mismo entorno y base de datos.
Antes de cambiar entre local y Gateway, completar la limpieza y vaciar las
variables generadas. Una pérdida de conexión justo después de un POST puede
impedir capturar el ID. En ese caso, el responsable del laboratorio debe revisar
la base de pruebas antes de repetir.

## Proveedor detenido y recuperación

Realizar este procedimiento únicamente en un laboratorio autorizado.
Las carpetas manuales se omiten con la configuración predeterminada.

1. Con todos los proveedores disponibles, ejecutar 00 y 01, conservar los
   valores de variables y activar `permitirEscritura=true`.
2. Establecer `modoFalloPacientes=preparar` y ejecutar únicamente la carpeta 90.
   Se crea una cita propia cancelada y se captura `citaManualId`.
3. La persona responsable del laboratorio detiene ms-pacientes por los medios
   habituales del entorno. Mantener ms-citas y ms-medicos disponibles.
4. Establecer `modoFalloPacientes=detenido` y ejecutar únicamente la carpeta 91.
   El caso 24 exige 200, paciente `null`, médico disponible y
   `aviso` con `ms-pacientes no disponible` en la cita propia.
   El caso 25 exige 503 y el error `ms-pacientes no está disponible`.
5. Reiniciar ms-pacientes y comprobar su recuperación. Establecer
   `modoFalloPacientes=limpiar` y ejecutar únicamente la carpeta 92 para eliminar
   la cita manual.
6. Vaciar `modoFalloPacientes` y devolver `permitirEscritura=false`.

## Interpretación de resultados

Una petición aprobada debe tener el código esperado y superar sus aserciones.
Los errores se verifican mediante `error` y, para datos inválidos, `detalles`,
según los controladores actuales.

- Un login fallido requiere revisar credenciales, cuenta activa y rol.
- Un 401 posterior al login requiere comprobar expiración y clave JWT compartida.
- Un 403 esperado en el caso 18 confirma el rechazo del rol médico.
- Un 409 inesperado requiere repetir la preparación de horarios en el laboratorio.
- Un 502 o 503 en el recorrido normal requiere revisar proveedores y sus URLs.
- Una petición omitida por `skipRequest` no cuenta como prueba aprobada.
  Revisar las opciones de ejecución, las variables pendientes y la consola.
- Registrar los casos manuales y Health omitidos por separado.

El JSON importable y los scripts comprobados estáticamente no sustituyen la
ejecución completa con cuentas y bases de pruebas reales. Una ejecución con
repositorios en memoria verifica el flujo de la colección, pero deja pendiente
la comprobación de MySQL y del despliegue real.

La omisión condicional utiliza la API documentada por Postman.
[Referencia oficial de pm.execution](https://learning.postman.com/docs/tests-and-scripts/write-scripts/postman-sandbox-reference/pm-execution/)
