# MediRed IPS

**Jornada:** Diurna  
**Grupo:** 2

Aplicación web para la gestión de servicios médicos de MediRed IPS, desarrollada mediante una arquitectura de microservicios REST.

## Integrantes

| Integrante              | GitHub              | Microservicio |
| ----------------------- | ------------------- | ------------- |
| Santiago Mejía          | SantiagoMejia064    | ms-citas      |
| Valentina Ochoa         | d8zval              | ms-pacientes  |
| Jean Carlo Chantre      | Chantrix11          | ms-medicos    |
| Steven Camilo Franco    | StevenNorduss       | ms-historias  |

## Microservicios

| Carpeta      | Entidad            | Responsable    | Puerto | Depende de               |
| ------------ | ------------------ | -------------- | ------ | ------------------------ |
| ms-usuarios  | Usuarios           | Docente        | 3001   | Ninguno                  |
| ms-pacientes | Pacientes          | [Integrante]   | 3002   | Ninguno                  |
| ms-medicos   | Médicos            | [Integrante]   | 3003   | Ninguno                  |
| ms-citas     | Citas médicas      | Santiago Mejía | 3004   | ms-pacientes, ms-medicos |
| ms-historias | Historias clínicas | Steven Franco  | 3005   | ms-pacientes, ms-medicos |

## Estructura del repositorio

```text
medired-diurno-g2/
├── README.md
├── ms-usuarios/       # Gestión de usuarios
├── ms-pacientes/      # Gestión de pacientes
├── ms-medicos/        # Gestión de médicos
├── ms-citas/          # Gestión de citas médicas
└── ms-historias/      # Gestión de historias clínicas
```

Cada microservicio tiene su propia carpeta, código fuente y configuración.

## Cómo ejecutar un microservicio

Desde la terminal, ingresar a la carpeta del microservicio correspondiente, por ejemplo:

```bash
cd ms-citas
```

**1. Instalar dependencias**

```bash
npm install
```

**2. Crear el archivo `.env`**

Copiar el contenido de `.env.example` a un archivo llamado `.env` y verificar el puerto asignado.

**3. Iniciar el servicio**

```bash
npm run dev
```

Para comprobar su funcionamiento, acceder a `http://localhost:3004/health` en el caso de `ms-citas`.

Los datos utilizados durante el desarrollo son ficticios.


---

## Despliegue en producción - Taller 3, Módulo 3

### 1. Arquitectura de despliegue

MediRed IPS utiliza una arquitectura de microservicios distribuida en dos máquinas virtuales Ubuntu Server 22.04.

| Componente | Servidor | IP | Puerto |
|---|---|---|---|
| DNS (BIND9) | svrBog1 | 172.16.2.42 | 53 |
| MySQL | svrBog1 | 172.16.2.42 | 3306 |
| Apache / API Gateway | svrBog2 | 172.16.2.43 | 80 |
| ms-usuarios | svrBog2 | 127.0.0.1 | 3001 |
| ms-pacientes | svrBog2 | 127.0.0.1 | 3002 |
| ms-medicos | svrBog2 | 127.0.0.1 | 3003 |
| ms-citas | svrBog2 | 127.0.0.1 | 3004 |
| ms-historias | svrBog2 | 127.0.0.1 | 3005 |

Dominio de acceso: http://app.medired.com

### 2. Servidor de datos - svrBog1

El servidor de datos utiliza MySQL con una base de datos independiente por microservicio.

Bases de datos:
- usuarios_db
- pacientes_db
- medicos_db
- citas_db
- historias_db

Los usuarios de MySQL están restringidos a conexiones provenientes del servidor de aplicaciones (172.16.2.43).

El archivo deploy/sql/crear_bases_usuarios.sql contiene los comandos de creación de bases de datos, usuarios y permisos, con contraseñas de ejemplo.

Los esquemas de las tablas se encuentran en las carpetas db/ de cada microservicio.

### 3. Servidor de aplicaciones - svrBog2

Requisitos:
- Ubuntu Server 22.04
- Node.js 22
- Apache2
- Git
- systemd
- Cliente MySQL

Clonar el repositorio:

    git clone https://github.com/SantiagoMejia064/medired-diurno-g2.git /srv/medired/app

Instalar las dependencias de cada microservicio mediante npm ci --omit=dev.

Crear el archivo .env de cada microservicio usando su .env.example como referencia.

Configurar la conexión a MySQL:
- DB_HOST=172.16.2.42
- DB_PORT=3306
- DB_NAME y DB_USER correspondientes a cada servicio
- DB_PASSWORD con la contraseña privada de cada usuario
- JWT_SECRET compartido por los cinco servicios

Los microservicios deben escuchar únicamente en 127.0.0.1.

### 4. Servicios systemd

Los archivos de configuración están ubicados en deploy/systemd/.

Para replicar el despliegue, copiarlos a /etc/systemd/system/, verificando previamente sus rutas y permisos.

Los servicios utilizan el usuario de sistema nodeapps, que debe tener acceso de lectura a sus archivos .env.

Registrar y habilitar los servicios:

    sudo systemctl daemon-reload
    sudo systemctl enable --now ms-usuarios ms-pacientes ms-medicos ms-citas ms-historias

Verificar el estado:

    systemctl status ms-usuarios ms-pacientes ms-medicos ms-citas ms-historias --no-pager

### 5. API Gateway Apache

La configuración utilizada se encuentra en deploy/apache/app.conf.

Apache publica el frontend y redirige las solicitudes /api hacia los microservicios.

Rutas públicas:
- /api/usuarios
- /api/pacientes
- /api/medicos
- /api/citas
- /api/historias

Para instalar la configuración en un servidor nuevo, habilitar los módulos proxy y proxy_http, copiar app.conf al directorio de sitios disponibles de Apache y habilitar el sitio.

Validar y recargar:

    sudo apache2ctl configtest
    sudo systemctl reload apache2

### 6. Publicación del frontend

Los archivos del frontend se encuentran en frontend/.

Copiarlos al directorio público de Apache:

    sudo mkdir -p /var/www/app
    sudo cp -a /srv/medired/app/frontend/. /var/www/app/

La aplicación se accede desde:

http://app.medired.com

### 7. Verificación del despliegue

Comprobar:
- Resolución DNS de app.medired.com.
- Estado activo de los cinco microservicios.
- Respuesta de los endpoints /health.
- Funcionamiento del API Gateway.
- Inicio de sesión mediante JWT.
- Operaciones CRUD y permisos por rol.
- Restricción del acceso directo a MySQL y Node.js.
- Recuperación automática de los servicios después de reiniciar la VM.

Las pruebas de API se realizan en Postman utilizando:

http://app.medired.com/api

### 8. Seguridad

Los microservicios se ejecutan como servicios systemd bajo el usuario nodeapps.

Las conexiones a los microservicios utilizan 127.0.0.1 y el acceso externo se realiza mediante Apache.

MySQL restringe las conexiones a los servidores autorizados.

Los archivos .env contienen información confidencial y no deben publicarse en GitHub.

Solo se incluyen archivos .env.example con valores de ejemplo.

### 9. Archivos de despliegue

La carpeta deploy/ contiene:

- apache/app.conf
- systemd/ms-usuarios.service
- systemd/ms-pacientes.service
- systemd/ms-medicos.service
- systemd/ms-citas.service
- systemd/ms-historias.service
- sql/crear_bases_usuarios.sql
- README.md

Estas configuraciones permiten documentar y replicar el despliegue del proyecto.

Para instrucciones adicionales, consultar deploy/README.md.
