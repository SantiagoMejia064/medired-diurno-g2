# Contrato de ms-historias — Borrador

Cada registro representa una atención médica de un paciente realizada por un médico.

## Atributos propuestos

| Campo | Tipo | Obligatorio al crear | Regla |
|---|---|---|---|
| id | Entero | No | Lo genera el servicio; es positivo y único. |
| paciente_id | Entero | Sí | Debe ser positivo. |
| medico_id | Entero | Sí | Debe ser positivo. |
| fecha | Texto | Sí | Fecha válida en formato YYYY-MM-DD. |
| motivo_consulta | Texto | Sí | No puede estar vacío. |
| diagnostico | Texto | Sí | No puede estar vacío. |
| tratamiento | Texto | Sí | No puede estar vacío. |

## Ejemplo de datos para crear una historia

POST /historias

{
  "paciente_id": 1,
  "medico_id": 2,
  "fecha": "2026-10-27",
  "motivo_consulta": "Motivo de consulta de ejemplo",
  "diagnostico": "Diagnóstico de ejemplo",
  "tratamiento": "Tratamiento de ejemplo"
}

## Relaciones

paciente_id hace referencia a un registro de ms-pacientes.
medico_id hace referencia a un registro de ms-medicos.

En el Taller 1 se valida el formato de estos identificadores.
En el Taller 3 se comprobará por REST que los registros referenciados existan.