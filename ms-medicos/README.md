# ms-medicos — MediRed IPS

## Descripción
Microservicio desarrollado para el Módulo 3 de Redes y Servicios Multimedia. Permite registrar, listar y consultar médicos de MediRed IPS mediante una API REST.

## Tecnologías
- Node.js
- Express
- JavaScript
- Postman

## Arquitectura
El microservicio está organizado en capas:

- **Routes:** define las rutas HTTP.
- **Controllers:** procesa peticiones y respuestas.
- **Services:** aplica las reglas de negocio.
- **Models:** valida los datos.
- **Repositories:** almacena los médicos en memoria.

## Instalación

```bash
npm install
```

Crear el archivo `.env` con:

```env
PORT=3003
HOST=127.0.0.1
```

Ejecutar:

```bash
npm run dev
```

## Endpoints

| Método | Ruta | Función |
|---|---|---|
| GET | `/health` | Estado del servicio |
| GET | `/medicos` | Listar médicos |
| GET | `/medicos/:id` | Buscar médico |
| POST | `/medicos` | Registrar médico |

## Datos del médico
`id`, `nombre`, `registro_medico`, `especialidad`, `sede`.

## Validaciones
- Campos obligatorios.
- Registro médico único.
- Sedes permitidas: Cali, Bogotá y Medellín.
- Manejo de errores 400, 404 y 409.

## Estado
**Taller 1:** API REST con datos almacenados en memoria. En el Taller 2 se implementará MySQL.

**Empresa:** MediRed IPS  
**Microservicio:** ms-medicos  
**Puerto:** 3003