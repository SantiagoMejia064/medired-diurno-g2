
# ms-medicos — MediRed IPS

Microservicio REST encargado de gestionar los médicos de **MediRed IPS**. Este README documenta el contrato de la API, las decisiones de los Talleres 1 y 2 y su integración en el **Taller 3 del Módulo 3**.

- **Responsable:** Jean Carlo Caicedo Chantre
- **Jornada / grupo:** Diurna / 2
- **Puerto interno:** `3003`
- **Tecnologías:** Node.js, Express, MySQL/MariaDB, `mysql2` y JWT
- **Arquitectura:** API REST en capas, base de datos independiente y API Gateway Apache

## 1. Taller 1 — Dominio y arquitectura

Se adaptó la plantilla inicial al recurso **médicos**. Se implementaron `/health`, listado, consulta por ID, creación y validaciones. La primera versión empleaba datos en memoria; en el Taller 2 se sustituyeron por MySQL.

### Estructura en capas

| Capa | Responsabilidad |
|---|---|
| Rutas | Definir endpoints y aplicar los middlewares. |
| Controladores | Recibir peticiones y construir respuestas HTTP. |
| Servicios | Aplicar reglas de negocio y validaciones. |
| Modelos | Validar la representación de un médico. |
| Repositorios | Ejecutar operaciones SQL sobre `medicos_db`. |
| Middlewares | Verificar JWT y autorización por rol. |

### Representación del recurso

```json
{
  "id": 1,
  "nombre": "Carlos Ramírez",
  "registro_medico": "RM-001",
  "especialidad": "Cardiología",
  "sede": "Cali"
}
```

| Atributo | Obligatorio al crear | Validación |
|---|---|---|
| `id` | No | Entero positivo, generado por MySQL. |
| `nombre` | Sí | Texto no vacío. |
| `registro_medico` | Sí | Texto no vacío y único. |
| `especialidad` | Sí | Texto no vacío. |
| `sede` | Sí | `Cali`, `Bogotá` o `Medellín`. |

**Reglas de negocio:** una sede inválida genera `400 Bad Request`; un `registro_medico` duplicado, `409 Conflict`. Los identificadores inexistentes generan `404 Not Found` cuando corresponda.

## 2. Taller 2 — Persistencia y contrato REST

### Persistencia en MySQL

La persistencia se realiza en una base independiente, de forma que los registros permanecen después de detener o reiniciar Node.js.

- **Base de datos / tabla:** `medicos_db` / `medicos`.
- **Usuario de conexión:** `medicos_user`.
- **Script de preparación:** `db/schema.sql` (estructura y registros iniciales).
- **Acceso a los datos:** capa de repositorios mediante consultas SQL.

En **desarrollo local**, crear la base y la cuenta con permisos sobre `medicos_db`:

```sql
CREATE DATABASE medicos_db;
CREATE USER 'medicos_user'@'localhost' IDENTIFIED BY '<CLAVE_LOCAL_SEGURA>';
GRANT ALL PRIVILEGES ON medicos_db.* TO 'medicos_user'@'localhost';
```

Después importar `db/schema.sql` con MySQL. Este procedimiento es para una instalación **nueva**: no volver a ejecutar el script sobre una base con datos sin revisar su contenido.

### Endpoints

Las rutas internas comienzan por `/medicos`; en el Taller 3 el Gateway las publica con el prefijo `/api`.

| Operación | Método y ruta | Éxito | Errores previstos |
|---|---|---|---|
| Salud | `GET /health` | `200` | — |
| Listar | `GET /medicos` | `200` + arreglo | `401` |
| Filtrar | `GET /medicos?especialidad=Cardiología` | `200` | `401` |
| Lotes | `GET /medicos?ids=1,3` | `200` + arreglo | `400`, `401` |
| Obtener | `GET /medicos/:id` | `200` + objeto | `400`, `401`, `404` |
| Crear | `POST /medicos` | `201` + objeto y `Location` | `400`, `401`, `403`, `409` |
| Actualizar | `PUT /medicos/:id` | `200` + objeto | `400`, `401`, `403`, `404`, `409` |
| Eliminar | `DELETE /medicos/:id` | `204` sin cuerpo | `400`, `401`, `403`, `404` |

`/health` es público; los endpoints del recurso requieren JWT. Un error de infraestructura también puede producir `500` o una respuesta del Gateway cuando el servicio está detenido.

### Ejemplos de operaciones

**Crear un médico** (solo `administrador`):

```http
POST http://127.0.0.1:3003/medicos
Authorization: Bearer <TOKEN_ADMINISTRADOR>
Content-Type: application/json
```

```json
{
  "nombre": "Coutinho Dos Santos",
  "registro_medico": "RM-004",
  "especialidad": "Neurología",
  "sede": "Medellín"
}
```

Respuesta esperada: `201 Created`, con un `id` asignado por MySQL y los datos del médico; la cabecera `Location` señala el recurso creado.

**Listar médicos:**

```http
GET http://127.0.0.1:3003/medicos
Authorization: Bearer <TOKEN_VALIDO>
```

Respuesta esperada: `200 OK` con un arreglo JSON. Su contenido depende de los registros de `medicos_db`.

**Consulta por lotes:**

```http
GET http://127.0.0.1:3003/medicos?ids=1,3
Authorization: Bearer <TOKEN_VALIDO>
```

Devuelve los médicos existentes cuyos identificadores coinciden con los solicitados, evitando una petición por cada ID.

**Formato habitual de errores:**

```json
{
  "error": "Mensaje descriptivo del error"
}
```

Algunas respuestas también incluyen el atributo `detalles`.

## 3. Taller 2 — Seguridad JWT y permisos

El servicio utiliza el middleware `verificarToken`. El token se obtiene al iniciar sesión en `ms-usuarios`:

```http
POST http://127.0.0.1:3001/usuarios/login
Content-Type: application/json
```

```json
{
  "email": "admin@empresa.com",
  "password": "<CONTRASEÑA_ACTUAL>"
}
```

Las peticiones a `/medicos` incorporan `Authorization: Bearer <TOKEN>`. La verificación se hace localmente usando la misma `JWT_SECRET` de `ms-usuarios`, sin consultar Usuarios por cada solicitud.

| Operación | `administrador` | `admisiones` | `medico` |
|---|---|---|---|
| GET (listar, filtrar, lotes y obtener) | Sí | Sí | Sí |
| POST (crear) | Sí | No | No |
| PUT (actualizar) | Sí | No | No |
| DELETE (eliminar) | Sí | No | No |

- **401 Unauthorized:** token ausente, inválido o vencido.
- **403 Forbidden:** token válido, pero el rol no permite la operación.
- **400 / 404 / 409:** validación, recurso inexistente o conflicto de registro, respectivamente.

La clave JWT y las contraseñas se mantienen fuera de GitHub. No publicar tokens reales en capturas del informe.

## 4. Taller 2 y 3 — Relaciones con microservicios

`ms-medicos` **no consulta otras bases de datos ni otros microservicios** para administrar sus registros. Los datos propios están en `medicos_db`.

En cambio, **`ms-citas` y `ms-historias` consultan la API REST de `ms-medicos`**:

| Consumidor | Endpoints de `ms-medicos` | Propósito |
|---|---|---|
| `ms-citas` | `GET /medicos/:id`, `GET /medicos?ids=...` | Validar médicos al crear/editar citas y componer respuestas. |
| `ms-historias` | `GET /medicos/:id`, `GET /medicos?ids=...` | Validar el médico asociado a la atención y añadir información del profesional. |

Los campos principales consumidos por Citas son `id`, `nombre`, `especialidad` y `sede`; Historias utiliza `id`, `nombre` y `especialidad`. El contrato completo también incluye `registro_medico`.

### Validación de referencias

Al crear o actualizar una cita, `ms-citas` consulta `GET /medicos/:id`. Una respuesta `200` confirma que el médico existe y `404` indica que no existe; Citas decide cómo responder al cliente.

`ms-historias` también consulta `GET /medicos/:id` al crear o actualizar una atención. Según el contrato documentado por ese componente, si Médicos no responde durante la validación, Historias devuelve `503 Service Unavailable` sin guardar la operación.

### Composición por lotes y servicio degradado

`ms-citas` usa `GET /medicos?ids=...` para reunir profesionales de varias citas en una sola petición. `ms-historias` agrupa identificadores y consulta la misma ruta al listar historias. Ambos consumidores deben enviar un JWT válido, reenviando la autorización de la solicitud original según su implementación.

El README de `ms-historias` documenta que, si Médicos se detiene durante una **consulta** de historias, la respuesta puede seguir siendo `200 OK` con `medico: null` y un aviso `"ms-medicos no está disponible"`. En cambio, una **creación** que necesita validar al médico se rechaza con `503`. Esta tolerancia al fallo pertenece a la lógica de Historias, no a la implementación de `ms-medicos`.

### Evidencias de integración

En el Taller 2 se probó `GET http://localhost:3004/citas` con `200 OK`, y se observó una consulta interna `GET /medicos?ids=13,14,19` desde Citas.

Para el Taller 3, el README de Historias documenta pruebas ejecutadas por su responsable el **19 de noviembre de 2026**: con Médicos detenido, Historia respondió parcialmente a una consulta y rechazó una escritura con `503`; al recuperarlo se reanudó la operación. Son **evidencias del consumidor `ms-historias`**, no resultados propios de la colección de `ms-medicos`.

## 5. Taller 2 — Pruebas en Postman

Se documentaron pruebas para comprobar el contrato CRUD, validaciones, seguridad JWT y relaciones HTTP.

### Casos de CRUD y validación

1. Listar todos los médicos y filtrar por especialidad.
2. Consultar varios registros mediante `?ids=`.
3. Consultar un médico existente, un ID inexistente y uno no numérico.
4. Crear un médico válido y comprobar `201` y `Location`.
5. Rechazar la creación sin atributos obligatorios (`400`).
6. Rechazar un `registro_medico` duplicado (`409`).
7. Actualizar un médico y consultar sus cambios.
8. Actualizar un identificador inexistente (`404`).
9. Eliminar y repetir la eliminación (`204` y después `404`).

### Casos de seguridad

| Caso documentado | HTTP esperado | Resultado en el Taller 2 |
|---|---|---|
| GET sin token | `401` | Correcto |
| GET con token inventado | `401` | Correcto |
| GET como `admisiones` | `200` | Correcto |
| POST como `admisiones` | `403` | Correcto |
| POST como `administrador` | `201` | Correcto |

La integración con `ms-citas` se verificó mediante Postman y mediante las peticiones recibidas por `ms-medicos`. La colección inicial se referencia en `docs/ms-medicos.postman_collection.json`.

## 6. Taller 3 — Despliegue en Ubuntu

### Topología del laboratorio

| Componente | Máquina | Red / ubicación |
|---|---|---|
| MySQL y DNS | `svrBog1` | `172.16.2.42`, MySQL `3306` |
| `ms-medicos` | `svrBog2` | `127.0.0.1:3003` |
| API Gateway y frontend | `svrBog2` | `172.16.2.43:80`, `/var/www/app` |
| Acceso de Windows | Cliente | `http://app.medired.com` |

El repositorio del grupo está en `/srv/medired/app` y el código de Médicos en `/srv/medired/app/ms-medicos`. El proceso Node.js no se publica en la red privada: escucha en `127.0.0.1` y Apache recibe las solicitudes externas.

### Conexión MySQL desde servidor2

En el laboratorio, `medicos_db` reside en servidor1. La cuenta `medicos_user` debe estar autorizada **desde `172.16.2.43`**, no solo desde `localhost` como en desarrollo local.

Ejemplo de preparación inicial en MySQL de `svrBog1`:

```sql
CREATE DATABASE IF NOT EXISTS medicos_db;
CREATE USER 'medicos_user'@'172.16.2.43' IDENTIFIED BY '<CLAVE_PRIVADA>';
GRANT ALL PRIVILEGES ON medicos_db.* TO 'medicos_user'@'172.16.2.43';
```

Si la base o el usuario ya existen, **no repetir su creación**: revisar usuarios, permisos y tablas primero. El firewall de servidor1 solo debe permitir el puerto `3306` desde `172.16.2.43`.

Comprobación desde `svrBog2`:

```bash
mysql -h 172.16.2.42 -P 3306 -u medicos_user -p medicos_db \
  -e "SELECT id,nombre,registro_medico,especialidad,sede FROM medicos;"
```

### Entorno de ejecución

Instalar las dependencias del repositorio y completar `.env` con los valores del laboratorio:

```bash
cd /srv/medired/app/ms-medicos
npm ci --omit=dev
```

```dotenv
PORT=3003
HOST=127.0.0.1
DB_HOST=172.16.2.42
DB_PORT=3306
DB_NAME=medicos_db
DB_USER=medicos_user
DB_PASSWORD=<CONTRASEÑA_PRIVADA>
JWT_SECRET=<SECRETO_COMPARTIDO_DEL_GRUPO>
```

En el Taller 2 local se utilizó `DB_HOST=localhost` y `DB_PORT=3309`; esos valores **no corresponden** a la base MySQL remota del Taller 3. Mantener `.env` fuera de GitHub y permitir su lectura al usuario de servicio `nodeapps`.

### Ejecución mediante systemd

La unidad de `ms-medicos` permite iniciar el proceso como `nodeapps` y recuperarlo si falla. Ejemplo de unidad instalada en `/etc/systemd/system/ms-medicos.service`:

```ini
[Unit]
Description=Microservicio medicos - MediRed IPS
After=network.target

[Service]
User=nodeapps
Group=nodeapps
WorkingDirectory=/srv/medired/app/ms-medicos
ExecStart=/usr/bin/node --env-file=.env src/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Verificar que la ruta `src/index.js` coincida con el archivo de entrada del repositorio y que `nodeapps` pueda leer `.env`. Para instalar o actualizar el servicio se usa `daemon-reload` después de guardar la unidad.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ms-medicos
systemctl is-active ms-medicos
systemctl is-enabled ms-medicos
curl -i http://127.0.0.1:3003/health
sudo journalctl -u ms-medicos -n 30 --no-pager
```

Se esperan `active`, `enabled` y `/health` con `estado: "ok"`; la salida debe comprobarse en la VM al generar las evidencias.

### DNS y Apache como API Gateway

El DNS de `svrBog1` resuelve `app.medired.com` a `172.16.2.43`. Apache en servidor2 publica `/api/usuarios`, `/api/pacientes`, `/api/medicos`, `/api/citas` y `/api/historias`.

Fragmento correspondiente a este microservicio en `app.conf`:

```apache
ProxyPass        /api/medicos http://127.0.0.1:3003/medicos
ProxyPassReverse /api/medicos http://127.0.0.1:3003/medicos
```

La ruta pública es `http://app.medired.com/api/medicos`, mientras que la interna sigue siendo `http://127.0.0.1:3003/medicos`. No se necesita abrir el puerto 3003 en el firewall.

```bash
sudo apache2ctl configtest
dig @172.16.2.42 app.medired.com +short
curl -i -H 'Host: app.medired.com' http://127.0.0.1/api/medicos
```

Resultados esperados: `Syntax OK`, dirección `172.16.2.43` y `401` si se consulta `/api/medicos` sin token. Una respuesta `502/503` obliga a revisar Apache, Node.js y systemd.

## 7. Taller 3 — Frontend, Postman y pruebas integrales

### Integración con el frontend

El frontend se publica en `/var/www/app`. La pantalla de médicos (`frontend/medicos.html` y `frontend/js/medicos.js`) debe consumir `/api/medicos` a través de Apache, sin consultar directamente el puerto `3003` ni mantener datos de médicos como fuente de verdad en archivos JSON o `localStorage`.

El login utiliza `/api/usuarios/login` para obtener JWT. Las solicitudes protegidas incluyen `Authorization: Bearer <TOKEN>` y el backend hace cumplir los roles: administrador puede escribir; admisiones y médico pueden consultar.

### Pruebas por el Gateway

Desde Postman en Windows utilizar como base `http://app.medired.com/api`, no `http://localhost:3003` (en Windows ese `localhost` no es la VM).

| Prueba | Acción | Resultado esperado |
|---|---|---|
| Salud interna | `GET http://127.0.0.1:3003/health` en servidor2 | `200`, `estado: ok` |
| Login | `POST /api/usuarios/login` | JWT válido con usuario de prueba |
| Sin token | `GET /api/medicos` | `401` |
| Rol sin permiso | `POST /api/medicos` como `admisiones` | `403` |
| Consulta autorizada | `GET /api/medicos` con JWT | `200` |
| CRUD autorizado | POST, PUT y DELETE con administrador | `201`, `200` y `204` |
| Validación / conflicto | Sede inválida / registro duplicado | `400` / `409` |
| Relaciones | GET de Citas o Historias con médicos vinculados | Datos médicos obtenidos por REST |
| Reinicio de VM | Reiniciar servidor2 y verificar systemd | Servicio vuelve a estar activo |

### Restricciones de red y diagnóstico

En **PowerShell de Windows**:

```powershell
nslookup app.medired.com 172.16.2.42
Test-NetConnection 172.16.2.43 -Port 80
Test-NetConnection 172.16.2.43 -Port 3003
Test-NetConnection 172.16.2.42 -Port 3306
```

Se espera acceso al puerto `80` y bloqueo del acceso directo desde Windows a `3003` y `3306`. En servidor2:

```bash
sudo ss -tlnp | grep 3003
sudo ufw status numbered
sudo systemctl status ms-medicos --no-pager
```

La captura debe mostrar que Médicos escucha en `127.0.0.1:3003`. En el navegador, DevTools → **Red** permite verificar que las llamadas del frontend utilizan `/api/medicos`; ocultar el valor del JWT antes de guardar capturas.

### Evidencias y alcance de los resultados

Para la entrega conservar las capturas de la consulta SQL, `systemctl`, `/health`, Apache `Syntax OK`, pruebas con JWT, peticiones del frontend, bloqueo de puertos y recuperación tras reinicio. Los resultados observados en el Taller 2 se documentaron en la sección 5.

Las pruebas de caída y recuperación de Médicos que aparecen en el README de `ms-historias` fueron ejecutadas y registradas por **el responsable de Historias**. Son evidencia de integración entre servicios, pero no deben atribuirse como una ejecución de la colección de `ms-medicos`. Las pruebas específicas de este componente se acreditan con sus propias capturas o resultados Postman.

## 8. Instalación rápida y mantenimiento

### Entorno local (Taller 2)

```bash
cd ms-medicos
npm install
# Copiar .env.example a .env y ajustar MySQL/JWT
npm run dev
```

Variables locales de referencia: `PORT=3003`, `HOST=127.0.0.1`, `DB_HOST=localhost`, `DB_PORT=3309`, `DB_NAME=medicos_db`, `DB_USER=medicos_user`. El puerto MySQL depende de la instalación local.

### Laboratorio Ubuntu (Taller 3)

```bash
cd /srv/medired/app/ms-medicos
npm ci --omit=dev
sudo systemctl restart ms-medicos
sudo systemctl status ms-medicos --no-pager
sudo journalctl -u ms-medicos -n 30 --no-pager
```

Mantener las contraseñas y la clave JWT únicamente en `.env`. No subir credenciales, `node_modules` ni tokens al repositorio. El repositorio grupal debe conservar el archivo `README.md`, `.env.example`, `db/schema.sql`, la colección de Postman y la unidad de despliegue de systemd bajo la estructura `deploy/` acordada por el equipo.

## Conclusión

`ms-medicos` evolucionó de una API REST con registros en memoria a un servicio con persistencia MySQL, CRUD, reglas de negocio, JWT y consultas de otros microservicios. En el Taller 3 se integró en la arquitectura Linux de MediRed IPS: **MySQL en `svrBog1`, Node.js y systemd en `svrBog2`, y Apache como API Gateway en `app.medired.com`**. Los consumidores `ms-citas` y `ms-historias` consultan su contrato REST sin acceder a `medicos_db`, manteniendo la separación de responsabilidades.
