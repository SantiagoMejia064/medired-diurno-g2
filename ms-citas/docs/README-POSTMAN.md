# Pruebas reproducibles de ms-citas

Esta guía acompaña la colección canónica
[MediRed-IPS-ms-citas.postman_collection.json](MediRed-IPS-ms-citas.postman_collection.json),
en formato Postman Collection v2.1. Santiago Mejía Suárez es responsable de ms-citas.
Para comprobar el despliegue del Taller 3, utilizar preferentemente el environment
**MediRed-Citas-Gateway**, con `http://app.medired.com/api`. Apache recibe las
peticiones públicas y las redirige a los microservicios desplegados en las
máquinas virtuales. Local queda como alternativa para desarrollo y depuración.

## Inventario de archivos

La revisión recursiva de `ms-citas/docs/` del 20 de noviembre de 2026 encontró
cinco archivos y ninguna subcarpeta.

| Archivo | Finalidad y momento de importación |
| --- | --- |
| [MediRed-IPS-ms-citas.postman_collection.json](MediRed-IPS-ms-citas.postman_collection.json) | Colección principal, **MediRed IPS · ms-citas · pruebas reproducibles**, con 41 solicitudes. Importar para las pruebas de Citas. |
| [MediRed-Citas-Gateway.postman_environment.json](MediRed-Citas-Gateway.postman_environment.json) | Environment recomendado para acceder al despliegue mediante Apache. Importar junto con la colección principal. |
| [MediRed-Citas-Local.postman_environment.json](MediRed-Citas-Local.postman_environment.json) | Environment alternativo para servicios ejecutados en el equipo de Postman o su Agent. Importar cuando se necesite desarrollo o depuración local. |
| [ms-usuarios-acceso-citas.postman_collection.json](ms-usuarios-acceso-citas.postman_collection.json) | Colección auxiliar **MediRed IPS - Usuarios - Acceso para Citas**, con 6 solicitudes. Importar solo para consultar cuentas y preparar Médico o Admisiones si faltan, con un administrador existente. |
| [README-POSTMAN.md](README-POSTMAN.md) | Esta guía de configuración, ejecución y resultados. Consultarla antes de probar. |

Los environments habilitan `permitirEscritura=true` para el CRUD del laboratorio.
Las contraseñas vienen vacías y marcadas como sensibles. Completar las tres cuentas
antes de ejecutar. Los correos son ejemplos editables. Los tokens e IDs se generan
automáticamente dentro de cada colección.

## Preparar otro computador

1. Instalar una versión actual de Postman Desktop que admita
   `pm.execution.skipRequest()`. Con Postman Web, utilizar el Desktop Agent para
   acceder a servicios locales.
2. Disponer de ms-usuarios, ms-citas, ms-pacientes y ms-medicos, sus bases de datos
   de pruebas y un `JWT_SECRET` compartido. Seguir las instrucciones de instalación
   existentes en cada servicio.
3. Preparar tres cuentas activas de prueba en ms-usuarios, una con rol
   `administrador`, otra con rol `medico` y otra con rol `admisiones`. Obtener sus
   credenciales de la persona responsable del entorno. La colección utiliza cuentas existentes.
4. Tener al menos un paciente y un médico registrados. La preparación consulta
   sus listados, selecciona una referencia de cada uno y calcula un paciente
   inexistente a partir del máximo ID. No exige IDs específicos.
5. En cada entorno, configurar `ROLES=administrador,admisiones,medico` en el
   `.env` privado de ms-usuarios, según su [.env.example](../../ms-usuarios/.env.example).
6. Seguir la importación del environment Gateway descrita más adelante. Los
   servicios y sus bases deben estar disponibles en las VMs. Para la instalación,
   consultar la [guía de despliegue](../../deploy/README.md).

Los POST, PUT y DELETE deben ejecutarse sobre una base de datos de pruebas o
contar con autorización explícita del responsable. El recorrido completo está
pensado para un laboratorio aislado. No ejecutar escrituras ni detener
proveedores en producción. La colección exportada trae
`permitirEscritura=false`.

## Variables y credenciales

Importar y seleccionar el environment Gateway de este paquete. Introducir las
credenciales como valores locales, marcando las contraseñas como sensibles. Mantener vacíos los
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
| `admisionesEmail`, `admisionesPassword` | Credenciales locales de la cuenta de Admisiones. |
| `permitirEscritura` | `true` para autorizar las pruebas POST/PUT/DELETE. El login siempre está habilitado. |
| `modoLimpieza` | `false` normalmente. `true` solo para limpiar una ejecución interrumpida. |
| `modoFalloPacientes` | Vacío normalmente. Admite `preparar`, `detenido` o `limpiar` durante la comprobación manual. |

Los scripts generan las siguientes variables de colección. Mantenerlas vacías
al importar y dejar que los scripts las administren. No introducir IDs de
registros existentes para utilizarlos como citas de prueba.

| Variables generadas | Uso |
| --- | --- |
| `tokenAdmin`, `tokenMedico`, `tokenAdmisiones` | JWT obtenidos mediante login. |
| `pacienteId`, `medicoId` | Referencias seleccionadas en los listados de proveedores. |
| `pacienteInexistenteId`, `citaInexistenteId` | IDs calculados para los casos negativos. |
| `fechaPrueba`, `fechaAuxiliar` | Dos horarios futuros libres para el mismo médico. |
| `citaId` | Cita principal creada por el caso 06. |
| `citaAuxId` | Cita creada por el caso 19 para probar conflictos en PUT. |
| `citaReferenciasId` | Cita cancelada del caso 20, que no bloquea el horario. |
| `citaManualId` | Cita cancelada para la prueba manual de degradación. |
| `origenDatos` | URLs de Citas, login, Pacientes y Médicos asociadas a los IDs propios. |
| `citaIdPropia`, `citaAuxIdPropia`, `citaReferenciasIdPropia`, `citaManualIdPropia` | Paciente, médico y fecha capturados al crear cada registro, utilizados para comprobar la limpieza. |

Los scripts trasladan estas variables generadas al ámbito local de cada
petición para evitar que un valor antiguo del entorno o de un archivo de datos
reemplace el ID o token recién obtenido.

### Entorno recomendado por Gateway Apache

1. En Postman, pulsar **Import** y seleccionar
   `MediRed-IPS-ms-citas.postman_collection.json` desde esta carpeta.
2. Importar `MediRed-Citas-Gateway.postman_environment.json`.
3. En el selector de environments, arriba a la derecha, elegir
   **MediRed-Citas-Gateway**. Confirmar que las URLs corresponden a la tabla.
4. Completar `adminEmail`, `adminPassword`, `medicoEmail`, `medicoPassword`,
   `admisionesEmail` y `admisionesPassword` con las cuentas vigentes del laboratorio.
5. Conservar `permitirEscritura=true`, `modoLimpieza=false` y
   `modoFalloPacientes` vacío para el recorrido normal. Dejar `healthUrl` vacío
   con el Gateway actual.

| Variable | Valor |
| --- | --- |
| `baseUrl` | `http://app.medired.com/api` |
| `loginUrl` | `http://app.medired.com/api/usuarios/login` |
| `pacientesUrl` | `http://app.medired.com/api` |
| `medicosUrl` | `http://app.medired.com/api` |
| `healthUrl` | Vacío, se omite **Health público**. |

El computador debe resolver `app.medired.com` según la configuración DNS del
despliegue. Las peticiones añaden sus rutas, por ejemplo `{{baseUrl}}/citas`.
Usar las direcciones equivalentes de un despliegue de pruebas para ejecutar
el recorrido completo por Gateway.

La [configuración de Apache del repositorio](../../deploy/apache/app.conf)
publica los recursos `/api/usuarios`,
`/api/pacientes`, `/api/medicos`, `/api/citas` y `/api/historias`.
No publica `/api/health`. Por eso `healthUrl` es independiente.
Configurar una dirección de salud accesible desde el equipo que ejecuta Postman,
por ejemplo mediante un túnel autorizado al puerto local del servicio.
Si no existe ese acceso, dejar `healthUrl` vacío. **Health público** se omite
automáticamente. Comprobar
`GET /health` desde el servidor de aplicaciones. Registrar esa omisión en el
resultado.

### Entorno Local para desarrollo y depuración

Importar `MediRed-Citas-Local.postman_environment.json` y seleccionar
**MediRed-Citas-Local** cuando se trabaje con servicios locales. Deben estar
disponibles Usuarios, Pacientes, Médicos y Citas, con sus bases preparadas y la
misma clave JWT, en el equipo donde corre Postman o su Desktop Agent.
Este recorrido permite depurar las APIs directamente. La comprobación del
despliegue del Taller 3 se realiza mediante Gateway.

| Variable | Valor |
| --- | --- |
| `baseUrl` | `http://127.0.0.1:3004` |
| `loginUrl` | `http://127.0.0.1:3001/usuarios/login` |
| `pacientesUrl` | `http://127.0.0.1:3002` |
| `medicosUrl` | `http://127.0.0.1:3003` |
| `healthUrl` | `http://127.0.0.1:3004/health` |

## Autenticación automática y solicitudes individuales

En **00 - Autenticación**, ejecutar **Login administrador**, **Login médico** y
**Login admisiones**, en ese orden. Cada solicitud hace `POST {{loginUrl}}`,
enviando las credenciales correspondientes del environment como `email` y `password`.
Los scripts serializan esos valores como JSON y utilizan **No Auth** en los logins.

| Login | Credenciales del environment | Token guardado en la colección |
| --- | --- | --- |
| Administrador | `adminEmail`, `adminPassword` | `tokenAdmin` |
| Médico | `medicoEmail`, `medicoPassword` | `tokenMedico` |
| Admisiones | `admisionesEmail`, `admisionesPassword` | `tokenAdmisiones` |

Cada login borra primero su token anterior. La respuesta debe tener HTTP 200,
`token` como cadena con tres segmentos separados por puntos y `usuario.rol` igual
al rol esperado. Solo entonces se guarda el token mediante `pm.collectionVariables`.
Las peticiones siguientes lo recuperan automáticamente. Las cuentas deben existir,
estar activas y pertenecer al rol esperado, y Usuarios debe ser accesible desde Postman.
Los servicios deben verificar los JWT con la clave compartida.

Si faltan credenciales, el script omite la solicitud y muestra un error en la
consola. Si falla la validación del login, se descarta el token y se detiene el
Runner. Con **Send**, corregir el acceso antes de continuar manualmente.

Para solicitudes individuales, seleccionar una petición y pulsar **Send**. Tras
los tres logins, ejecutar en orden las tres solicitudes de **01 - Preparación de
datos**. Después seguir el orden de **02 - Pruebas normales** para disponer de
los IDs que requieren las consultas, actualizaciones y eliminaciones. Por ejemplo,
**02 - Obtener cita propia por ID** necesita la cita creada por **06 - Crear cita
válida**. Las peticiones aisladas conservan sus scripts y aserciones en
**Test Results**. El envío de una petición protegida por sí solo requiere haber
ejecutado el login correspondiente.

## Ejecución normal con Collection Runner

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

Este es el recorrido automático completo de pruebas normales de la colección.
Las carpetas 03 y 90–92 se ejecutan por separado cuando se necesita recuperar una
corrida o intervenir sobre Pacientes. Sus condiciones de omisión dependen de los
modos del environment, por lo que deben mantenerse fuera de la selección normal.

Las peticiones heredan Bearer `{{tokenAdmin}}`. Admisiones crea, actualiza y elimina
la cita principal, mientras Administrador crea y limpia las auxiliares. Médico
realiza una consulta y un POST que espera 403. Los casos sin token y Health usan
**No Auth**, y el caso 16 utiliza un token deliberadamente inválido.

La preparación calcula horarios aproximadamente 90 días en el futuro y evita
los ya ocupados por el médico, excluyendo citas canceladas. Las fechas se
envían con precisión de minutos, en el formato local del contrato.
Ejecutar sin otros procesos que creen citas o referencias simultáneamente
durante el laboratorio para mantener válidos los casos de ID inexistente y
horario libre.

### Cobertura y orden

El JSON vigente contiene **41 solicitudes guardadas**, distribuidas así.

| Carpeta | Solicitudes guardadas | Uso |
| --- | --- | --- |
| 00 - Autenticación | 3 | Login de los tres roles |
| 01 - Preparación de datos | 3 | Referencias y horarios libres |
| 02 - Pruebas normales | 28 | CRUD, validaciones, permisos, relaciones y limpieza |
| 03 - Limpieza de una ejecución interrumpida | 3 | Recuperar IDs pendientes |
| 90 - Preparación manual de fallo | 1 | Crear cita para degradación |
| 91 - Proveedor detenido (manual) | 2 | Casos 24 y 25 |
| 92 - Limpieza manual de fallo | 1 | Eliminar cita de degradación |
| **Total de la colección principal** | **41** | La auxiliar de Usuarios contiene otras 6 |

El recorrido normal selecciona 34 solicitudes guardadas. Con Gateway y `healthUrl`
vacío, Health se omite y quedan 33 solicitudes enviadas desde esos elementos.
Además, los scripts realizan tres GET previos a las eliminaciones mediante
`pm.sendRequest()`. Esas llamadas pueden elevar el contador HTTP del reporte a 36
en Gateway o 37 con Health habilitado. Las llamadas internas de Citas a Pacientes
y Médicos se observan en los proveedores. Estos recuentos dependen de completar
el recorrido sin otras omisiones ni interrupciones.

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
La colección guarda las cuatro URLs al crear una cita y detiene la ejecución si
cambian mientras hay IDs pendientes. Una nueva corrida normal también se detiene
si quedan citas pendientes. Al recuperar, activar primero `modoLimpieza=true` y
ejecutar los logins para renovar los tokens.

Antes de eliminar cada registro propio, una consulta GET verifica paciente,
médico y fecha contra los atributos capturados al crear. Una diferencia detiene
el Runner. El caso 14 repite directamente el DELETE del caso 13 para comprobar 404.
Si faltan los atributos guardados o los IDs pertenecen a una versión previa,
revisar los registros con el responsable del laboratorio antes de limpiar.
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

Evaluar el código HTTP esperado junto con las aserciones de **Test Results**.
Una solicitud puede ejecutar varias aserciones. El total de solicitudes guardadas
es el inventario de la colección, y el reporte de ejecución muestra las solicitudes
enviadas, sus omisiones y las aserciones evaluadas. Registrar por separado las
aserciones aprobadas, fallidas y los errores de scripts o de conexión.

Si el Runner muestra **No tests found**, esa fila aporta el código HTTP recibido
y carece de aserciones evaluadas. Contabilizar como aprobadas únicamente las
aserciones que el reporte marque como tales.

Los errores se verifican mediante `error` y, para datos inválidos, `detalles`,
según los controladores actuales.

- Un login fallido requiere revisar credenciales, cuenta activa y rol.
- Si falta una credencial, revisar el environment seleccionado y el mensaje
  `Configura ...` en la consola. Los tokens se guardan en la colección que hizo
  login. La auxiliar de Usuarios y la principal de Citas mantienen tokens propios.
- Un 401 posterior al login requiere comprobar expiración y clave JWT compartida.
- Un 200 en login con rol distinto al esperado falla la aserción del rol.
- Una respuesta HTML, un 502/503 de Apache o un error de conexión en login requiere
  revisar DNS, acceso al Gateway, Usuarios y la configuración del proxy.
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


## Preparar cuentas faltantes

Seleccionar el mismo environment en la colección opcional de Usuarios. Con
**Send**, ejecutar el login administrador y el listado. Crear Médico o Admisiones
solo si falta la cuenta, con las credenciales configuradas en el environment y una
contraseña de al menos ocho caracteres. Verificar después los dos logins. Ejecutar
esta preparación petición por petición. Un 409 al crear indica correo registrado
y requiere utilizar la contraseña vigente.

Para el primer administrador, seguir [Usuarios](../../ms-usuarios/README.md).
En una base existente se necesitan sus credenciales vigentes. Los nombres para
las cuentas nuevas se pueden editar en el cuerpo de las peticiones opcionales.

## Ejecución por terminal

Desde la raíz del repositorio, con Postman CLI instalado, configurar las
credenciales únicamente en la copia local del environment Gateway antes de
ejecutar este comando. Retirar esos valores antes de compartir el archivo.

```bash
postman collection run ms-citas/docs/MediRed-IPS-ms-citas.postman_collection.json -e ms-citas/docs/MediRed-Citas-Gateway.postman_environment.json -i "00 - Autenticación" -i "01 - Preparación de datos" -i "02 - Pruebas normales" --no-report-events
```

El comando devuelve un código distinto de cero cuando fallan aserciones. Revisar
también errores de scripts y omisiones. Una corrida CLI interrumpida puede requerir
localizar sus registros en la base de laboratorio. Para recuperación con IDs
conservados entre ejecuciones, utilizar el Runner de Postman Desktop.

## Resultados históricos y evidencia del despliegue

El README anterior dejó registrada la ejecución de dos corridas normales con
Postman CLI contra las aplicaciones Express del repositorio, usando cuentas y
repositorios temporales en memoria.
Cada corrida pasó 83 aserciones con cero fallos, código de salida 0 y cero citas
restantes. Se ejercitaron autenticación, rutas, lógica de negocio y clientes HTTP
entre Usuarios, Pacientes, Médicos y Citas.

| Ejecución | Solicitudes | Aserciones evaluadas | Aprobadas | Fallidas | Entorno y procedencia |
| --- | --- | --- | --- | --- | --- |
| Normal histórica, dos corridas | 34 elementos en el recorrido, con Health, y 3 GET de scripts | 83 por corrida | 83 por corrida | 0 por corrida | Aplicaciones Express con cuentas y repositorios temporales en memoria. Resultado registrado en la versión anterior de este README. |
| Preparación de cuentas histórica | 6 elementos de la auxiliar | 9 | 9 | 0 | Usuarios con repositorio temporal. Resultado registrado en la versión anterior de este README. |
| Corrida completa real por Gateway | Resultado global pendiente de documentar | Pendiente | Pendiente | Pendiente | Se necesita un reporte verificable que identifique el environment Gateway y la ejecución completa. |

En el inventario revisado del repositorio no se encontró un reporte o una captura
con el resumen verificable de una corrida completa de Citas contra las VMs por
Gateway. El resultado de 83 aserciones se conserva como antecedente de la prueba
en memoria. La revisión actual contrastó la documentación con los archivos y
scripts del repositorio.
Los reportes completos de las corridas históricas tampoco se encuentran en `docs/`.

En una actualización previa se corrigió el ID inexistente calculado como máximo
más uno, porque podía quedar ocupado por las creaciones de la propia corrida
antes de probar el PUT 404. El script vigente utiliza un margen de un millón
sobre los IDs observados.

La revisión anterior también registró la comprobación de la preparación de
cuentas, incluida creación y login de Médico y Admisiones, y de los bloqueos por
cambio de destino y atributos de una cita distinta antes de limpiar.

Para documentar Gateway, conservar el resumen del Runner con nombre del environment,
fecha, carpetas seleccionadas, solicitudes ejecutadas y omitidas, aserciones
aprobadas y fallidas y errores. Una captura de códigos HTTP acredita las respuestas
visibles. El resultado global requiere el resumen completo de la ejecución.

Con el mismo recorrido y todas las comprobaciones normales exitosas, omitir Health
reduce en dos las 83 aserciones históricas. Las 81 resultantes son una expectativa
derivada de los scripts actuales. El resultado real debe tomarse del reporte del
laboratorio. La validación de MySQL, Apache, conectividad de las VMs y las carpetas
de caída requiere evidencia de ese entorno.
