citascitas
-- Esquema de la base de datos del microservicio ms-citas.
SET NAMES utf8mb4;

USE citas_db;

CREATE TABLE IF NOT EXISTS citas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    medico_id INT UNSIGNED NOT NULL,
    fecha_hora DATETIME NOT NULL,
    sede VARCHAR(30) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'programada',

    INDEX idx_medico_fecha (medico_id, fecha_hora),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Registros iniciales del Taller 1.
INSERT INTO citas (
    id, paciente_id, medico_id, fecha_hora, sede, estado
)
VALUES
    (1, 1, 2, '2026-11-03 09:00:00', 'Cali', 'programada'),
    (2, 2, 1, '2026-11-03 10:30:00', 'Bogotá', 'programada'),
    (3, 3, 3, '2026-11-04 14:00:00', 'Medellín', 'atendida');
