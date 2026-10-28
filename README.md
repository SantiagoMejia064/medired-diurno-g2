# MediRed IPS

**Jornada:** Diurna  
**Grupo:** 2

Aplicación web para la gestión de servicios médicos de MediRed IPS, desarrollada mediante una arquitectura de microservicios REST.

## Integrantes

| Integrante              | GitHub              | Microservicio |
| ----------------------- | ------------------- | ------------- |
| Santiago Mejía          | SantiagoMejia064    | ms-citas      |
| [Nombre del integrante] | [Usuario de GitHub] | ms-pacientes  |
| [Nombre del integrante] | [Usuario de GitHub] | ms-medicos    |
| [Nombre del integrante] | [Usuario de GitHub] | ms-historias  |

## Microservicios

| Carpeta      | Entidad            | Responsable    | Puerto | Depende de               |
| ------------ | ------------------ | -------------- | ------ | ------------------------ |
| ms-usuarios  | Usuarios           | Docente        | 3001   | Ninguno                  |
| ms-pacientes | Pacientes          | Valentina Ochoa| 3002   | Ninguno                  |
| ms-medicos   | Médicos            | [Integrante]   | 3003   | Ninguno                  |
| ms-citas     | Citas médicas      | Santiago Mejía | 3004   | ms-pacientes, ms-medicos |
| ms-historias | Historias clínicas | [Integrante]   | 3005   | ms-pacientes, ms-medicos |

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
