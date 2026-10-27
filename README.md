# MediRed IPS

### Healthcare Management Platform

**MediRed IPS** es una plataforma web de gestión médica diseñada para centralizar y optimizar los procesos administrativos y clínicos de una institución prestadora de servicios de salud.

El proyecto propone una solución digital que integra la gestión de pacientes, profesionales de salud, citas médicas e historias clínicas en un entorno unificado, mediante una arquitectura distribuida basada en microservicios.

Su enfoque combina desarrollo web, integración de servicios, seguridad y administración de infraestructura para construir un sistema modular, escalable y mantenible.

## Visión del proyecto

Las instituciones de salud requieren herramientas que permitan organizar grandes volúmenes de información, coordinar diferentes áreas y controlar el acceso a datos según las responsabilidades de cada usuario.

MediRed busca abordar estas necesidades a través de una plataforma que permita:

- Centralizar la administración de pacientes y profesionales médicos.
- Gestionar la programación y el seguimiento de citas.
- Organizar y consultar registros de atención médica.
- Ofrecer interfaces adaptadas a distintos roles dentro de la institución.
- Integrar diferentes servicios sin depender de una aplicación monolítica.
- Mantener una estructura tecnológica que facilite la evolución del sistema.

## Arquitectura del sistema

MediRed está concebido bajo una arquitectura de microservicios, donde cada componente administra una parte específica del negocio y se comunica con otros servicios mediante APIs REST.

La solución contempla cuatro componentes principales:

**Frontend:** interfaz web desde la cual los usuarios acceden a las funcionalidades de acuerdo con su rol.

**API Gateway:** punto de entrada centralizado que distribuye las solicitudes del cliente hacia los microservicios correspondientes.

**Microservicios:** servicios independientes que encapsulan la lógica de negocio, organizados mediante una arquitectura en capas.

**Persistencia:** bases de datos MySQL independientes por microservicio, que permiten mantener separadas las responsabilidades y la información de cada entidad.

### Servicios previstos

| Servicio | Funcionalidad |
|---|---|
| `ms-usuarios` | Autenticación, usuarios y permisos |
| `ms-pacientes` | Gestión de información de pacientes |
| `ms-medicos` | Administración de profesionales médicos |
| `ms-citas` | Programación y seguimiento de citas |
| `ms-historias` | Administración de registros clínicos |

La comunicación entre microservicios permitirá relacionar información de diferentes entidades manteniendo la independencia de sus datos.

## Seguridad y control de acceso

La plataforma contempla autenticación mediante tokens JWT y autorización basada en roles.

Se han definido tres perfiles principales:

- **Administrador:** gestión general de la plataforma.
- **Admisiones:** administración de pacientes y citas médicas.
- **Médico:** consulta de citas y gestión de historias clínicas.

Cada operación estará sujeta a validaciones de autenticación y permisos desde el backend.

## Tecnologías

**Backend**
- Node.js
- Express.js
- REST APIs
- JSON Web Tokens (JWT)

**Base de datos**
- MySQL

**Infraestructura y servicios**
- Ubuntu Server
- Apache2
- BIND9
- UFW
- Vagrant
- VirtualBox

**Desarrollo y pruebas**
- Git y GitHub
- Postman
- Visual Studio Code

## Infraestructura

El sistema aprovecha una infraestructura Linux virtualizada con dos servidores y funciones diferenciadas.

El primer servidor administra la resolución DNS y alojará las bases de datos de los microservicios.

El segundo servidor alojará la aplicación web, el API Gateway y los servicios que implementan la lógica de negocio.

Apache actuará como servidor del frontend y proxy inverso, proporcionando un único punto de acceso a los diferentes servicios internos.

Esta distribución permite separar las responsabilidades de infraestructura, persistencia y procesamiento de solicitudes.

## Estado del desarrollo

**En desarrollo — Etapa de arquitectura y planificación.**

Actualmente se está estructurando la aplicación, definiendo los contratos de comunicación y preparando el entorno de desarrollo colaborativo.

La implementación de los microservicios, la persistencia, las interfaces de usuario y la integración se realizará progresivamente.

Este repositorio documentará la evolución del sistema, sus decisiones de arquitectura y las funcionalidades implementadas.

## Privacidad de los datos

MediRed IPS es un proyecto de simulación tecnológica. La aplicación utilizará exclusivamente información ficticia para representar procesos médicos y administrativos, sin almacenar datos clínicos reales.

---

**MediRed IPS — Healthcare Management Platform**

*Distributed Architecture · REST APIs · Microservices · Web Development*
