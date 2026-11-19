# MediRed IPS — Frontend conectado a API

## Qué contiene
- Inicio de sesión real contra `POST /api/usuarios/login`.
- JWT y usuario guardados únicamente en `sessionStorage`.
- Cliente HTTP compartido en `js/api.js`, con `Authorization: Bearer ...`.
- Pacientes, médicos, citas e historias consultados y modificados mediante los microservicios.
- Sin persistencia de registros en `localStorage` ni carga de datos desde JSON local.
- La UI oculta acciones de escritura según el rol; el backend conserva la autorización definitiva.

## Roles implementados según las rutas del backend
| Recurso | Administrador | Admisiones | Médico |
|---|---|---|---|
| Ver pacientes y médicos | Sí | Sí | Sí |
| Crear/editar/eliminar pacientes y médicos | Sí | No | No |
| Ver citas | Sí | Sí | Sí |
| Crear/editar/eliminar citas | Sí | Sí | No |
| Ver historias | Sí | Sí | Sí |
| Crear/editar/eliminar historias | Sí | No | Sí |

## API esperada
El frontend usa rutas relativas `/api`, para que navegador y frontend compartan origen:
- `/api/usuarios/login`
- `/api/pacientes`
- `/api/medicos`
- `/api/citas`
- `/api/historias`

Las respuestas de citas e historias usan los objetos relacionados `paciente` y `medico` que compone el microservicio. El navegador no hace peticiones adicionales por fila para reconstruir esas relaciones.

## Apache en servidor2
Mantén los microservicios escuchando en `127.0.0.1` (no se cambia `HOST`). En el VirtualHost de `app.medired.com`, habilita proxy y agrega:

```apache
ProxyPreserveHost On

ProxyPass        /api/usuarios http://127.0.0.1:3001/usuarios
ProxyPassReverse /api/usuarios http://127.0.0.1:3001/usuarios

ProxyPass        /api/pacientes http://127.0.0.1:3002/pacientes
ProxyPassReverse /api/pacientes http://127.0.0.1:3002/pacientes

ProxyPass        /api/medicos http://127.0.0.1:3003/medicos
ProxyPassReverse /api/medicos http://127.0.0.1:3003/medicos

ProxyPass        /api/citas http://127.0.0.1:3004/citas
ProxyPassReverse /api/citas http://127.0.0.1:3004/citas

ProxyPass        /api/historias http://127.0.0.1:3005/historias
ProxyPassReverse /api/historias http://127.0.0.1:3005/historias
```

Habilitar módulos (si aún no están habilitados):
```bash
sudo a2enmod proxy proxy_http
sudo apache2ctl configtest
sudo systemctl reload apache2
```

El `DocumentRoot` del VirtualHost debe apuntar a `/var/www/app` y servir el contenido de esta carpeta (no la carpeta contenedora).

## Publicación después de integrar en GitHub
En servidor2, desde la carpeta del repositorio:
```bash
git status --short
git pull --ff-only origin main
sudo mkdir -p /var/www/app
sudo cp -a frontend/. /var/www/app/
sudo apache2ctl configtest
sudo systemctl reload apache2
```

## Comprobación
1. Abrir `http://app.medired.com`.
2. Iniciar sesión con las cuentas creadas en `ms-usuarios` (no hay selector de rol).
3. Revisar en DevTools > Network que las llamadas sean a `/api/...` y lleven Authorization en operaciones protegidas.
4. Probar una acción no permitida con otro rol: la API debe devolver 403 y el frontend debe mostrar el mensaje.
5. Confirmar que las modificaciones persisten en MySQL al recargar.

> Este paquete se preparó a partir del frontend y los controladores/modelos del repositorio entregado. No se ha podido ejecutar contra las máquinas virtuales ni validar credenciales o disponibilidad de los microservicios desde este entorno.

## Autenticación, errores y permisos por rol

El login usa `POST /api/usuarios/login` sin adjuntar JWT. Un `401` en esa ruta significa correo/contraseña incorrectos o cuenta inactiva; **no** debe mostrarse como sesión vencida ni borrar una sesión previa. En las demás rutas, un `401` significa token ausente, inválido o vencido: se elimina únicamente `token` y `usuario` de `sessionStorage` y se redirige al acceso.

El cliente `js/api.js` centraliza mensajes para errores HTTP `400`, `401`, `403`, `404`, `405`, `409`, `413`, `415`, `422`, `429`, `500`, `502`, `503` y `504`, además de fallos de conexión. El mensaje concreto devuelto por el microservicio tiene prioridad cuando existe.

### Matriz de permisos verificada en las rutas del backend

| Módulo | Administrador | Admisiones | Médico |
|---|---|---|---|
| Pacientes: consultar | Sí | Sí | Sí |
| Pacientes: crear, editar, eliminar | Sí | No | No |
| Médicos: consultar | Sí | Sí | Sí |
| Médicos: crear, editar, eliminar | Sí | No | No |
| Citas: consultar | Sí | Sí | Sí |
| Citas: crear, editar, eliminar | Sí | Sí | No |
| Historias clínicas: consultar | Sí | Sí | Sí |
| Historias clínicas: crear, editar, eliminar | Sí | No | Sí |

Los botones de crear, editar y eliminar se muestran únicamente a los roles autorizados. El backend sigue siendo la autoridad: si se intenta una operación no permitida directamente, debe responder `403` y la interfaz muestra ese mensaje. Ocultar botones por sí solo no es seguridad.

### Pruebas que deben realizarse

1. Login correcto para cada uno de los tres roles.
2. Contraseña incorrecta: mensaje de credenciales incorrectas; no mostrar “sesión vencida”.
3. Token vencido o inválido en una página privada: limpiar `token` y `usuario`, y volver al login.
4. Médico: puede consultar pacientes, médicos y citas; no debe ver botones para crear/editar/eliminar esos registros. Sí puede gestionar historias clínicas.
5. Admisiones: puede consultar pacientes y médicos sin botones de modificación; puede crear/editar/eliminar citas; historias clínicas solo consulta.
6. Administrador: puede realizar operaciones CRUD en los cuatro módulos.
7. Validación `400/422`, no encontrado `404`, conflicto `409`, método incorrecto `405` y servicios no disponibles `502/503/504` deben mostrarse sin romper la pantalla.

Los permisos de la interfaz reflejan las rutas actuales de los microservicios. Si el equipo cambia los middlewares del backend, debe actualizar esta matriz y las reglas de visibilidad del frontend.
