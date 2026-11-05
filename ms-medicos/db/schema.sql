SET NAMES utf8mb4;

CREATE TABLE medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    registro_medico VARCHAR(50) NOT NULL UNIQUE,
    especialidad VARCHAR(100) NOT NULL,
    sede VARCHAR(30) NOT NULL
);

INSERT INTO medicos
(nombre, registro_medico, especialidad, sede)
VALUES
('Carlos Ramírez', 'RM-001', 'Cardiología', 'Cali'),
('Laura Gómez', 'RM-002', 'Pediatría', 'Bogotá'),
('Andrés Castillo', 'RM-003', 'Neurología', 'Medellín');