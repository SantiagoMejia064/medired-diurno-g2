# ms-medicos · Contrato de la API

Microservicio de gestión de médicos de MediRed IPS. Responsable: Jean Carlo Caicedo Chantre. Puerto: **3003**.

## Cómo ejecutarlo

Requisitos: Node.js, npm y MySQL/MariaDB.

1. Crear la base de datos y su usuario (como administrador):

```sql
CREATE DATABASE medicos_db;
CREATE USER 'medicos_user'@'localhost' IDENTIFIED BY 'una-clave-segura';
GRANT ALL PRIVILEGES ON medicos_db.* TO 'medicos_user'@'localhost';
```

2. Crear la tabla: ingresar con `mysql -u medicos_user -p medicos_db` y ejecutar `SOURCE db/schema.sql;`.
3. Ejecutar `npm install`.
4. Copiar `.env.example` como `.env` y configurar los datos de conexión. Ajustar `DB_PORT` al puerto local de MySQL (3309 en el entorno de desarrollo).
5. Ejecutar `npm run dev`.

## Representación

```json
{
  "id": 1,
  "nombre": "Carlos Ramírez",
  "registro_medico": "RM-001",
  "especialidad": "Cardiología",
  "sede": "Cali"
}
```

## Atributos

| Atributo | Tipo | ¿Obligatorio al crear? | Reglas |
|---|---|---|---|
| id | entero | No, lo asigna MySQL | Positivo y único |
| nombre | texto | Sí | No vacío |
| registro_medico | texto | Sí | Único (409) |
| especialidad | texto | Sí | No vacía |
| sede | texto | Sí | Cali, Bogotá o Medellín |

## Endpoints

| Operación | Método | URI | Respuesta exitosa | Errores |
|---|---|---|---|---|
| Listar | GET | `/medicos` | 200 arreglo | — |
| Filtrar | GET | `/medicos?especialidad=Cardiología` | 200 arreglo | — |
| Consultar por lotes | GET | `/medicos?ids=1,3` | 200 arreglo | 400 |
| Obtener | GET | `/medicos/:id` | 200 objeto | 400 · 404 |
| Crear | POST | `/medicos` | 201 objeto + Location | 400 · 409 |
| Actualizar | PUT | `/medicos/:id` | 200 objeto | 400 · 404 · 409 |
| Eliminar | DELETE | `/medicos/:id` | 204 | 400 · 404 |

**Ejemplo para crear:**

```json
{
  "nombre": "Coutinho Dos Santos",
  "registro_medico": "RM-004",
  "especialidad": "Neurología",
  "sede": "Medellín"
}
```

**Errores:** `{"error":"mensaje","detalles":["..."]}` (detalles únicamente en errores de validación).

## Relaciones

**Consulta a:** ninguno. El microservicio administra su propia entidad y base de datos.

**Me consultan:** `ms-citas`, para verificar la existencia de un médico mediante `GET /medicos/:id` y recuperar información mediante `GET /medicos?ids=1,3`.

Campos proporcionados: `id`, `nombre`, `registro_medico`, `especialidad` y `sede`.

## Pruebas

Colección de Postman en `docs/ms-medicos.postman_collection.json` (13 validaciones)