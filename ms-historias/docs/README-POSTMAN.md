# Pruebas de Historias para el Taller 3

Responsable: Steven Camilo Franco Bocanegra (`StevenNorduss`).

## Archivos y configuración

Importar en Postman:

- [Pruebas normales](ms-historias.postman_collection.json): login, preparación, CRUD, permisos, relaciones y limpieza automáticos.
- [Reinicio y caída](ms-historias-complementarias.postman_collection.json): carpetas independientes para las pruebas que requieren intervenir en la VM.
- [Preparación opcional de cuentas](ms-usuarios-acceso-historias.postman_collection.json): login de Administrador, consulta y creación de Médico/Admisiones si faltan; no modifica cuentas existentes.
- Uno de los entornos: [Gateway](MediRed-Historias-Gateway.postman_environment.json) o [Local](MediRed-Historias-Local.postman_environment.json).

El entorno contiene solamente URLs, cuentas y tokens. Completar localmente las
contraseñas vigentes de `admin_email` / `admin_password`, `medico_email` /
`medico_password` y `admisiones_email` / `admisiones_password`. Las cuentas deben
existir y tener los roles administrador, medico y admisiones, respectivamente.
Las colecciones de Historias no crean ni modifican usuarios. La colección opcional
de Usuarios permite preparar las cuentas que falten, como se explica más abajo.

Los logins guardan automáticamente `token_administrador`, `token_medico` y
`token_admisiones` en el entorno seleccionado, como en la colección anterior.
No es necesario copiarlos ni cambiar controles entre pruebas. La fecha válida
se calcula automáticamente y los IDs se guardan dentro de cada colección.

| Variable | Gateway | Local |
| --- | --- | --- |
| `usuarios_url` | `http://app.medired.com/api` | `http://127.0.0.1:3001` |
| `pacientes_url` | `http://app.medired.com/api` | `http://127.0.0.1:3002` |
| `medicos_url` | `http://app.medired.com/api` | `http://127.0.0.1:3003` |
| `historias_url` | `http://app.medired.com/api` | `http://127.0.0.1:3005` |
| `health_url` | Vacío: se omite. | `http://127.0.0.1:3005/health` |

Se necesita Postman Desktop actualizado, o Web con Desktop Agent, con soporte
para `pm.execution.skipRequest()`. El equipo debe alcanzar las VMs y resolver
app.medired.com para usar Gateway. Local solo sirve cuando los servicios corren
en el mismo equipo que Postman o su Agent. Apache no publica /api/health en la
configuración actual. La salud también se consulta desde servidor2:

```bash
curl -i http://127.0.0.1:3005/health
```

Si ya utilizabas el entorno anterior, puedes conservar las contraseñas ingresadas:
las nuevas colecciones usan las mismas claves de cuentas y URLs. Puedes eliminar
los antiguos campos de modos, fases, autorización de escritura y fecha del entorno;
los scripts simplificados no los consultan. Los tokens se añaden al hacer login.
Importar una colección nueva no transfiere los IDs guardados en otra colección:
conserva la anterior si aún necesitas limpiar un registro de esa ejecución, como
la historia 17 utilizada en la evidencia de persistencia.

## Cómo preparar las cuentas para iniciar sesión

Los environments sí incluyen las claves `admin_email` y `admin_password`, además de las equivalentes para Médico y Admisiones. Los correos incluidos son ejemplos editables y las contraseñas y tokens están vacíos. La persona que instala el laboratorio debe completar esos valores con cuentas de su propia base; escribir un correo en el entorno no crea un usuario.

### Primer administrador

En una instalación nueva, [ms-usuarios/db/schema.sql](../../ms-usuarios/db/schema.sql) crea la tabla e inserta un administrador inicial: `admin@empresa.com` / `Admin2026*`. Es la cuenta inicial documentada por el proyecto, no una garantía de las credenciales actuales de un servidor ya utilizado. Seguir la preparación de [Usuarios](../../ms-usuarios/README.md) y configurar `ROLES=administrador,admisiones,medico` en su `.env`.

No volver a importar el esquema sobre una base preparada para intentar recuperar un acceso. Si el administrador ya cambió su contraseña, utilizar la vigente. Si no se conoce, solicitarla al responsable del laboratorio antes de continuar: la colección no puede crear al primer administrador sin uno existente.

En la instalación nueva, cambiar la contraseña inicial mediante `PUT {{usuarios_url}}/usuarios/<id_admin>` autenticado como administrador. Obtener el ID y los campos actuales del login o listado; enviar `nombre`, `email`, `rol`, `activo` y la nueva `password` (mínimo ocho caracteres). Conservar los datos vigentes y actualizar `admin_password` en el entorno; volver a iniciar sesión. No ejecutar ese cambio sobre las cuentas compartidas del laboratorio sin coordinarlo.

### Médico y Admisiones

1. Importar **MediRed IPS - Usuarios - Acceso para Historias** y seleccionar el mismo environment Gateway o Local que usa Historias.
2. Completar `admin_email` y `admin_password` con el acceso vigente. Completar `medico_email`, `medico_password`, `admisiones_email` y `admisiones_password` con las cuentas que se usarán; para cuentas nuevas elegir contraseñas de al menos ocho caracteres.
3. Ejecutar con **Send** el login de Administrador. Debe devolver 200 y guarda `token_administrador` automáticamente.
4. Ejecutar **Listar cuentas como Administrador**. Si las cuentas existen, conservarlas y usar sus contraseñas vigentes. No intentar crearlas otra vez.
5. Solo para las que falten, ejecutar **Crear Médico solo si falta** y/o **Crear Admisiones solo si falta**. Cada petición envía los datos del entorno a `POST /usuarios`, con el token administrador, y espera 201. Un 409 significa correo ya registrado; no crea ni actualiza la cuenta y tampoco confirma su contraseña.
6. En **02 - Verificar accesos**, ejecutar los logins de Médico y Admisiones. Cada uno espera 200, comprueba el rol y guarda su token en el entorno. Con los tres accesos listos, ejecutar la colección normal de Historias.

Esta preparación es opcional y se ejecuta petición por petición; no ejecutar toda la colección de Usuarios como si fuera una prueba repetible de creación. Un 401 indica credenciales incorrectas o cuenta inactiva; un 403 al crear requiere revisar el rol del token. La colección no restablece contraseñas ni elimina usuarios. Conserva la finalidad de la colección anterior guardada en stash, adaptada a las variables actuales (`admin_email`, etc.), sin necesidad de restaurar el stash.

## Prueba normal

1. Mantener activos Usuarios, Pacientes, Médicos e Historias, con sus bases
   preparadas y JWT_SECRET compartido. Los proveedores necesitan al menos un
   paciente y un médico ficticios. Citas no es necesario para esta colección.
2. Seleccionar el entorno y completar las tres cuentas.
3. Abrir **MediRed IPS - Historias - Pruebas normales** y elegir **Run collection**,
   una iteración y sin archivo de datos. Conservar el orden.
4. Guardar el resumen y revisar las comprobaciones. Los 400, 401, 403 y 404 de
   casos negativos son correctos si sus pruebas pasan.

La colección elige referencias válidas y crea su historia base. Conserva los casos
01, 02, 04 a 22 y 20b; agrega el CRUD de Administrador. Al terminar limpia los
registros que creó. El caso 03 no se inventa para completar numeración. Los casos
23 y 24 están en la colección complementaria. La limpieza consulta los IDs propios
antes de borrar y verifica la marca de prueba, preservando registros preexistentes.

Este recorrido realiza escrituras en la base de laboratorio. Ejecutar una sola
corrida a la vez, en un entorno de pruebas. El ID de no encontrado se calcula con
margen sobre los máximos observados; evitar cargas concurrentes mientras se prueba.

## Persistencia con dos carpetas

En **MediRed IPS - Historias - Reinicio y caída**:

1. Con los servicios activos, ejecutar **solo 01 - Persistencia preparar** con
   Run, una iteración. Hace login, consulta referencias y crea y actualiza su
   registro. El ID queda guardado automáticamente en esta colección.
2. En servidor2, realizar el reinicio real:

   ```bash
   sudo systemctl restart ms-historias
   systemctl is-active ms-historias
   ```

3. Ejecutar **solo 02 - Persistencia verificar y limpiar**. Hace login, consulta
   el mismo ID y comprueba HTTP 200, ID y motivo actualizado. Después verifica
   la marca y elimina el registro propio.
4. Capturar la consulta y sus comprobaciones junto con la terminal del reinicio.
   No cambiar variables del entorno.

Postman no reinicia la VM ni el servicio. La evidencia de persistencia combina el
reinicio de terminal con la consulta posterior. Ejecutar dos GET seguidos no
acredita un reinicio.

## Caída de Médicos con tres carpetas

En la misma colección complementaria, con Pacientes activo:

1. Con Médicos activo, ejecutar **solo 03 - Caída preparar**. Hace login,
   selecciona referencias y crea una historia propia.
2. Detener Médicos en servidor2, coordinándolo con el equipo:

   ```bash
   sudo systemctl stop ms-medicos
   systemctl is-active ms-medicos
   ```

3. Ejecutar **solo 04 - Médicos detenido verificar**. El caso 23 espera 200 con
   la historia preparada, medico:null y aviso. El caso 24 espera 503 al crear.
4. Reactivar Médicos:

   ```bash
   sudo systemctl start ms-medicos
   systemctl is-active ms-medicos
   ```

5. Ejecutar **solo 05 - Médicos recuperado verificar y limpiar**. Confirma que
   vuelve a estar disponible el médico relacionado y elimina el registro propio.
   No cambiar variables del entorno.

Ejecutar cada carpeta con Run, una iteración. Cada una detiene el Runner al
terminar; ejecutar toda la colección complementaria solamente prepara la prueba
de persistencia y se detiene. Así no se encadenan verificaciones sin realizar
primero el cambio real en la terminal. Si se seleccionan varias carpetas juntas,
solo se ejecuta hasta el final de la primera: para seguir, abrir la siguiente.

## Recuperar una ejecución interrumpida

En la colección que conserva los IDs, ejecutar un login de Médico si venció el
token y luego **solo 90 - Limpieza de registros propios**. En la complementaria,
el login está disponible dentro de cada carpeta y se puede ejecutar con Send.
Restaurar antes los proveedores detenidos. La limpieza acepta 404 si el registro
ya no existe y se detiene si encuentra una marca distinta. Los IDs pendientes
no se usan con una URL de Historias distinta a la de su creación.

La colección normal y la complementaria conservan sus propios IDs y marcas por
separado, y comparten únicamente el entorno de URLs, credenciales y tokens.

## Evidencias y exportación

Conservar resumen normal, reinicio con consulta posterior y casos 23/24 con
Médicos detenido. Las capturas anteriores conservan su fecha y alcance. La versión simplificada
ya tiene evidencia real de la prueba normal y de las tres carpetas de caída y
recuperación del 19 de noviembre; el detalle se registra a continuación.

Para ver consultas por lote, abrir el registro de los proveedores en servidor2
y ejecutar una vez el caso 22 o listar Historias desde el navegador:

```bash
sudo journalctl -u ms-pacientes -u ms-medicos -f -n 0 -o cat
```

Debe aparecer una GET ?ids= a cada proveedor por listado. El JSON de Postman por
sí solo no demuestra cuántas llamadas internas hubo. Los mensajes del navegador
se prueban en el frontend. La captura de un POST 503 de Postman no sustituye el
mensaje de ese error en la interfaz.

Los archivos compartidos incluyen contraseñas y tokens vacíos. Conservarlos así
en Git: los valores introducidos y generados en Postman son privados del entorno.
Al exportar una copia propia, retirar passwords y tokens reales. Las capturas entregadas por Steven se conservan tal como fueron aportadas,
incluidas las que muestran Authorization; sus valores no se transcriben en esta guía.

Referencia: [control del Runner de Postman](https://learning.postman.com/docs/tests-and-scripts/write-scripts/postman-sandbox-reference/pm-execution/).


## Resultados de laboratorio aportados el 19 de noviembre de 2026

Ejecutor: Steven Camilo Franco Bocanegra. Entorno: MediRed-Historias-Gateway, VMs del laboratorio, acceso mediante `http://app.medired.com/api`. Las capturas se conservan en el material personal de Steven y no forman parte de este paquete del repositorio.

| Ejecución | Passed | Failed / Errors | Captura |
| --- | --- | --- | --- |
| Pruebas normales simplificadas | 73 | 0 / 0 | `223823` |
| 03 - Caída preparar | 7 | 0 / 0 | `223931` |
| 04 - Médicos detenido verificar | 7 | 0 / 0 | `224037` |
| 05 - Médicos recuperado verificar y limpiar | 5 | 0 / 0 | `224123` |

Cada código de captura completa el nombre `Captura de pantalla 2026-11-19 HHMMSS.png`. Passed cuenta comprobaciones, no peticiones. En la caída, el 503 es el resultado esperado de la prueba negativa: no es un fallo del Runner. La recuperación comprueba el médico relacionado y elimina la historia propia 23 con 204.

La persistencia ya se observó con reinicio real y consulta del mismo registro en evidencias anteriores, incluida la historia 17 con tres comprobaciones aprobadas antes de simplificar el paquete. No se ha aportado una nueva corrida de las carpetas 01 y 02 simplificadas; queda pendiente esa evidencia si se desea documentar específicamente ese recorrido. No hace falta repetir la prueba normal y la caída solo por actualizar esta guía.

Las capturas del navegador complementan Postman: `224435` muestra el mensaje de indisponibilidad al intentar guardar, `224637` la atención guardada después de recuperar Médicos, `225316` GET 200 al gateway con Authorization y `225509` las consultas por lote a los proveedores. La captura del formulario no muestra un código HTTP: el 503 está acreditado en Postman. `224915` acredita Apache con DirectoryIndex y Syntax OK; `225016`, acceso a login desde la raíz en incógnito.

La nueva colección opcional de preparación de Usuarios fue revisada estáticamente contra las rutas y validaciones del servicio; no se ejecutó en las VMs durante esta revisión. Los resultados anteriores corresponden a las pruebas de Historias.

El paquete permite reproducir las pruebas cuando existe conectividad a ese laboratorio. Importar la colección desde otra red no inicia las VMs ni crea sus bases o cuentas. Quedan por coordinar la prueba de un compañero siguiendo el README y la integración del informe grupal. Esta revisión es local y no implica commit ni publicación.
