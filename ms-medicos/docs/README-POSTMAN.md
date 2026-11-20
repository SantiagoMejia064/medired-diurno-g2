# Médicos en Postman - Taller 3

Responsable: **Jean Carlo Caicedo Chantre**.

Este paquete sigue el modelo de Historias: el environment contiene las URLs,
las cuentas y los tokens; los logins renuevan los JWT; los IDs y marcas de datos
propios se conservan en la colección. No hay que copiar tokens ni escoger IDs
fijos. No crea, modifica ni elimina cuentas de Usuarios.

## Archivos para importar

- [Colección de Médicos](ms-medicos.postman_collection.json).
- [Gateway](MediRed-Medicos-Gateway.postman_environment.json), para las VMs.
- [Local](MediRed-Medicos-Local.postman_environment.json), solo si Usuarios y
  Médicos corren en el equipo de Postman o su Agent.

En Postman usar **Import > files**. La colección se llama **MediRed IPS - Médicos
- Pruebas normales**. La colección antigua `Collection ms-medicos` se conserva
como antecedente; no usarla para esta guía, porque mantiene URLs e IDs fijos.
Si una colección anterior conserva datos pendientes, limpiarlos antes de
reemplazarla: importar otra no transfiere sus variables de ejecución.

## Environment y cuentas

| Variable | Gateway | Local |
|---|---|---|
| `medicos_url` | `http://app.medired.com/api` | `http://127.0.0.1:3003` |
| `usuarios_url` | `http://app.medired.com/api` | `http://127.0.0.1:3001` |
| `health_url` | Vacío: se omite | `http://127.0.0.1:3003/health` |

Las URLs no llevan barra final ni `/medicos` o `/usuarios`. Las solicitudes
añaden esas rutas. El Gateway no publica `/api/health`; no cambiar su vacío por
esa URL. Para comprobar salud en servidor2 usar:

```bash
curl -i http://127.0.0.1:3003/health
```

Completar como valores **locales** las cuentas existentes del laboratorio:

| Rol real de la cuenta | Correo | Contraseña | Token generado |
|---|---|---|---|
| administrador | `admin_email` | `admin_password` | `token_administrador` |
| admisiones | `admisiones_email` | `admisiones_password` | `token_admisiones` |
| medico | `medico_email` | `medico_password` | `token_medico` |

Estos son roles que acceden a Médicos, no URLs de otros microservicios. Los
correos incluidos son ejemplos editables: escribirlos no crea una cuenta.
Las contraseñas y los JWT del paquete están vacíos y marcados como sensibles.
No introducirlos en los JSON compartidos ni subirlos al repositorio.

Las tres cuentas deben estar activas y tener sus roles correctos. Obtener sus
credenciales vigentes del responsable del laboratorio. Si falta una cuenta,
prepararla con él siguiendo [Usuarios](../../ms-usuarios/README.md) y
[la preparación de cuentas de Historias](../../ms-historias/docs/README-POSTMAN.md#cómo-preparar-las-cuentas-para-iniciar-sesión).
No recrear cuentas existentes ni restablecer sus contraseñas para probar.

Usuarios y Médicos necesitan el mismo `JWT_SECRET`; Usuarios debe admitir los
roles del grupo (`administrador,admisiones,medico`). El cliente debe resolver
`app.medired.com` y tener acceso a las VMs. Importar los archivos no inicia las
VMs, los servicios ni MySQL.

## Ejecutar Run Collection

1. Elegir **MediRed-Medicos-Gateway** arriba a la derecha. Comprobar las URLs y
   completar las seis variables de credenciales con cuentas reales de prueba.
2. Mantener Usuarios y Médicos activos. Utilizar una base de laboratorio y
   ejecutar una sola corrida a la vez, sin procesos que creen médicos concurrentemente.
3. Abrir **MediRed IPS - Médicos - Pruebas normales > Run collection**.
4. Seleccionar solo las carpetas **00 a 04**, en orden. Configurar **1 iteración**,
   sin archivo de datos. Activar **Keep variable values / conservar valores**
   para poder recuperar los IDs si se interrumpe.
5. Ejecutar. Los logins comprueban HTTP 200, JWT y rol; si uno falla, el Runner
   se detiene antes del CRUD. Si falta una credencial, se bloquea antes de enviar.
6. Revisar Summary, fallos, errores y omisiones. Anotar ID y registro del caso
   **Crear médico**; se imprimen también en la consola sin imprimir contraseñas.
7. Confirmar **Eliminar médico existente: 204**, **Confirmar eliminación del
   médico: 404** y **Eliminar médico inexistente: 404**. La variable
   `ultimoMedicoEliminadoId` conserva el ID de la evidencia.
8. Guardar la captura del Run Summary y completar el registro de resultados
   de esta guía. No publicar los valores de Authorization, passwords o JWT.
   Antes de exportar, vaciar los tres tokens y las contraseñas de la copia.

El recorrido normal tiene **33 solicitudes configuradas**. En Gateway se envían
**32** si todo el flujo continúa, y Health se omite por estar vacío; con salud
local se envían 33. La carpeta 90 contiene otras tres solicitudes de recuperación
y no forma parte de la corrida normal. La última solicitud normal detiene el
Runner para impedir que encadene esa carpeta accidentalmente.

Una solicitud puede tener varias aserciones. Los números configurados o los
resultados locales de abajo no sustituyen los observados en las VMs. Un login
fallido, un script con error o un caso omitido no acredita una corrida completa.

## Verificación de archivos y ejecución por consola

Desde la raíz del repositorio, revisar los archivos con Node.js sin instalar
paquetes ni iniciar servicios:

```powershell
node ms-medicos/docs/verificar-postman.cjs
```

Comprueba ambos environments, variables duplicadas o ausentes, URLs
parametrizadas, ausencia de contraseñas y JWT compartidos, aserciones por
solicitud y sintaxis de scripts. Son 36 solicitudes contando recuperación
(33 normales y 3 de recuperación). Es una revisión estática; no prueba la API.

Para ejecutar las pruebas HTTP por consola, exportar desde Postman una **copia
privada** del environment con las credenciales de prueba. Verificar que la
exportación incluya los valores locales requeridos. Crear fuera del repositorio
la carpeta `$env:TEMP\medired-medicos` y guardar allí
`environment.privado.json`. Con Usuarios y Médicos activos, ejecutar:

```powershell
npx --yes newman@6 run ms-medicos/docs/ms-medicos.postman_collection.json -e "$env:TEMP\medired-medicos\environment.privado.json" --folder "00 - Acceso" --folder "01 - Salud opcional" --folder "02 - Preparación y CRUD" --folder "03 - Seguridad y roles" --folder "04 - Limpieza final" --iteration-count 1 --export-collection "$env:TEMP\medired-medicos\coleccion.estado.json"
```

La primera ejecución de `npx` descarga Newman si falta. La salida 0 indica una
corrida sin fallos; los HTTP negativos esperados pasan si sus aserciones pasan.
No agregar `--bail`: un fallo de aserción debe permitir alcanzar la limpieza
cuando los controles de propiedad lo permitan. Los errores de preparación y
login detienen el flujo mediante los propios scripts.

Newman no actualiza los JSON originales. Si queda un médico pendiente, usar
**la colección exportada con estado**, el mismo environment y destino:

```powershell
npx --yes newman@6 run "$env:TEMP\medired-medicos\coleccion.estado.json" -e "$env:TEMP\medired-medicos\environment.privado.json" --folder "90 - Recuperación y limpieza" --export-collection "$env:TEMP\medired-medicos\coleccion.recuperada.json"
```

No iniciar otra corrida desde el JSON original hasta comprobar la limpieza.
Un cierre forzado puede impedir la exportación: revisar entonces el ID y registro
de la consola con el responsable antes de repetir. La copia privada contiene
credenciales; no compartirla ni incorporarla a Git. Los reportes también pueden
contener cuerpos de login y tokens.

La revisión del 20 de noviembre de 2026 comprobó 36 solicitudes, 65 scripts y
dos environments con el verificador. Además, Newman ejecutó el environment
compartido sin credenciales: produjo el fallo de preparación esperado y
**cero solicitudes HTTP**, confirmando el bloqueo previo a la red. Esta revisión
no repitió las corridas HTTP del registro previo de abajo ni acredita las VMs.

## Cobertura

| Carpeta | Qué comprueba |
|---|---|
| 00 - Acceso | Login y rol de Administrador, Admisiones y Médico |
| 01 - Salud opcional | 200 público y objeto `ms-medicos` / `ok`, si hay URL |
| 02 - Preparación y CRUD | Listado, creación 201 con Location, consulta por ID, lote y filtro 200, inexistente 404, IDs inválidos 400, duplicado 409, validaciones 400, actualización 200 y consulta persistida |
| 03 - Seguridad y roles | Sin token e inválido 401; Admisiones y Médico consultan 200 y no pueden POST, PUT ni DELETE (403) |
| 04 - Limpieza final | Verificación de propiedad, DELETE 204, consulta posterior y repetición DELETE 404 |
| 90 - Recuperación y limpieza | Login administrador, verificar propiedad y eliminar solo el ID pendiente |

Los 400, 401, 403, 404 y 409 son correctos si el caso espera ese código y pasan
sus comprobaciones. Los errores validan también el contrato JSON y, en las
validaciones de entrada, `detalles`. El filtro se prueba con `General`, valor
válido para el médico sintético; no depende de que haya datos previos.

## IDs, repetición y recuperación

El listado calcula `medicoInexistenteId` con margen sobre los IDs observados.
La colección genera una `registroPrueba` única y crea su propio médico. Antes
de actualizar o eliminarlo, un GET verifica ID, registro, nombre, especialidad
y sede esperados. No se reutiliza la verificación de una consulta anterior si
la nueva falla. Un ID del environment no reemplaza el ID creado por la colección.

Los IDs pendientes quedan ligados a `origenMedicos` y `origenUsuarios`. Cambiar
de Gateway o de Local con un registro pendiente bloquea la ejecución. No editar
las variables internas para apuntarlas a médicos existentes.

Si se interrumpe después de crear:

1. Conservar el mismo environment y la colección con `medicoPruebaId` y su marca.
2. Abrir el Runner y seleccionar **solo 90 - Recuperación y limpieza**.
3. Ejecutar una iteración. Renueva el token administrador, consulta el registro
   y comprueba su propiedad antes del DELETE. Si el GET responde 404, registra
   que ya no existe y limpia el estado. Si no coincide la marca, se detiene.
4. Confirmar el resultado, conservar el ID en la evidencia y después repetir
   el recorrido normal 00 a 04.

Si se pierde la respuesta de un POST, puede existir un médico sin ID capturado.
La bandera `creacionPendiente=true` impide repetir. Con el responsable, localizar
el registro por `registroPrueba` en el listado/base del mismo entorno y verificar
sus atributos. Si existe, guardar su ID en `medicoPruebaId` para recuperarlo con
90. Si se confirma que no se creó o ya se limpió, vaciar la bandera. No vaciarla
sin revisar la base: podría duplicar registros en la siguiente corrida.

## Diagnóstico

- **401 en login:** revisar contraseña vigente, correo y cuenta activa.
- **200 en login y 401 en Médicos:** comprobar expiración y `JWT_SECRET` compartido.
- **Rol incorrecto:** utilizar otra cuenta del rol esperado; no cambiar la cuenta compartida.
- **502/503 en el Run normal:** revisar Apache, `systemctl` y conexión a MySQL.
- **Bloqueo por pendientes:** recuperar con 90 en el destino original.
- **No tests found:** comprobar que se importó `ms-medicos.postman_collection.json`
  y no la colección antigua sin scripts.
- **Health con `No response` / `Request could not be sent`:** en Gateway dejar
  `health_url` vacío y comprobar la omisión de esa solicitud. No contar ese caso
  como una prueba de salud aprobada; verificar `/health` desde servidor2.

## Evidencias de la prueba 5 y alcance

Guardar el Run Summary por Gateway con nombre de colección, environment y fecha,
distinguiendo solicitudes ejecutadas/omitidas, aserciones aprobadas/fallidas y
errores efectivamente observados. En servidor2, capturar la misma franja del log:

```bash
sudo tail -n 120 /var/log/apache2/app_access.log
sudo journalctl -u ms-medicos -n 80 --no-pager -o cat
```

Las líneas `/api/medicos` de Apache acreditan el paso por Gateway. El journal
registra los IDs atendidos. La consulta directa de lotes del Run no demuestra
cuántas llamadas hizo Citas o Historias: esa evidencia requiere listar desde
el frontend con `journalctl -u ms-medicos -f -n 0 -o cat` abierto y contar las
peticiones `GET /medicos?ids=...` de ese intervalo.

La caída/recuperación de Médicos, los avisos y 503 del consumidor, el reinicio de
la VM, MySQL, systemd y las pantallas son pruebas separadas del taller. Coordinar
esas acciones con el grupo; este paquete no detiene servicios ni reinicia VMs.
Los resultados de Historias aportados por su compañero no se atribuyen al Run
de Médicos.

## Resultado observado del Run por Gateway

Las capturas aportadas por Jean Carlo documentan la corrida del **20/11/2026
a las 11:08:28**, con el environment **MediRed-Medicos-Gateway**. Se incorporaron
cinco capturas y sus descripciones en **4.4 → Colección de Médicos** del
[informe grupal](https://docs.google.com/document/d/1wJnxB_ue1IBxv_uGBivCLjmemXGvGERf0AK3J5bTovA/edit).
La evidencia corresponde a esa corrida; no acredita automáticamente una nueva
ejecución de todos los casos del JSON actual.

| Campo | Resultado observado en las capturas |
|---|---|
| Autor | Jean Carlo Caicedo Chantre |
| Fecha y hora del Run | 20/11/2026, 11:08:28 |
| Colección y environment | Run de Médicos con aserciones; `MediRed-Medicos-Gateway`. La captura no identifica la versión ni la huella del JSON ejecutado. |
| Destino | `http://app.medired.com/api/medicos` |
| Iteraciones y duración | 1 iteración; 1 s 956 ms |
| Tiempo medio de respuesta | 8 ms, según el resumen del Runner |
| Solicitudes ejecutadas / omitidas | El total de solicitudes HTTP no está visible; no deducirlo del contador de tests. |
| Aserciones aprobadas / fallidas | **62 aprobadas / 0 fallidas**; el resumen también muestra 0 skipped. |
| Errores reportados | **0** en el resumen; la solicitud de salud aparece sin respuesta, como se aclara abajo. |
| ID y marca creados | **ID 21**. La comprobación de ID y marca muestra PASS; el valor literal de la marca no aparece. |
| Limpieza comprobada | DELETE del ID 21: **204**, sin cuerpo; GET posterior: **404**; repetición del DELETE: **404**, con aserciones PASS. |
| Evidencia disponible | Cinco capturas del Run en el punto 4.4 del informe. Los logs Apache/journal de esa misma franja no están incluidos en las capturas del Runner. |

### Casos visibles en las capturas seleccionadas

| Captura del 20/11/2026 | Evidencia |
|---|---|
| `110843.png` | Listado 200; creación 201 con ID 21 y Location; consulta por ID y lote `?ids=21` con 200; ID inexistente con 404. |
| `110907.png` | ID y lote inválidos con 400; filtro por General con 200; registro duplicado con 409; especialidad ausente y sede incorrecta con 400. |
| `110920.png` | Verificación de propiedad, PUT y lectura posterior con 200; sede persistida; actualización inexistente con 404; consulta sin token con 401. |
| `110932.png` | Token inválido con 401; Admisiones consulta con 200 y recibe 403 al crear, actualizar y eliminar; Médico consulta con 200. |
| `110956.png` | Médico recibe 403 al actualizar y eliminar; verificación previa del registro propio; limpieza del ID 21 y comprobaciones 204/404/404. |

Los nombres originales comienzan con `Captura de pantalla 2026-11-20 ` y
proceden de `Screenshots.rar`. Se excluyó `105124.png` porque corresponde a una
corrida anterior de `Collection ms-medicos` con **All tests 0 / No tests found**:
sus respuestas HTTP no acreditan aserciones automatizadas. Se excluyó también
`110945.png` por solaparse con la captura final `110956.png`, que muestra la
repetición del DELETE y su 404 completos.

### Alcance y diferencias con la verificación local

En `110843.png`, **Estado del servicio** muestra `{{health_url}}`, `No response`
y `Request could not be sent`. Aunque el resumen indique cero errores, esta
solicitud **no demuestra que `/health` haya respondido**. La salud interna y el
estado systemd se documentan por separado en la sección 3 del informe; no se
atribuyen a este Run. El environment Gateway compartido mantiene `health_url`
vacío y la colección actual tiene un script para omitir esa solicitud.

Las capturas seleccionadas no muestran los logins de los tres roles ni el
total de solicitudes enviadas. Por ello se conservan los **62 PASS observados**,
sin afirmar que sean las 68 aserciones de las corridas locales de abajo. Una
nueva corrida completa debe incluir las carpetas 00 a 04 y guardar su propio
resumen; no se modifica el resultado histórico para igualar otros conteos.

La consulta `?ids=21` acredita el endpoint de lotes desde Postman. No demuestra
que Citas o Historias hayan originado una consulta entre servicios: esa
comprobación requiere la evidencia del journal descrita anteriormente.

## Verificación local de este paquete

Se verificó con Newman contra las aplicaciones Express de Usuarios y Médicos
del repositorio, sustituyendo únicamente sus repositorios por datos temporales
en memoria. No se usaron las cuentas ni las bases del laboratorio.

| Ejecución temporal | Solicitudes enviadas | Aserciones aprobadas | Fallidas / errores |
|---|---:|---:|---:|
| Normal sin Health, primera corrida | 32 | 68 | 0 / 0 |
| Normal sin Health, repetición con estado conservado | 32 | 68 | 0 / 0 |
| Normal con Health local | 33 | 70 | 0 / 0 |
| Recuperación de corrida interrumpida | 3 | 6 | 0 / 0 |

También se comprobó que un login incorrecto detiene el flujo sin escrituras,
que una corrida pendiente no puede repetirse, que el cambio de destino y los
atributos de un registro distinto bloquean la limpieza, y que una creación
ambigua impide repetir. Un ID ajeno en el environment no sustituyó el ID propio.
Al terminar se conservaron los registros preexistentes y se eliminaron los
registros sintéticos. Se comprobó la sintaxis de los 65 scripts.

El [registro de verificación](VERIFICACION-POSTMAN.json) contiene solo conteos,
alcance y la huella SHA-256 de la colección, sin credenciales ni tokens.
Estas comprobaciones locales **no acreditan** MySQL, Apache ni conectividad
con las VMs. La evidencia del Run de laboratorio de Jean Carlo se registra
por separado en «Resultado observado del Run por Gateway», con sus alcances
y limitaciones; los conteos de ambos entornos no se intercambian.
