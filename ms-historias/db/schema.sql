SET NAMES utf8mb4;

CREATE TABLE historias (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id      INT NOT NULL,
  medico_id        INT NOT NULL,
  fecha            DATE NOT NULL,
  motivo_consulta  TEXT NOT NULL,
  diagnostico      TEXT NOT NULL,
  tratamiento      TEXT NOT NULL
);

INSERT INTO historias (
  paciente_id,
  medico_id,
  fecha,
  motivo_consulta,
  diagnostico,
  tratamiento
) VALUES
  (
    1,
    2,
    '2026-10-27',
    'Motivo de consulta de ejemplo',
    'Diagnóstico de ejemplo',
    'Tratamiento de ejemplo'
  ),
  (
    2,
    1,
    '2026-10-26',
    'Motivo de consulta de ejemplo 2',
    'Diagnóstico de ejemplo 2',
    'Tratamiento de ejemplo 2'
  ),
  (
    3,
    2,
    '2026-10-27',
    'Motivo de consulta de ejemplo 3',
    'Diagnóstico de ejemplo 3',
    'Tratamiento de ejemplo 3'
  );