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
