-- db/schema.sql
SET NAMES utf8mb4;

CREATE TABLE pacientes(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    documento VARCHAR(15) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL, 
    eps VARCHAR(100) NOT NULL,
    telefono VARCHAR(10) NOT NULL
);

INSERT INTO pacientes
(nombre, documento, fecha_nacimiento, eps, telefono)
VALUES
('María Fernanda López', '1001234567', '1995-04-12', 'Sura', '3001234567'),
('Carlos Andrés Ramírez', '1023456789', '1988-09-25', 'Sanitas', '3109876543'),
('Laura Camila Torres', '1145678901', '2001-01-18', 'Nueva EPS', '3154567890');