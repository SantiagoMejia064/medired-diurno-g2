
# Despliegue del servidor de aplicaciones — MediRed IPS

## 1. Descripción

Esta carpeta contiene las configuraciones necesarias para desplegar los cinco microservicios de MediRed IPS mediante Node.js, systemd y Apache como API Gateway.

El despliegue corresponde al Taller 3 del Módulo 3 de Redes y Servicios Multimedia.

## 2. Arquitectura

Servidor de datos: svrBog1 (172.16.2.42)
Servidor de aplicaciones: svrBog2 (172.16.2.43)
Dominio de la API: app.medired.com

Apache recibe las solicitudes HTTP en el puerto 80 y las redirige a los microservicios.

## 3. Microservicios

| Servicio | Puerto | Base de datos |
|---|---|---|
| ms-usuarios | 3001 | usuarios_db |
| ms-pacientes | 3002 | pacientes_db |
| ms-medicos | 3003 | medicos_db |
| ms-citas | 3004 | citas_db |
| ms-historias | 3005 | historias_db |

Todos los microservicios escuchan en 127.0.0.1.

## 4. Requisitos

- Ubuntu Server 22.04
- Node.js 22
- Apache2
- systemd
- Acceso autorizado al servidor MySQL
- Resolución DNS para app.medired.com

## 5. Instalación

Ubicar el proyecto en:

/srv/medired/app

Instalar las dependencias de cada microservicio:

```bash
cd /srv/medired/app
for servicio in ms-usuarios ms-pacientes ms-medicos ms-citas ms-historias; do
  (cd "$servicio" && npm ci --omit=dev)
done
```

## 6. Variables de entorno

Cada microservicio requiere su propio archivo .env.

Configuración general:

- HOST=127.0.0.1
- DB_HOST=172.16.2.42
- DB_PORT=3306
- DB_NAME=base correspondiente
- DB_USER=usuario correspondiente
- DB_PASSWORD=contraseña correspondiente
- JWT_SECRET=secreto JWT compartido

Los servicios ms-citas y ms-historias también requieren las URL internas de pacientes y médicos:

- PACIENTES_URL=http://127.0.0.1:3002
- MEDICOS_URL=http://127.0.0.1:3003

Los archivos .env y sus secretos no deben subirse al repositorio.

## 7. Configuración de systemd

Copiar los archivos .service desde deploy/systemd/ hacia:

/etc/systemd/system/

Asegurar que el usuario nodeapps pueda acceder a los directorios y leer los archivos .env.

Registrar y habilitar los servicios:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ms-usuarios ms-pacientes ms-medicos ms-citas ms-historias
```

Verificar su estado:

```bash
systemctl status ms-usuarios ms-pacientes ms-medicos ms-citas ms-historias --no-pager
```

## 8. Configuración de Apache

Copiar deploy/apache/app.conf a:

/etc/apache2/sites-available/app.conf

Habilitar los módulos necesarios de proxy y el sitio, verificar la configuración y recargar Apache.

Apache actúa como API Gateway mediante:

http://app.medired.com/api

## 9. Seguridad

- Los microservicios escuchan únicamente en 127.0.0.1.
- El acceso HTTP al Gateway está permitido desde la red autorizada.
- MySQL permite el acceso desde el servidor de aplicaciones autorizado.
- Las operaciones protegidas requieren JWT.
- Las contraseñas y secretos se mantienen fuera de Git.

## 10. Verificación

Comprobar los servicios internos:

```bash
ss -tlnp | grep -E ':(3001|3002|3003|3004|3005)\b'
```

Verificar conectividad del Gateway desde Windows:

```powershell
Test-NetConnection 172.16.2.43 -Port 80
```

Verificar aislamiento de Node.js:

```powershell
Test-NetConnection 172.16.2.43 -Port 3001
```

Verificar aislamiento de MySQL:

```powershell
Test-NetConnection 172.16.2.42 -Port 3306
```

Las pruebas funcionales e integrales se realizan mediante Postman utilizando el dominio app.medired.com.

## 11. Evidencias

Conservar capturas del funcionamiento de systemd, resolución DNS, Apache, reglas de firewall, restricciones de acceso, autenticación JWT y pruebas de los microservicios.
